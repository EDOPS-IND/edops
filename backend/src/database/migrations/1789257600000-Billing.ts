import { MigrationInterface, QueryRunner } from 'typeorm';

export class Billing1789257600000 implements MigrationInterface {
  async up(r: QueryRunner): Promise<void> {
    await r.query(`
      CREATE TABLE plans (
        id uuid PRIMARY KEY, name varchar(100) NOT NULL CHECK(length(btrim(name))>0),
        amount_minor integer NOT NULL CHECK(amount_minor BETWEEN 0 AND 1000000000),
        currency varchar(3) NOT NULL DEFAULT 'INR' CHECK(currency='INR'),
        billing_cycle varchar(10) NOT NULL DEFAULT 'monthly' CHECK(billing_cycle='monthly'),
        max_students integer NOT NULL CHECK(max_students BETWEEN 1 AND 100000),
        max_teachers integer NOT NULL CHECK(max_teachers BETWEEN 1 AND 10000),
        features jsonb NOT NULL CHECK(jsonb_typeof(features)='object'),
        active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE subscriptions (
        id uuid NOT NULL DEFAULT gen_random_uuid(), organization_id uuid PRIMARY KEY REFERENCES organizations(id),
        plan_id uuid NOT NULL REFERENCES plans(id), status varchar(12) NOT NULL CHECK(status IN ('trialing','active','past_due','canceled')),
        period_start timestamptz NOT NULL, period_end timestamptz NOT NULL CHECK(period_end>period_start),
        updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,id)
      );
      CREATE TABLE feature_flags (
        organization_id uuid NOT NULL REFERENCES organizations(id), feature_key varchar(20) NOT NULL CHECK(feature_key IN ('arena','recordings','communication')),
        enabled boolean NOT NULL, PRIMARY KEY(organization_id,feature_key)
      );
      CREATE TABLE invoices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
        subscription_id uuid NOT NULL, plan_id uuid NOT NULL REFERENCES plans(id),
        amount_minor integer NOT NULL CHECK(amount_minor BETWEEN 0 AND 1000000000), currency varchar(3) NOT NULL CHECK(currency='INR'),
        period_start timestamptz NOT NULL, period_end timestamptz NOT NULL,
        status varchar(10) NOT NULL DEFAULT 'open' CHECK(status IN ('open','paid','void')),
        payment_reference varchar(100), paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
        CHECK(period_end>period_start), CHECK ((status='paid')=(paid_at IS NOT NULL)),
        CHECK ((status='paid')=(payment_reference IS NOT NULL)),
        FOREIGN KEY(organization_id,subscription_id) REFERENCES subscriptions(organization_id,id)
      );
      CREATE INDEX invoices_org_idx ON invoices(organization_id,created_at DESC,id);
      CREATE UNIQUE INDEX invoices_payment_ref_idx ON invoices(payment_reference) WHERE payment_reference IS NOT NULL;
      INSERT INTO plans(id,name,amount_minor,max_students,max_teachers,features,active)
      VALUES('00000000-0000-4000-8000-000000000006','Migration trial',0,100000,10000,'{"arena":true,"recordings":true,"communication":true}',false);
      INSERT INTO subscriptions(organization_id,plan_id,status,period_start,period_end)
      SELECT id,'00000000-0000-4000-8000-000000000006','trialing',now(),now()+interval '30 days' FROM organizations;
    `);
    for (const table of ['subscriptions','feature_flags','invoices']) await r.query(`
      ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY; ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;
      CREATE POLICY organization_scope ON ${table}
      USING(organization_id=nullif(current_setting('app.current_org_id',true),'')::uuid)
      WITH CHECK(organization_id=nullif(current_setting('app.current_org_id',true),'')::uuid)`);
  }
  async down(r: QueryRunner): Promise<void> { await r.query('DROP TABLE invoices,feature_flags,subscriptions,plans'); }
}
