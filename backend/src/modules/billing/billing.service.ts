import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { isDeepStrictEqual } from 'node:util';
import { DataSource, EntityManager } from 'typeorm';
import { AcademicListDto } from '../academics/academic.dto';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/user.entity';
import { SchoolWork } from '../tenants/school-work.service';
import { CreatePlanDto, FeatureOverrideDto, PayInvoiceDto, SubscriptionDto } from './billing.dto';
import { entitlements, featureKeys, seatUsage } from './entitlements';

const planFields = `id,name,amount_minor AS "amountMinor",currency,billing_cycle AS "billingCycle",max_students AS "maxStudents",max_teachers AS "maxTeachers",features,active,created_at AS "createdAt"`;
const subscriptionFields = `id,organization_id AS "organizationId",plan_id AS "planId",status,period_start AS "periodStart",period_end AS "periodEnd",updated_at AS "updatedAt"`;
const invoiceFields = `id,organization_id AS "organizationId",subscription_id AS "subscriptionId",plan_id AS "planId",amount_minor AS "amountMinor",currency,period_start AS "periodStart",period_end AS "periodEnd",status,payment_reference AS "paymentReference",paid_at AS "paidAt",created_at AS "createdAt"`;

@Injectable()
export class BillingService {
  constructor(private readonly source: DataSource, private readonly work: SchoolWork, private readonly audit: AuditService) {}

