import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { ResolveAcademicAlertDto } from '../dto/principal.dto';

@Injectable()
export class PrincipalAuditAlertsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getAlerts(orgId: string, _actor: User) {
    const manager = this.drizzle;

    const alerts = await manager.query(
      `SELECT * FROM principal_academic_alerts WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [orgId],
    );

    const mappedAlerts = alerts.map(a => ({ ...a, entityType:a.entity_type,entityId:a.entity_id,assignedToName:a.assigned_to_name,createdAt:a.created_at }));

    return {
      openCount: mappedAlerts.filter((a: any) => a.status !== 'resolved').length,
      alerts: mappedAlerts,
      stats: {
        criticalCount: alerts.filter(a=>a.severity==='critical' && a.status!=='resolved').length,
        warningCount: alerts.filter(a=>a.severity==='warning' && a.status!=='resolved').length,
        infoCount: alerts.filter(a=>a.severity==='info' && a.status!=='resolved').length,
        resolvedThisWeek: alerts.filter(a=>a.resolved_at && new Date(a.resolved_at).getTime()>=Date.now()-7*86400000).length,
      },
    };
  }

  async resolveAlert(orgId: string, _actor: User, alertId: string, dto: ResolveAcademicAlertDto) {
    const rows = await this.drizzle.query(`UPDATE principal_academic_alerts SET status=$1,resolution_notes=$2,resolved_at=CASE WHEN $1='resolved' THEN now() ELSE NULL END WHERE id=$3 AND organization_id=$4 RETURNING id`, [dto.status,dto.resolutionNotes || '',alertId,orgId]);
    if (!rows.length) throw new NotFoundException('Alert not found');
    return { success:true,alertId,status:dto.status };
  }

  async getAuditOverview(orgId: string, _actor: User) {
    const rows = await this.drizzle.query(`SELECT class_name AS "className",teacher_name AS "teacherName",expected_activities AS "expectedActivities",completed_activities AS "completedActivities",execution_score AS "executionRate",breakdown_json,week_number AS week FROM principal_academic_audits WHERE organization_id=$1 AND week_number=(SELECT MAX(week_number) FROM principal_academic_audits WHERE organization_id=$1) ORDER BY class_name,teacher_name`, [orgId]);
    const gradeDistribution=await this.drizzle.query(`SELECT grade,COUNT(*)::int AS count FROM principal_exam_results WHERE organization_id=$1 AND status='Published' GROUP BY grade ORDER BY grade`,[orgId]);
    const subjectMastery=await this.drizzle.query(`SELECT subject_name AS subject,ROUND(AVG(percentage),1) AS average FROM principal_exam_results WHERE organization_id=$1 AND status='Published' GROUP BY subject_name ORDER BY subject_name`,[orgId]);
    return { gradeDistribution,subjectMastery,currentWeek:rows.length ? `Week ${rows[0].week}` : null,overallExecutionScore:rows.length?Number((rows.reduce((sum,r)=>sum+Number(r.executionRate),0)/rows.length).toFixed(1)):null,
      classesAudited:rows.map(r=>({...r,...r.breakdown_json})),teachersAudited:rows.map(r=>({...r,...r.breakdown_json})) };
  }

  async getReports(orgId: string, _actor: User) {
    return {
      availableReports: [
        {
          id: 'rep-school-perf',
          title: 'Whole-School Academic Performance & Board Readiness Dossier',
          category: 'School Level',
          format: ['PDF', 'Excel', 'CSV'],
          lastGenerated: null,
          description: 'Comprehensive analysis of grade-wise averages, board pass projections, and competency attainment.',
        },
        {
          id: 'rep-teacher-workload',
          title: 'Faculty Workload & Period Distribution Audit',
          category: 'Teacher Level',
          format: ['Excel', 'CSV'],
          lastGenerated: null,
          description: 'Period load allocation, underutilized vs overloaded faculty roster, and lesson delivery audit.',
        },
        {
          id: 'rep-class-audit',
          title: 'Section-wise Academic Execution & Attendance Defaulters',
          category: 'Class Level',
          format: ['PDF', 'CSV'],
          lastGenerated: null,
          description: 'Section comparative performance, chronic absenteeism registers, and syllabus gap analytics.',
        },
        {
          id: 'rep-student-intervention',
          title: 'CBSE Holistic Progress & Academic Intervention Register',
          category: 'Student Level',
          format: ['PDF', 'Excel'],
          lastGenerated: null,
          description: 'Individual student learning trajectory, remedial outcomes, and multidimensional competency cards.',
        },
      ],
    };
  }

  async getActivityTimeline(orgId: string, _actor: User) {
    const manager = this.drizzle;
    const auditRows = await manager.query(
      `SELECT ae.id, ae.action as title, ae.created_at, ae.details, COALESCE(u.name, 'System') as actor
       FROM audit_events ae
       LEFT JOIN users u ON u.id = ae.actor_id
       WHERE ae.organization_id = $1
       ORDER BY ae.created_at DESC
       LIMIT 30`,
      [orgId],
    );

    const events = auditRows.map((r: any) => ({
      id: r.id,
      title: r.title,
      category: 'Audit',
      time: new Date(r.created_at).toLocaleString(),
      actor: r.actor,
      details: typeof r.details === 'object' ? JSON.stringify(r.details) : String(r.details || ''),
    }));

    return { events };
  }
}