  private async platform<T>(actor: User, fn: (m: EntityManager)=>Promise<T>) {
    return this.source.transaction(async m => {
      if (!await m.getRepository(User).existsBy({id:actor.id,isActive:true,isPlatformAdmin:true})) throw new ForbiddenException('Platform administrator access required');
      return fn(m);
    });
  }
  private scope<T>(org: string, actor: User, action: string | null, payload: unknown, key: string | undefined | null, fn: (m: EntityManager)=>Promise<T>, platform = true) {
    return this.work.run(org,actor,action,payload,key,fn,platform ? {roles:[],platform:true,authorize:async()=>{}} : undefined);
  }
  createPlan(actor: User, dto: CreatePlanDto) {
    return this.platform(actor,async m => {
      const features = Object.fromEntries(featureKeys.map(k=>[k,dto.features[k]]));
      const rows = await m.query(`INSERT INTO plans(id,name,amount_minor,max_students,max_teachers,features) VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT(id) DO NOTHING RETURNING ${planFields}`,[dto.id,dto.name,dto.amountMinor,dto.maxStudents,dto.maxTeachers,features]);
      if (!rows.length) {
        const [existing] = await m.query(`SELECT ${planFields} FROM plans WHERE id=$1`,[dto.id]);
        if (!existing || existing.name!==dto.name || existing.amountMinor!==dto.amountMinor || existing.maxStudents!==dto.maxStudents || existing.maxTeachers!==dto.maxTeachers || !isDeepStrictEqual(existing.features,features)) throw new ConflictException('Plan ID already has different immutable terms');
        return existing;
      }
      await this.audit.record(m,{organizationId:null,actorId:actor.id,action:'plan.created',details:{planId:dto.id}});
      return rows[0];
    });
  }
  plans(actor: User, q: AcademicListDto) {
    return this.platform(actor,async m => {
      const [count] = await m.query('SELECT count(*)::int AS total FROM plans');
      const items = await m.query(`SELECT ${planFields} FROM plans ORDER BY created_at DESC,id LIMIT $1 OFFSET $2`,[q.limit,q.offset]);
      return {items,total:count.total,limit:q.limit,offset:q.offset};
    });
  }
  planStatus(actor: User, id: string, active: boolean) {
    return this.platform(actor,async m => {
      const [row] = await m.query(`SELECT ${planFields} FROM plans WHERE id=$1 FOR UPDATE`,[id]);
      if (!row) throw new NotFoundException('Plan not found');
      if (row.active===active) return row;
      await m.query('UPDATE plans SET active=$2 WHERE id=$1',[id,active]);
      await this.audit.record(m,{organizationId:null,actorId:actor.id,action:'plan.status_changed',details:{planId:id,before:row.active,after:active}});
      return {...row,active};
    });
  }
  organizations(actor: User, q: AcademicListDto) {
    return this.platform(actor,async m => {
      const [count] = await m.query('SELECT count(*)::int AS total FROM organizations');
      const items = await m.query('SELECT id,name,slug,status,created_at AS "createdAt" FROM organizations ORDER BY created_at DESC,id LIMIT $1 OFFSET $2',[q.limit,q.offset]);
      return {items,total:count.total,limit:q.limit,offset:q.offset};
    });
  }
  private async overview(m: EntityManager, org: string) {
    const [subscription] = await m.query(`SELECT ${subscriptionFields} FROM subscriptions WHERE organization_id=$1`,[org]);
    return {subscription:subscription??null,entitlements:await entitlements(m,org),usage:await seatUsage(m,org),
      overrides:await m.query('SELECT feature_key AS feature,enabled FROM feature_flags WHERE organization_id=$1 ORDER BY feature_key',[org])};
  }
  get(org: string, actor: User, platform = true) {
    return this.scope(org,actor,null,null,null,m=>this.overview(m,org),platform);
  }
  subscribe(org: string, actor: User, dto: SubscriptionDto, key?: string) {
    return this.scope(org,actor,'subscription.updated',dto,key,async m => {
      const start = new Date(dto.periodStart), end = new Date(dto.periodEnd);
      const days = (end.getTime()-start.getTime())/86400000;
      if (days<=0 || days>32) throw new BadRequestException('Subscription period must be positive and no longer than 32 days');
      const [plan] = await m.query(`SELECT ${planFields} FROM plans WHERE id=$1 FOR SHARE`,[dto.planId]);
      if (!plan) throw new NotFoundException('Plan not found');
      if (!plan.active) throw new ConflictException('Plan is retired; choose an active plan');
      const usage = await seatUsage(m,org);
      if (usage.students+usage.pendingStudents>plan.maxStudents || usage.teachers+usage.pendingTeachers>plan.maxTeachers) throw new ConflictException('Plan is below current reserved seat usage');
      const [before] = await m.query(`SELECT ${subscriptionFields} FROM subscriptions WHERE organization_id=$1`,[org]);
      const [after] = await m.query(`INSERT INTO subscriptions(organization_id,plan_id,status,period_start,period_end) VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(organization_id) DO UPDATE SET plan_id=excluded.plan_id,status=excluded.status,period_start=excluded.period_start,period_end=excluded.period_end,updated_at=clock_timestamp()
        RETURNING ${subscriptionFields}`,[org,dto.planId,dto.status,start,end]);
      await this.audit.record(m,{organizationId:org,actorId:actor.id,action:'subscription.updated',details:{before:before??null,after}});
      return this.overview(m,org);
    });
  }
  override(org: string, actor: User, dto: FeatureOverrideDto) {
    return this.scope(org,actor,'feature.override_changed',dto,null,async m => {
      const [old] = await m.query('SELECT enabled FROM feature_flags WHERE organization_id=$1 AND feature_key=$2',[org,dto.feature]);
      if (dto.mode==='inherit') await m.query('DELETE FROM feature_flags WHERE organization_id=$1 AND feature_key=$2',[org,dto.feature]);
      else await m.query('INSERT INTO feature_flags(organization_id,feature_key,enabled) VALUES($1,$2,$3) ON CONFLICT(organization_id,feature_key) DO UPDATE SET enabled=excluded.enabled',[org,dto.feature,dto.mode==='enabled']);
      await this.audit.record(m,{organizationId:org,actorId:actor.id,action:'feature.override_changed',details:{feature:dto.feature,before:old?.enabled??null,after:dto.mode==='inherit'?null:dto.mode==='enabled'}});
      return this.overview(m,org);
    });
  }
  issue(org: string, actor: User, key?: string) {
    return this.scope(org,actor,'invoice.issued',{},key,async m => {
      const [s] = await m.query(`SELECT s.*,p.amount_minor,p.currency FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.organization_id=$1 FOR UPDATE OF s`,[org]);
      if (!s || !['active','past_due'].includes(s.status)) throw new ConflictException('An explicit active or past_due subscription is required');
      const [overlap] = await m.query(`SELECT id FROM invoices WHERE organization_id=$1 AND status<>'void'
        AND tstzrange(period_start,period_end,'[)') && tstzrange($2::timestamptz,$3::timestamptz,'[)')`,[org,s.period_start,s.period_end]);
      if (overlap) throw new ConflictException('A non-void invoice already covers part of this period');
      const [invoice] = await m.query(`INSERT INTO invoices(organization_id,subscription_id,plan_id,amount_minor,currency,period_start,period_end)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ${invoiceFields}`,[org,s.id,s.plan_id,s.amount_minor,s.currency,s.period_start,s.period_end]);
      await this.audit.record(m,{organizationId:org,actorId:actor.id,action:'invoice.issued',details:{invoiceId:invoice.id,amountMinor:invoice.amountMinor}});
      return invoice;
    });
  }
  invoices(org: string, actor: User, q: AcademicListDto, platform = true) {
    return this.scope(org,actor,null,null,null,async m => {
      const [count] = await m.query('SELECT count(*)::int AS total FROM invoices WHERE organization_id=$1',[org]);
      const items = await m.query(`SELECT ${invoiceFields} FROM invoices WHERE organization_id=$1 ORDER BY created_at DESC,id LIMIT $2 OFFSET $3`,[org,q.limit,q.offset]);
      return {items,total:count.total,limit:q.limit,offset:q.offset};
    },platform);
  }
  settle(org: string, actor: User, id: string, dto: PayInvoiceDto | null) {
    const target = dto ? 'paid' : 'void';
    return this.scope(org,actor,`invoice.${target}`,{id,...dto},null,async m => {
      const [row] = await m.query(`SELECT ${invoiceFields} FROM invoices WHERE organization_id=$1 AND id=$2`,[org,id]);
      if (!row) throw new NotFoundException('Invoice not found');
      if (row.status===target && (!dto || row.paymentReference===dto.paymentReference)) return row;
      if (row.status!=='open') throw new ConflictException('Only open invoices can be paid or voided');
      const [after] = await m.query(`UPDATE invoices SET status=$3::varchar,payment_reference=$4,paid_at=CASE WHEN $3::varchar='paid' THEN clock_timestamp() ELSE NULL END
        WHERE organization_id=$1 AND id=$2 RETURNING ${invoiceFields}`,[org,id,target,dto?.paymentReference??null]);
      await this.audit.record(m,{organizationId:org,actorId:actor.id,action:`invoice.${target}`,details:{invoiceId:id,before:'open',after:target}});
      return after;
    });
  }
  statistics(org: string, actor: User) {
    return this.scope(org,actor,null,null,null,async m => {
      const [counts] = await m.query(`SELECT
        (SELECT count(*)::int FROM sections WHERE organization_id=$1) AS sections,
        (SELECT count(*)::int FROM assignments WHERE organization_id=$1 AND status='published') AS "publishedAssignments",
        (SELECT count(*)::int FROM arena_attempts WHERE organization_id=$1) AS "arenaAttempts",
        (SELECT count(*)::int FROM recorded_sessions WHERE organization_id=$1 AND status='published') AS "publishedRecordings",
        (SELECT coalesce(sum(size_bytes),0)::text FROM recorded_sessions WHERE organization_id=$1 AND object_version IS NOT NULL) AS "verifiedRecordingBytes",
        (SELECT count(*)::int FROM domain_events WHERE organization_id=$1 AND failed_at IS NOT NULL) AS "failedEvents",
        (SELECT coalesce(sum(amount_minor),0)::text FROM invoices WHERE organization_id=$1 AND status='paid') AS "paidAmountMinor",
        (SELECT coalesce(sum(amount_minor),0)::text FROM invoices WHERE organization_id=$1 AND status='open') AS "openAmountMinor"`,[org]);
      return {organizationId:org,currency:'INR',...counts,usage:await seatUsage(m,org)};
    });
  }
}
