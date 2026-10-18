import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/user.entity';
import { Membership, Organization } from '../tenants/tenant.entity';
import {
  BatchFeeReminderDto,
  CreateBroadcastDto,
  CreateCourseworkDto,
  CreateCurriculumNodeDto,
  CreateDepartmentDto,
  CreateDisciplineIncidentDto,
  CreateFeeStructureDto,
  CreateLeaveRequestDto,
  CreateLibraryBookDto,
  CreateSchoolAssetDto,
  CreateTimetableEntryDto,
  CreateTransportVehicleDto,
  GrantFeeConcessionDto,
  RecordOfflinePaymentDto,
  ScheduleExamDto,
  SchedulePtmDto,
  SendFeeReminderDto,
  UpdateLeaveStatusDto,
  UpdateSchoolConfigDto,
  UpdateTeacherEmploymentDto,
  UpdateTimetableEntryDto,
} from './school-admin.dto';

import { DrizzleService } from '../../database/drizzle.service';
import { Queryable } from '../billing/entitlements';

@Injectable()
export class SchoolAdminService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
  ) {}

  private async authorize(manager: Queryable, orgId: string, actor: User, principalTimetable = false): Promise<Organization> {
    if (actor.isPlatformAdmin) {
      const [org] = await manager.query('SELECT * FROM organizations WHERE id = $1 LIMIT 1', [orgId]);
      if (!org) throw new NotFoundException('Organization not found');
      return org;
    }
    const [membership] = await manager.query(
      "SELECT * FROM memberships WHERE organization_id = $1 AND user_id = $2 AND status = 'active' LIMIT 1",
      [orgId, actor.id],
    );
    if (!membership) throw new NotFoundException('Organization not found');
    if (membership.role !== 'school_admin' && !(principalTimetable && membership.role === 'principal')) {
      throw new ForbiddenException('School administrator access required');
    }
    const [org] = await manager.query('SELECT * FROM organizations WHERE id = $1 LIMIT 1', [orgId]);
    if (!org) throw new NotFoundException('Organization not found');
    if (org.status !== 'active') throw new ForbiddenException('School is suspended');
    return org;
  }

  // 1. DASHBOARD & HEALTH SCORE
  async getDashboard(orgId: string, actor: User) {
    const manager = this.drizzle;
    await this.authorize(manager, orgId, actor);

      // Counts from real DB tables
      const [membersCount] = await manager.query(
        `SELECT
          COUNT(*) FILTER (WHERE role = 'student')::int as "totalStudents",
          COUNT(*) FILTER (WHERE role = 'student' AND status = 'active')::int as "activeStudents",
          COUNT(*) FILTER (WHERE role = 'teacher' AND status = 'active')::int as "totalTeachers",
          COUNT(*) FILTER (WHERE role IN ('staff', 'school_admin') AND status = 'active')::int as "totalStaff",
          COUNT(*) FILTER (WHERE role = 'parent' AND status = 'active')::int as "totalParents"
         FROM memberships WHERE organization_id = $1`,
        [orgId],
      );

      const [sectionsCount] = await manager.query(
        `SELECT COUNT(*)::int as total FROM sections WHERE organization_id = $1`,
        [orgId],
      );

      const [programsCount] = await manager.query(
        `SELECT COUNT(*)::int as total FROM programs WHERE organization_id = $1`,
        [orgId],
      );

      const [invitesCount] = await manager.query(
        `SELECT COUNT(*)::int as total FROM invitations WHERE organization_id = $1 AND accepted_at IS NULL AND revoked_at IS NULL`,
        [orgId],
      );

      const [feeSummary] = await manager.query(
        `SELECT
          COALESCE(SUM(total_due), 0)::bigint as "assessed",
          COALESCE(SUM(amount_paid), 0)::bigint as "collected",
          COALESCE(SUM(amount_pending), 0)::bigint as "pending",
          COUNT(*) FILTER (WHERE days_overdue > 0)::int as "defaulters"
         FROM student_fee_dues WHERE organization_id = $1`,
        [orgId],
      );

      const totalStudents = Number(membersCount?.totalStudents ?? 0);
      const activeStudents = Number(membersCount?.activeStudents ?? 0);
      const totalTeachers = Number(membersCount?.totalTeachers ?? 0);
      const totalStaff = Number(membersCount?.totalStaff ?? 0);
      const totalParents = Number(membersCount?.totalParents ?? 0);
      const totalSections = Number(sectionsCount?.total ?? 0);
      const totalClasses = Number(programsCount?.total ?? 0);
      const pendingInvites = Number(invitesCount?.total ?? 0);

      const [realAttendance] = await manager.query(
        `SELECT
          COUNT(*)::int as total_records,
          COUNT(*) FILTER (WHERE ar.status IN ('present', 'late'))::int as present_records
         FROM attendance_records ar
         JOIN attendance_sessions as_sess ON ar.attendance_session_id = as_sess.id
         WHERE as_sess.organization_id = $1`,
        [orgId],
      );
      const totalAtt = Number(realAttendance?.total_records ?? 0);
      const presentAtt = Number(realAttendance?.present_records ?? 0);
      const realAttRate = totalAtt > 0 ? Number(((presentAtt / totalAtt) * 100).toFixed(1)) : 0;

      const feeAssessed = Number(feeSummary?.assessed ?? 0);
      const feeCollected = Number(feeSummary?.collected ?? 0);
      const feePending = Number(feeSummary?.pending ?? 0);
      const feeDefaulters = Number(feeSummary?.defaulters ?? 0);
      const realFeeCollectionRate = feeAssessed > 0 ? Number(((feeCollected / feeAssessed) * 100).toFixed(1)) : 0;

      const [curriculum] = await manager.query(`SELECT AVG(actual_completion_percentage) AS progress FROM principal_curriculum_nodes WHERE organization_id=$1`, [orgId]);
      const syllabusCompletion = curriculum.progress==null?0:Number(curriculum.progress);

      // Deterministic explainable school health score (0-100)
      const overallHealth = Math.round(
        (realAttRate * 0.40) +
        (realFeeCollectionRate * 0.35) +
        (syllabusCompletion * 0.25)
      );

      const healthMetrics = {
        overall: overallHealth,
        attendanceRate: realAttRate,
        feeCollectionRate: realFeeCollectionRate,
        syllabusCompletion,
        staffRetention: null,
        governanceCompliance: null,
        infrastructureIndex: null,
      };

      // Live attention items from real DB state
      const [pendingLeavesRes] = await manager.query(
        `SELECT COUNT(*)::int as count FROM leave_requests WHERE organization_id = $1 AND status = 'pending'`,
        [orgId],
      );
      const pendingLeaves = Number(pendingLeavesRes?.count ?? 0);

      const [todayAttRes] = await manager.query(
        `SELECT COUNT(DISTINCT section_id)::int as count FROM attendance_sessions WHERE organization_id = $1 AND date = CURRENT_DATE`,
        [orgId],
      );
      const sectionsMarkedToday = Number(todayAttRes?.count ?? 0);
      const missingAttendanceCount = Math.max(0, totalSections - sectionsMarkedToday);

      const attentionItems: any[] = [];
      if (missingAttendanceCount > 0 && totalSections > 0) {
        attentionItems.push({
          id: 'att-attendance',
          severity: 'high',
          title: `${missingAttendanceCount} Class Section(s) Awaiting Today's Register`,
          description: `${sectionsMarkedToday} of ${totalSections} section registers submitted for today.`,
          action: 'Send Alert to Class Teachers',
          time: 'Today',
        });
      }
      if (feeDefaulters > 0) {
        attentionItems.push({
          id: 'att-fees',
          severity: 'medium',
          title: `${feeDefaulters} Overdue Fee Account(s) (>30 Days)`,
          description: `Outstanding student fee dues totaling ₹${feePending.toLocaleString('en-IN')}.`,
          action: 'Open Defaulters Desk',
          time: 'Active',
        });
      }
      if (pendingLeaves > 0) {
        attentionItems.push({
          id: 'att-leaves',
          severity: 'low',
          title: `${pendingLeaves} Staff Leave Request(s) Pending Approval`,
          description: 'Faculty and staff leave applications awaiting review.',
          action: 'Review Applications',
          time: 'Pending',
        });
      }
      if (pendingInvites > 0) {
        attentionItems.push({
          id: 'att-invites',
          severity: 'low',
          title: `${pendingInvites} Pending User Onboarding Invitation(s)`,
          description: 'Invited staff or parent members who have not yet activated accounts.',
          action: 'View Invitations',
          time: 'Pending',
        });
      }

      // Operational timeline derived from today's sessions
      const dailyTimeline: any[] = [];

      // Live audit activity from real audit_events
      const recentActivity = await manager.query(
        `SELECT
          a.id,
          COALESCE(u.name, u.email, 'School Admin') as actor,
          a.action,
          a.details,
          a.created_at as "createdAt"
         FROM audit_events a
         LEFT JOIN users u ON u.id = a.actor_id
         WHERE a.organization_id = $1
         ORDER BY a.created_at DESC
         LIMIT 5`,
        [orgId],
      );
      // Platform announcements
      const [org] = await manager.query(
        `SELECT o.status, p.name as plan_name
         FROM organizations o
         LEFT JOIN subscriptions s ON s.organization_id = o.id AND s.status IN ('active', 'trialing')
         LEFT JOIN plans p ON p.id = s.plan_id
         WHERE o.id = $1`, [orgId]
      );
      const status = org?.status;
      const plan = org?.plan_name?.toLowerCase() || '';
      let audienceCond = "audience = 'all'";
      if (status === 'active') audienceCond += " OR audience = 'active'";
      if (plan.includes('trial')) audienceCond += " OR audience = 'trial'";
      if (plan.includes('enterprise')) audienceCond += " OR audience = 'enterprise'";

      const platformAnnouncements = await manager.query(
        `SELECT id, title, message, type, priority, created_at AS "createdAt" FROM platform_announcements WHERE ${audienceCond} AND status = 'published' ORDER BY created_at DESC LIMIT 5`
      );

      return {
        platformAnnouncements,
        metrics: {
          totalStudents,
          activeStudents,
          totalTeachers,
          totalStaff,
          totalParents,
          totalSections,
          totalClasses,
          pendingInvites,
          feeAssessed,
          feeCollected,
          feePending,
          feeDefaulters,
        },
        health: healthMetrics,
        attentionItems,
        dailyTimeline,
        recentActivity: recentActivity.map((r: any) => ({
          id: r.id,
          actor: r.actor,
          action: String(r.action || 'system.event').replace(/\./g, ' '),
          detail: typeof r.details === 'object' && r.details ? JSON.stringify(r.details).slice(0, 80) : 'Administrative operational record',
          time: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })),
      };
  }

  // 2. PEOPLE — STUDENTS & 360 PROFILE
  async getStudents(orgId: string, actor: User, query?: { search?: string; sectionId?: string }) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const rows = await manager.query(
        `SELECT
          u.id,
          u.id as "userId",
          u.email,
          COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) as "name",
          sp.admission_number as "admissionNo",
          sp.admission_number as "admissionNumber",
          COALESCE(e.roll_number, '') as "rollNo",
          COALESCE(e.roll_number, '') as "rollNumber",
          COALESCE(s.name, '') as "section",
          COALESCE(s.name, '') as "sectionName",
          COALESCE(p.name, '') as "grade",
          COALESCE(p.name, '') as "className",
          CASE WHEN sp.status = 'active' THEN 'Active' ELSE COALESCE(sp.status, 'Active') END as "status",
          COALESCE(sp.gender, '') as "gender",
          COALESCE(sp.blood_group, '') as "bloodGroup",
          sp.guardian_name as "parentName",
          sp.guardian_name as "guardianName",
          COALESCE(sp.guardian_phone, '') as "parentPhone",
          COALESCE(sp.guardian_phone, '') as "guardianPhone",
          COALESCE(sp.dob::text, '') as "dob",
          COALESCE(sp.address, '') as "address",
          COALESCE(sp.emergency_contact, '') as "emergencyContact",
          NULL as "house",
          (SELECT CASE WHEN COUNT(*)=0 THEN NULL WHEN SUM(d.amount_pending)>0 THEN 'Due' ELSE 'Paid' END FROM student_fee_dues d WHERE d.organization_id=m.organization_id AND d.student_user_id=u.id) as "feeStatus",
          NULL as "academicStatus",
          (SELECT ROUND(AVG(CASE WHEN ar.status IN ('present','late') THEN 100.0 ELSE 0.0 END),1) FROM attendance_records ar WHERE ar.organization_id=m.organization_id AND ar.student_id=u.id) as "attendancePct",
          NULL::text as "inviteToken",
          NULL::timestamptz as "inviteExpiresAt"
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         LEFT JOIN enrollments e ON e.student_user_id = u.id AND e.organization_id = m.organization_id
         LEFT JOIN sections s ON s.id = e.section_id
         LEFT JOIN programs p ON p.id = s.program_id
         LEFT JOIN student_profiles sp ON sp.student_user_id = u.id AND sp.organization_id = m.organization_id
         WHERE m.organization_id = $1 AND m.role = 'student'

         UNION ALL

         SELECT
          i.id,
          i.id as "userId",
          i.email,
          COALESCE(NULLIF(i.name, ''), split_part(i.email, '@', 1)) as "name",
          NULL::text as "admissionNo",
          NULL::text as "admissionNumber",
          '' as "rollNo",
          '' as "rollNumber",
          COALESCE(sec.name, '') as "section",
          COALESCE(sec.name, '') as "sectionName",
          COALESCE(prog.name, '') as "grade",
          COALESCE(prog.name, '') as "className",
          'Pending Invite' as "status",
          '' as "gender",
          '' as "bloodGroup",
          NULL::text as "parentName",
          NULL::text as "guardianName",
          COALESCE(i.phone, '') as "parentPhone",
          COALESCE(i.phone, '') as "guardianPhone",
          '' as "dob",
          '' as "address",
          COALESCE(i.phone, '') as "emergencyContact",
          NULL as "house",
          'Pending' as "feeStatus",
          NULL as "academicStatus",
          NULL::numeric as "attendancePct",
          i.raw_token as "inviteToken",
          i.expires_at as "inviteExpiresAt"
         FROM invitations i
         LEFT JOIN sections sec ON sec.id = i.section_id
         LEFT JOIN programs prog ON prog.id = sec.program_id
         WHERE i.organization_id = $1 AND i.role = 'student' AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > NOW()

         ORDER BY "name"
         LIMIT 100`,
        [orgId],
      );
      return rows;
    });
  }

  async getStudent360(orgId: string, actor: User, studentUserId: string) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const [student] = await manager.query(
        `SELECT
          u.id as "userId", u.email,
          COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) as "name",
          sp.admission_number as "admissionNumber",
          COALESCE(sp.dob::text, '') as "dob",
          COALESCE(sp.gender, '') as "gender",
          COALESCE(sp.blood_group, '') as "bloodGroup",
          COALESCE(sp.guardian_name, '') as "guardianName",
          COALESCE(sp.guardian_phone, '') as "guardianPhone",
          COALESCE(sp.guardian_email, '') as "guardianEmail",
          COALESCE(sp.address, '') as "address",
          COALESCE(sp.medical_notes, '') as "medicalNotes",
          COALESCE(e.roll_number, '') as "rollNumber",
          COALESCE(s.name, '') as "sectionName",
          COALESCE(p.name, '') as "className"
         FROM users u
         JOIN memberships m ON m.user_id = u.id AND m.organization_id = $1
         LEFT JOIN student_profiles sp ON sp.student_user_id = u.id AND sp.organization_id = $1
         LEFT JOIN enrollments e ON e.student_user_id = u.id AND e.organization_id = $1
         LEFT JOIN sections s ON s.id = e.section_id
         LEFT JOIN programs p ON p.id = s.program_id
         WHERE u.id = $2`,
        [orgId, studentUserId],
      );

      if (!student) throw new NotFoundException('Student profile not found');

      const [attendance] = await manager.query(`SELECT COUNT(*)::int AS "totalSchoolDays",COUNT(*) FILTER (WHERE ar.status IN ('present','late'))::int AS "daysPresent",COUNT(*) FILTER (WHERE ar.status='absent')::int AS "daysAbsent",ROUND(AVG(CASE WHEN ar.status IN ('present','late') THEN 100.0 ELSE 0.0 END),1) AS "overallPercentage" FROM attendance_records ar JOIN attendance_sessions ats ON ats.id=ar.attendance_session_id AND ats.organization_id=ar.organization_id WHERE ar.organization_id=$1 AND ar.student_id=$2 AND ats.status='finalized'`, [orgId,studentUserId]);
      const [fees] = await manager.query(`SELECT COALESCE(SUM(total_due),0) AS "totalAssessed",COALESCE(SUM(amount_paid),0) AS "totalPaid",COALESCE(SUM(amount_pending),0) AS "balanceDue",MIN(due_date) FILTER (WHERE amount_pending>0) AS "nextDueDate" FROM student_fee_dues WHERE organization_id=$1 AND student_user_id=$2`, [orgId,studentUserId]);
      const exams = await manager.query(`SELECT exam_name AS exam,subject_name AS subject,marks_obtained AS score,max_marks AS max,grade FROM principal_exam_results WHERE organization_id=$1 AND student_user_id=$2 AND status='Published' ORDER BY published_at DESC`, [orgId,studentUserId]);
      return { profile:student,academic:{},attendance,fees,exams,documents:[] };
    });
  }

  // 3. PEOPLE — TEACHERS & WORKLOAD
  async getTeachers(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const rows = await manager.query(
        `SELECT
          u.id,
          u.id as "userId",
          m.employee_id as "empId",
          COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) as "name",
          u.email,
          COALESCE(u.phone, '-') as "phone",
          m.specialty as "department",
          'Faculty Teacher' as "designation",
          COALESCE(array_agg(DISTINCT sub.name) FILTER (WHERE sub.id IS NOT NULL),'{}') as "subjects",
          COALESCE(array_agg(DISTINCT sec.name) FILTER (WHERE sec.id IS NOT NULL),'{}') as "classes",
          to_char(m.created_at, 'YYYY-MM-DD') as "joiningDate",
          m.employment_type as "employmentType",
          (SELECT count(*)::int FROM timetable_entries t JOIN academic_years y ON y.id=t.academic_year_id AND y.organization_id=t.organization_id AND y.is_current WHERE t.organization_id=m.organization_id AND t.teacher_user_id=u.id) as "weeklyPeriods",
          28 as "maxPeriods",
          'Active' as "status",
          COUNT(DISTINCT csa.id) as "assignedSectionsCount",
          COUNT(DISTINCT csa.subject_id) as "assignedSubjectsCount",
          NULL::text as "workloadStatus",
          NULL::text as "inviteToken",
          NULL::timestamptz as "inviteExpiresAt"
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         LEFT JOIN class_subject_assignments csa ON csa.teacher_user_id = u.id AND csa.organization_id = m.organization_id
         LEFT JOIN subjects sub ON sub.id=csa.subject_id AND sub.organization_id=csa.organization_id
         LEFT JOIN sections sec ON sec.id=csa.section_id AND sec.organization_id=csa.organization_id
         WHERE m.organization_id = $1 AND m.role = 'teacher' AND m.status = 'active'
         GROUP BY u.id, u.email, u.name, u.phone, m.specialty, m.employee_id, m.employment_type, m.created_at, m.organization_id

         UNION ALL

         SELECT
          i.id,
          i.id as "userId",
          i.employee_id as "empId",
          COALESCE(NULLIF(i.name, ''), split_part(i.email, '@', 1)) as "name",
          i.email,
          COALESCE(i.phone, '-') as "phone",
          i.specialty as "department",
          'Teacher (Invited)' as "designation",
          '{}'::text[] as "subjects",
          '{}'::text[] as "classes",
          to_char(i.created_at, 'YYYY-MM-DD') as "joiningDate",
          i.employment_type as "employmentType",
          0 as "weeklyPeriods",
          28 as "maxPeriods",
          'Pending Invite' as "status",
          0 as "assignedSectionsCount",
          0 as "assignedSubjectsCount",
          'Pending' as "workloadStatus",
          i.raw_token as "inviteToken",
          i.expires_at as "inviteExpiresAt"
         FROM invitations i
         WHERE i.organization_id = $1 AND i.role = 'teacher' AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > NOW()

         ORDER BY "name"`,
        [orgId],
      );

      return rows;
    });
  }

  async updateTeacherEmployment(orgId: string, actor: User, teacherId: string, dto: UpdateTeacherEmploymentDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const [m] = await manager.query(
        `UPDATE memberships
         SET employee_id = COALESCE($3, employee_id),
             employment_type = COALESCE($4, employment_type)
         WHERE organization_id = $1 AND user_id = $2
         RETURNING employee_id as "empId", employment_type as "employmentType"`,
        [orgId, teacherId, dto.employeeId?.trim() ?? null, dto.employmentType?.trim() ?? null],
      );
      if (!m) {
        await manager.query(
          `UPDATE invitations
           SET employee_id = COALESCE($3, employee_id),
               employment_type = COALESCE($4, employment_type)
           WHERE organization_id = $1 AND id = $2`,
          [orgId, teacherId, dto.employeeId?.trim() ?? null, dto.employmentType?.trim() ?? null],
        );
      }
      return { success: true };
    });
  }

  // PEOPLE — STAFF
  async getStaff(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const rows = await manager.query(
        `SELECT
          u.id,
          u.id as "userId",
          m.employee_id as "empId",
          COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) as "name",
          u.email,
          COALESCE(u.phone, '-') as "phone",
          COALESCE(m.specialty, CASE WHEN m.role = 'principal' THEN 'Executive Leadership' ELSE 'Administration' END) as "department",
          CASE WHEN m.role = 'principal' THEN 'Principal / Head of School' ELSE 'Staff Officer' END as "designation",
          m.employment_type as "employmentType",
          to_char(m.created_at, 'YYYY-MM-DD') as "joiningDate",
          'Active' as "status",
          NULL::text as "inviteToken",
          NULL::timestamptz as "inviteExpiresAt"
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.organization_id = $1 AND m.role NOT IN ('student', 'teacher', 'parent')

         UNION ALL

         SELECT
          i.id,
          i.id as "userId",
          i.employee_id as "empId",
          COALESCE(NULLIF(i.name, ''), split_part(i.email, '@', 1)) as "name",
          i.email,
          COALESCE(i.phone, '-') as "phone",
          COALESCE(i.specialty, CASE WHEN i.role = 'principal' THEN 'Executive Leadership' ELSE 'Administration' END) as "department",
          CASE WHEN i.role = 'principal' THEN 'Principal (Invited)' ELSE 'Staff Officer (Invited)' END as "designation",
          i.employment_type as "employmentType",
          to_char(i.created_at, 'YYYY-MM-DD') as "joiningDate",
          'Pending Invite' as "status",
          i.raw_token as "inviteToken",
          i.expires_at as "inviteExpiresAt"
         FROM invitations i
         WHERE i.organization_id = $1 AND i.role IN ('staff', 'principal') AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > NOW()

         ORDER BY "name"`,
        [orgId],
      );
      return rows;
    });
  }

  // PEOPLE — PARENTS
  async getParents(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const rows = await manager.query(
        `SELECT
          u.id,
          COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)) as "name",
          u.email,
          COALESCE(u.phone, '-') as "mobile",
          'Guardian' as "relationship",
          NULL as "occupation",
          NULL as "address",
          COALESCE(u.phone, '-') as "emergencyContact",
          'Active' as "accountStatus",
          NULL as "invitationStatus",
          COALESCE((
            SELECT json_agg(json_build_object(
              'id', s_u.id,
              'studentId', s_u.id,
              'name', COALESCE(NULLIF(s_u.name, ''), split_part(s_u.email, '@', 1)),
              'studentName', COALESCE(NULLIF(s_u.name, ''), split_part(s_u.email, '@', 1)),
              'grade', COALESCE(prog.name, ''),
              'section', COALESCE(sec.name, ''),
              'class', COALESCE(prog.name, '') || ' ' || COALESCE(sec.name, '')
            ))
            FROM parent_student_relationships psr
            JOIN users s_u ON s_u.id = psr.student_id
            LEFT JOIN enrollments enr ON enr.student_user_id = s_u.id AND enr.organization_id = m.organization_id AND enr.status = 'active'
            LEFT JOIN sections sec ON sec.id = enr.section_id
            LEFT JOIN programs prog ON prog.id = sec.program_id
            WHERE psr.school_id = m.organization_id AND psr.parent_id = u.id AND psr.status = 'active'
          ), '[]'::json) as "children",
          json_build_object('attendance', true, 'fees', true, 'exams', true, 'assignments', true, 'communication', true, 'transport', true) as "permissions",
          NULL::text as "inviteToken",
          NULL::timestamptz as "inviteExpiresAt"
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.organization_id = $1 AND m.role = 'parent'

         UNION ALL

         SELECT
          i.id,
          COALESCE(NULLIF(i.name, ''), split_part(i.email, '@', 1)) as "name",
          i.email,
          COALESCE(i.phone, '-') as "mobile",
          'Guardian' as "relationship",
          NULL as "occupation",
          NULL as "address",
          COALESCE(i.phone, '-') as "emergencyContact",
          'Pending Invite' as "accountStatus",
          'Pending' as "invitationStatus",
          COALESCE((
            SELECT json_agg(json_build_object(
              'id', s_u.id,
              'studentId', s_u.id,
              'name', COALESCE(NULLIF(s_u.name, ''), split_part(s_u.email, '@', 1)),
              'studentName', COALESCE(NULLIF(s_u.name, ''), split_part(s_u.email, '@', 1)),
              'grade', COALESCE(prog.name, ''),
              'section', COALESCE(sec.name, ''),
              'class', COALESCE(prog.name, '') || ' ' || COALESCE(sec.name, '')
            ))
            FROM users s_u
            LEFT JOIN enrollments enr ON enr.student_user_id = s_u.id AND enr.organization_id = i.organization_id AND enr.status = 'active'
            LEFT JOIN sections sec ON sec.id = enr.section_id
            LEFT JOIN programs prog ON prog.id = sec.program_id
            WHERE i.child_student_ids IS NOT NULL AND (i.child_student_ids::jsonb) ? s_u.id::text
          ), '[]'::json) as "children",
          json_build_object('attendance', true, 'fees', true, 'exams', true, 'assignments', true, 'communication', true, 'transport', true) as "permissions",
          i.raw_token as "inviteToken",
          i.expires_at as "inviteExpiresAt"
         FROM invitations i
         WHERE i.organization_id = $1 AND i.role = 'parent' AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > NOW()

         ORDER BY "name"`,
        [orgId],
      );
      return rows;
    });
  }

  async updateParentChildren(orgId: string, actor: User, parentId: string, studentUserIds: string[]) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      // 1. Check if parentId is an invitation
      const [invite] = await manager.query(
        'SELECT id FROM invitations WHERE organization_id = $1 AND id = $2',
        [orgId, parentId],
      );

      if (invite) {
        await manager.query(
          'UPDATE invitations SET child_student_ids = $1 WHERE id = $2',
          [JSON.stringify(studentUserIds), parentId],
        );
        return { success: true, count: studentUserIds.length };
      }

      // 2. Active parent user
      const validStudentIds = studentUserIds && studentUserIds.length > 0 ? studentUserIds : [];

      if (validStudentIds.length === 0) {
        await manager.query(
          `UPDATE parent_student_relationships
           SET status = 'inactive'
           WHERE school_id = $1 AND parent_id = $2`,
          [orgId, parentId],
        );
      } else {
        await manager.query(
          `UPDATE parent_student_relationships
           SET status = 'inactive'
           WHERE school_id = $1 AND parent_id = $2 AND NOT (student_id = ANY($3::uuid[]))`,
          [orgId, parentId, validStudentIds],
        );

        for (const studentId of validStudentIds) {
          await manager.query(
            `INSERT INTO parent_student_relationships (school_id, parent_id, student_id, verification_status, status)
             VALUES ($1, $2, $3, 'verified', 'active')
             ON CONFLICT (school_id, parent_id, student_id)
             DO UPDATE SET status = 'active', verification_status = 'verified'`,
            [orgId, parentId, studentId],
          );
        }

        await manager.query(
          `UPDATE student_profiles sp
           SET guardian_name = COALESCE(NULLIF(u.name, ''), split_part(u.email, '@', 1)),
               guardian_phone = COALESCE(u.phone, '')
           FROM users u
           WHERE u.id = $2 AND sp.organization_id = $1 AND sp.student_user_id = ANY($3::uuid[])`,
          [orgId, parentId, validStudentIds],
        );
      }

      return { success: true, count: validStudentIds.length };
    });
  }

  // 4. PEOPLE — DEPARTMENTS
  async getDepartments(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const rows = await manager.query(
        `SELECT 
          d.id,
          d.name,
          d.code,
          d.head_teacher_name as "headName",
          u.email as "headEmail",
          COALESCE(
            NULLIF(
              (SELECT COUNT(DISTINCT csa.teacher_user_id)::int 
               FROM subjects s 
               JOIN class_subject_assignments csa ON csa.subject_id = s.id AND csa.organization_id = d.organization_id
               WHERE s.department_id = d.id),
              0
            ),
            d.faculty_count
          ) as "teachersCount",
          NULL as "staffCount",
          COALESCE(
            NULLIF(
              (SELECT COUNT(DISTINCT enr.student_user_id)::int 
               FROM subjects s 
               JOIN class_subject_assignments csa ON csa.subject_id = s.id AND csa.organization_id = d.organization_id
               JOIN enrollments enr ON enr.section_id = csa.section_id AND enr.organization_id = d.organization_id AND enr.status = 'active'
               WHERE s.department_id = d.id),
              0
            ),
            d.student_load
          ) as "studentsCount",
          NULL as "classesCount",
          COALESCE(d.attendance_rate, 95) as "avgAttendancePct",
          COALESCE(d.syllabus_progress, 0) as "syllabusCompletionPct",
          'Active' as "status",
          COALESCE(d.location, '') as "location",
          COALESCE((
            SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'code', s.code) ORDER BY s.name)
            FROM subjects s
            WHERE s.organization_id = d.organization_id AND s.department_id = d.id
          ), '[]'::json) as "subjects"
         FROM school_departments d
         LEFT JOIN users u ON u.id = d.head_teacher_id
         WHERE d.organization_id = $1 
         ORDER BY d.name`,
        [orgId],
      );

      return rows;
    });
  }

  async createDepartment(orgId: string, actor: User, dto: CreateDepartmentDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      let headName = dto.headTeacherName || 'Department Head';
      if (dto.headTeacherId) {
        const [t] = await manager.query(
          `SELECT COALESCE(NULLIF(name, ''), split_part(email, '@', 1)) as name FROM users WHERE id = $1`,
          [dto.headTeacherId],
        );
        if (t?.name) headName = t.name;
      }

      const subjectIds = dto.subjectIds && dto.subjectIds.length > 0 ? dto.subjectIds : [];
      let facultyCount = 0;
      let studentLoad = 0;

      if (subjectIds.length > 0) {
        const [stats] = await manager.query(
          `SELECT 
            COUNT(DISTINCT csa.teacher_user_id)::int as "facultyCount",
            COUNT(DISTINCT enr.student_user_id)::int as "studentLoad"
           FROM subjects s
           LEFT JOIN class_subject_assignments csa ON csa.subject_id = s.id AND csa.organization_id = $1
           LEFT JOIN enrollments enr ON enr.section_id = csa.section_id AND enr.organization_id = $1 AND enr.status = 'active'
           WHERE s.organization_id = $1 AND s.id = ANY($2::uuid[])`,
          [orgId, subjectIds],
        );
        facultyCount = stats?.facultyCount || 0;
        studentLoad = stats?.studentLoad || 0;
      }

      const [dept] = await manager.query(
        `INSERT INTO school_departments (organization_id, name, code, head_teacher_id, head_teacher_name, faculty_count, student_load, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [orgId, dto.name, dto.code.toUpperCase(), dto.headTeacherId || null, headName, facultyCount, studentLoad, dto.location || null],
      );

      if (subjectIds.length > 0) {
        await manager.query(
          `UPDATE subjects SET department_id = $1 WHERE organization_id = $2 AND id = ANY($3::uuid[])`,
          [dept.id, orgId, subjectIds],
        );
      }

      await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action: 'department.created' });
      return dept;
    });
  }

  // 5. ACADEMICS & TIMETABLE
  async getAcademicsOverview(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const years = await manager.query(
        `SELECT * FROM academic_years WHERE organization_id = $1 ORDER BY start_date DESC`,
        [orgId],
      );

      const sections = await manager.query(
        `SELECT
          s.id, s.name, s.capacity, p.name as "programName",
          COUNT(e.id) as "enrolledCount",
          (COUNT(e.id) > s.capacity) as "isOverCapacity"
         FROM sections s
         JOIN programs p ON p.id = s.program_id
         LEFT JOIN enrollments e ON e.section_id = s.id AND e.status = 'active'
         WHERE s.organization_id = $1
         GROUP BY s.id, s.name, s.capacity, p.name
         ORDER BY p.name, s.name`,
        [orgId],
      );

      const subjects = await manager.query(
        `SELECT s.*,
          COALESCE(COUNT(DISTINCT csa.teacher_user_id), 0) as "assignedTeachersCount"
         FROM subjects s
         LEFT JOIN class_subject_assignments csa ON csa.subject_id = s.id
         WHERE s.organization_id = $1
         GROUP BY s.id
         ORDER BY s.name`,
        [orgId],
      );

      const curriculum=await manager.query(`SELECT id,grade,subject_name AS subject,unit_name AS unit,chapter_name AS chapter,actual_completion_percentage AS "completionPct",status FROM principal_curriculum_nodes WHERE organization_id=$1 ORDER BY grade,subject_name,created_at`,[orgId]);
      const events=await manager.query(`SELECT id,title,event_date AS date,start_time AS time FROM ptm_schedules WHERE organization_id=$1 ORDER BY event_date`,[orgId]);
      const programs = await manager.query(
        `SELECT id, name, sequence_order as "sequenceOrder" FROM programs WHERE organization_id = $1 ORDER BY sequence_order, name`,
        [orgId],
      );
      return {
        curriculum,events,
        currentYear: years.find((y: any) => y.is_current) || years[0] || null,
        academicYears: years,
        programs,
        sections,
        subjects,
      };
    });
  }

  async createCurriculumNode(orgId: string, actor: User, dto: CreateCurriculumNodeDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const [currentYear] = await manager.query(
        `SELECT id FROM academic_years WHERE organization_id = $1 AND is_current = true LIMIT 1`,
        [orgId],
      );

      let subjectId = dto.subjectId || null;
      if (!subjectId && dto.subjectName) {
        const [subRow] = await manager.query(
          `SELECT id FROM subjects WHERE organization_id = $1 AND name ILIKE $2 LIMIT 1`,
          [orgId, dto.subjectName.trim()],
        );
        if (subRow) subjectId = subRow.id;
      }

      const formattedGrade = dto.grade.trim().startsWith('Class ')
        ? dto.grade.trim()
        : `Class ${dto.grade.trim()}`;

      const [node] = await manager.query(
        `INSERT INTO principal_curriculum_nodes (
           organization_id, academic_year_id, board, grade, subject_id, subject_name,
           unit_name, chapter_name, expected_completion_week, actual_completion_percentage,
           learning_outcomes, status
         ) VALUES ($1, $2, 'CBSE', $3, $4, $5, $6, $7, $8, 0, $9, 'On Track')
         RETURNING id, grade, subject_name AS subject, unit_name AS unit, chapter_name AS chapter,
                   actual_completion_percentage AS "completionPct", status`,
        [
          orgId,
          currentYear?.id || null,
          formattedGrade,
          subjectId,
          dto.subjectName.trim(),
          dto.unitName.trim(),
          dto.chapterName.trim(),
          dto.expectedCompletionWeek || 10,
          dto.learningOutcomes || [],
        ],
      );
      return node;
    });
  }

  async getTimetable(orgId: string, actor: User, sectionId?: string) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor, true);

      let query = `
        SELECT
          t.*, s.name as "sectionName", p.name as "programName",
          sub.name as "subjectName", sub.code as "subjectCode",
          u.email as "teacherEmail", COALESCE(u.name, u.email) AS "teacherName"
        FROM timetable_entries t
        JOIN academic_years y ON y.id = t.academic_year_id AND y.organization_id = t.organization_id AND y.is_current = true
        JOIN sections s ON s.id = t.section_id AND s.organization_id = t.organization_id
        JOIN programs p ON p.id = s.program_id AND p.organization_id = t.organization_id
        JOIN subjects sub ON sub.id = t.subject_id AND sub.organization_id = t.organization_id
        JOIN users u ON u.id = t.teacher_user_id
        WHERE t.organization_id = $1
      `;
      const params: any[] = [orgId];
      if (sectionId) {
        query += ` AND t.section_id = $2`;
        params.push(sectionId);
      }
      query += ` ORDER BY t.day_of_week, t.period_number`;

      const entries = await manager.query(query, params);

      // Automated conflict detection
      const conflicts = await manager.query(
        `SELECT
          t1.teacher_user_id as "teacherUserId",
          u.email as "teacherEmail",
          t1.day_of_week as "dayOfWeek",
          t1.period_number as "periodNumber",
          s1.name as "firstSection",
          s2.name as "secondSection"
         FROM timetable_entries t1
         JOIN timetable_entries t2 ON t1.organization_id = t2.organization_id
           AND t1.id != t2.id
           AND t1.teacher_user_id = t2.teacher_user_id
           AND t1.day_of_week = t2.day_of_week
           AND t1.period_number = t2.period_number
           AND t1.academic_year_id = t2.academic_year_id
         JOIN academic_years y ON y.id = t1.academic_year_id AND y.organization_id = t1.organization_id AND y.is_current = true
         JOIN users u ON u.id = t1.teacher_user_id
         JOIN sections s1 ON s1.id = t1.section_id AND s1.organization_id = t1.organization_id
         JOIN sections s2 ON s2.id = t2.section_id AND s2.organization_id = t2.organization_id
         WHERE t1.organization_id = $1
         LIMIT 10`,
        [orgId],
      );

      return { entries, conflicts };
    });
  }

  async createTimetableEntry(orgId: string, actor: User, dto: CreateTimetableEntryDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor, true);
      // ponytail: one school-wide lock makes clash checks atomic; split by period if contention grows.
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [orgId]);

      let academicYearId = dto.academicYearId;
      if (!academicYearId) {
        const [year] = await manager.query(
          `SELECT id FROM academic_years WHERE organization_id = $1 AND is_current = true LIMIT 1`,
          [orgId],
        );
        academicYearId = year?.id;
      }
      if (!academicYearId) throw new BadRequestException('Create an active academic year first');
      if (dto.startTime >= dto.endTime) throw new BadRequestException('End time must be after start time');
      await this.validateTimetableSlot(manager, orgId, academicYearId, dto.sectionId, dto.subjectId,
        dto.teacherUserId, dto.dayOfWeek, dto.periodNumber, dto.startTime, dto.endTime, dto.roomNumber || '');

      const [entry] = await manager.query(
        `INSERT INTO timetable_entries
          (organization_id, academic_year_id, section_id, subject_id, teacher_user_id, day_of_week, period_number, start_time, end_time, room_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          orgId,
          academicYearId,
          dto.sectionId,
          dto.subjectId,
          dto.teacherUserId,
          dto.dayOfWeek,
          dto.periodNumber,
          dto.startTime,
          dto.endTime,
          dto.roomNumber || '',
        ],
      );

      await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action: 'timetable.created' });
      return entry;
    });
  }

  async updateTimetableEntry(orgId: string, actor: User, id: string, dto: UpdateTimetableEntryDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor, true);
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [orgId]);

      const [existing] = await manager.query(
        `SELECT * FROM timetable_entries WHERE id = $1 AND organization_id = $2`,
        [id, orgId],
      );
      if (!existing) {
        throw new NotFoundException('Timetable entry not found');
      }

      const startTime = dto.startTime || existing.start_time;
      const endTime = dto.endTime || existing.end_time;
      if (startTime >= endTime) throw new BadRequestException('End time must be after start time');
      await this.validateTimetableSlot(manager, orgId, dto.academicYearId || existing.academic_year_id,
        dto.sectionId || existing.section_id, dto.subjectId || existing.subject_id,
        dto.teacherUserId || existing.teacher_user_id, dto.dayOfWeek ?? existing.day_of_week,
        dto.periodNumber ?? existing.period_number, startTime, endTime, dto.roomNumber ?? existing.room_number, id);

      const [updated] = await manager.query(
        `UPDATE timetable_entries
         SET academic_year_id = COALESCE($11, academic_year_id),
             section_id = COALESCE($1, section_id),
             subject_id = COALESCE($2, subject_id),
             teacher_user_id = COALESCE($3, teacher_user_id),
             day_of_week = COALESCE($4, day_of_week),
             period_number = COALESCE($5, period_number),
             start_time = COALESCE($6, start_time),
             end_time = COALESCE($7, end_time),
             room_number = COALESCE($8, room_number)
         WHERE id = $9 AND organization_id = $10
         RETURNING *`,
        [
          dto.sectionId || null,
          dto.subjectId || null,
          dto.teacherUserId || null,
          dto.dayOfWeek ?? null,
          dto.periodNumber ?? null,
          dto.startTime || null,
          dto.endTime || null,
          dto.roomNumber !== undefined ? dto.roomNumber : null,
          id,
          orgId,
          dto.academicYearId || null,
        ],
      );

      await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action: 'timetable.updated' });
      return updated;
    });
  }

  async deleteTimetableEntry(orgId: string, actor: User, id: string) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor, true);

      const [deleted] = await manager.query(
        `DELETE FROM timetable_entries WHERE id = $1 AND organization_id = $2 RETURNING id`,
        [id, orgId],
      );
      if (!deleted) {
        throw new NotFoundException('Timetable entry not found');
      }

      await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action: 'timetable.deleted' });
      return { success: true, id };
    });
  }

  private async validateTimetableSlot(manager: Queryable, orgId: string, yearId: string,
    sectionId: string, subjectId: string, teacherId: string, day: number, period: number,
    startTime: string, endTime: string, room: string, excludeId?: string) {
    const [valid] = await manager.query(`SELECT 1 FROM sections s JOIN subjects sub ON sub.id = $4 AND sub.organization_id = $1
      JOIN memberships m ON m.user_id = $5 AND m.organization_id = $1 AND m.role = 'teacher' AND m.status = 'active'
      JOIN users u ON u.id = m.user_id AND u.is_active = true
      WHERE s.id = $3 AND s.organization_id = $1 AND s.academic_year_id = $2`,
      [orgId, yearId, sectionId, subjectId, teacherId]);
    if (!valid) throw new BadRequestException('Choose a class, subject and active teacher from this school and academic year');
    const [clash] = await manager.query(`SELECT id FROM timetable_entries WHERE organization_id = $1
      AND academic_year_id = $2 AND day_of_week = $3
      AND (period_number = $4 OR (start_time < $9 AND end_time > $8))
      AND (teacher_user_id = $5 OR section_id = $6 OR (BTRIM($7) <> '' AND LOWER(BTRIM(room_number)) = LOWER(BTRIM($7))))
      AND ($10::uuid IS NULL OR id <> $10::uuid) LIMIT 1`,
      [orgId, yearId, day, period, teacherId, sectionId, room, startTime, endTime, excludeId || null]);
    if (clash) throw new ConflictException('Teacher, class or room is already booked for this period');
  }

  // 6. ATTENDANCE & LEAVES
  async getAttendanceRegisters(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const recentSessions = await manager.query(
        `SELECT a.*, s.name as "sectionName", u.email as "teacherEmail",
           (SELECT COUNT(*)::int FROM attendance_records r WHERE r.organization_id=a.organization_id AND r.attendance_session_id=a.id) AS "totalCount",
           (SELECT COUNT(*)::int FROM attendance_records r WHERE r.organization_id=a.organization_id AND r.attendance_session_id=a.id AND r.status='present') AS "presentCount",
           (SELECT COUNT(*)::int FROM attendance_records r WHERE r.organization_id=a.organization_id AND r.attendance_session_id=a.id AND r.status='absent') AS "absentCount",
           (SELECT COUNT(*)::int FROM attendance_records r WHERE r.organization_id=a.organization_id AND r.attendance_session_id=a.id AND r.status='late') AS "lateCount"
         FROM attendance_sessions a
         JOIN sections s ON s.id = a.section_id
         JOIN users u ON u.id = a.taken_by
         WHERE a.organization_id = $1
         ORDER BY a.date DESC, a.period
         LIMIT 50`,
        [orgId],
      );

      const defaulters = await manager.query(
        `SELECT
           coalesce(u.name, 'Student') as "studentName",
           coalesce(e.roll_number, '') as "rollNumber",
           coalesce(sec.name, 'Class') as "section",
           ROUND((COUNT(CASE WHEN r.status = 'present' THEN 1 END)::numeric / NULLIF(COUNT(r.id), 0)) * 100, 1)::float as "attendancePct",
           COUNT(CASE WHEN r.status = 'absent' THEN 1 END)::int as "consecutiveDaysAbsent",
           coalesce(u.phone, '') as "parentPhone"
         FROM enrollments e
         JOIN users u ON u.id = e.student_user_id
         LEFT JOIN sections sec ON sec.id = e.section_id AND sec.organization_id = e.organization_id
         JOIN attendance_records r ON r.student_id = e.student_user_id AND r.organization_id = e.organization_id
         WHERE e.organization_id = $1 AND e.status = 'active'
         GROUP BY u.name, e.roll_number, sec.name, u.phone
         HAVING COUNT(r.id) >= 1 AND (COUNT(CASE WHEN r.status = 'present' THEN 1 END)::float / COUNT(r.id)) < 0.75
         ORDER BY "attendancePct" ASC
         LIMIT 20`,
        [orgId],
      );

      return { recentSessions, defaulters };
    });
  }

  async getLeaves(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      return manager.query(
        `SELECT * FROM leave_requests WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [orgId],
      );
    });
  }

  async createLeaveRequest(orgId: string, actor: User, dto: CreateLeaveRequestDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const [req] = await manager.query(
        `INSERT INTO leave_requests
          (organization_id, user_id, applicant_name, applicant_role, leave_type, start_date, end_date, days_count, reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          orgId,
          actor.id,
          dto.applicantName || actor.email,
          dto.applicantRole || 'student',
          dto.leaveType,
          dto.startDate,
          dto.endDate,
          dto.daysCount || 1,
          dto.reason,
        ],
      );
      await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action: 'leave.requested' });
      return req;
    });
  }

  async updateLeaveStatus(orgId: string, actor: User, id: string, dto: UpdateLeaveStatusDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const [updated] = await manager.query(
        `UPDATE leave_requests
         SET status = $1, reviewed_by = $2, reviewed_at = now(), review_notes = $3
         WHERE id = $4 AND organization_id = $5
         RETURNING *`,
        [dto.status, actor.id, dto.reviewNotes || null, id, orgId],
      );
      if (!updated) throw new NotFoundException('Leave request not found');
      await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action: `leave.${dto.status}` });
      return updated;
    });
  }

  // 7. FINANCE & FEES
  async getFinanceOverview(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const structures = await manager.query(
        `SELECT * FROM fee_structures WHERE organization_id = $1 ORDER BY name`,
        [orgId],
      );

      const dues = await manager.query(
        `SELECT d.*,
                p.name AS guardian_name,
                p.phone AS guardian_phone
         FROM student_fee_dues d
         LEFT JOIN LATERAL (
           SELECT u.name, u.phone
           FROM parent_student_relationships psr
           JOIN users u ON u.id = psr.parent_id
           WHERE psr.school_id = d.organization_id
             AND psr.student_id = d.student_user_id
             AND psr.status = 'active'
           ORDER BY psr.created_at ASC
           LIMIT 1
         ) p ON true
         WHERE d.organization_id = $1
         ORDER BY d.days_overdue DESC LIMIT 50`,
        [orgId],
      );

      const academicYears = await manager.query(
        `SELECT id, name, is_current FROM academic_years WHERE organization_id = $1 ORDER BY start_date DESC`,
        [orgId],
      );

      const programs = await manager.query(
        `SELECT id, name FROM programs WHERE organization_id = $1 ORDER BY sequence_order, name`,
        [orgId],
      );

      return { structures, dues, academicYears, programs };
    });
  }

  async createFeeStructure(orgId: string, actor: User, dto: CreateFeeStructureDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const total = dto.tuitionFee + dto.developmentFee + dto.labFee + dto.libraryFee + dto.transportFee;
      const [res] = await manager.query(
        `INSERT INTO fee_structures
          (organization_id, name, grade, academic_year_id, tuition_fee, development_fee, lab_fee, library_fee, transport_fee, total_annual, installments_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          orgId,
          dto.name,
          dto.grade,
          dto.academicYearId || null,
          dto.tuitionFee,
          dto.developmentFee,
          dto.labFee,
          dto.libraryFee,
          dto.transportFee,
          total,
          dto.installmentsCount || 4,
        ],
      );
      await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action: 'fee_structure.created' });
      return res;
    });
  }

  async sendFeeReminder(orgId: string, actor: User, dto: SendFeeReminderDto) {
    if (dto.channel && dto.channel!=='in_app') throw new BadRequestException('External delivery is not configured; use the parent inbox');
    return this.drizzle.transaction(async m=>{
      await this.authorize(m,orgId,actor);
      const [due]=await m.query(`SELECT * FROM student_fee_dues WHERE organization_id=$1 AND id=$2 FOR UPDATE`,[orgId,dto.dueId]);
      if (!due) throw new NotFoundException('Fee record not found');
      const recipients=await m.query(`SELECT DISTINCT psr.parent_id FROM parent_student_relationships psr JOIN memberships mem ON mem.organization_id=psr.school_id AND mem.user_id=psr.parent_id AND mem.role='parent' AND mem.status='active' WHERE psr.school_id=$1 AND psr.student_id=$2 AND psr.verification_status='verified' AND psr.status='active'`,[orgId,due.student_user_id]);
      if (!recipients.length) throw new NotFoundException('No verified parent inbox is linked to this student');
      for (const recipient of recipients) await m.query(`INSERT INTO teacher_messages (organization_id,sender_id,recipient_id,recipient_role,subject_line,body) VALUES ($1,$2,$3,'parent','School fee reminder',$4)`,[orgId,actor.id,recipient.parent_id,`Outstanding fee for ${due.student_name}: ₹${Number(due.amount_pending).toLocaleString('en-IN')}. Due date: ${String(due.due_date).slice(0,10)}.`]);
      await m.query(`UPDATE student_fee_dues SET last_reminder_sent_at=now() WHERE organization_id=$1 AND id=$2`,[orgId,dto.dueId]);
      await this.audit.record(m,{organizationId:orgId,actorId:actor.id,action:'fee.reminder_sent',details:{dueId:dto.dueId,channel:'in_app',recipients:recipients.length}});
      return {success:true,channel:'in_app',recipientCount:recipients.length};
    });
  }

  async batchSendFeeReminders(orgId: string, actor: User, dto?: BatchFeeReminderDto) {
    return this.drizzle.transaction(async (m) => {
      await this.authorize(m, orgId, actor);
      const unpaidDues = await m.query(
        `SELECT id, student_user_id, student_name, amount_pending, due_date
         FROM student_fee_dues
         WHERE organization_id = $1 AND amount_pending > 0`,
        [orgId],
      );

      let sentCount = 0;
      for (const due of unpaidDues) {
        const recipients = await m.query(
          `SELECT DISTINCT psr.parent_id
           FROM parent_student_relationships psr
           JOIN memberships mem ON mem.organization_id = psr.school_id AND mem.user_id = psr.parent_id AND mem.role = 'parent' AND mem.status = 'active'
           WHERE psr.school_id = $1 AND psr.student_id = $2 AND psr.verification_status = 'verified' AND psr.status = 'active'`,
          [orgId, due.student_user_id],
        );

        if (recipients.length > 0) {
          for (const recipient of recipients) {
            await m.query(
              `INSERT INTO teacher_messages (organization_id, sender_id, recipient_id, recipient_role, subject_line, body)
               VALUES ($1, $2, $3, 'parent', 'School fee reminder', $4)`,
              [
                orgId,
                actor.id,
                recipient.parent_id,
                `Outstanding fee for ${due.student_name}: ₹${Number(due.amount_pending).toLocaleString('en-IN')}. Due date: ${String(due.due_date).slice(0, 10)}.`,
              ],
            );
          }
          await m.query(
            `UPDATE student_fee_dues SET last_reminder_sent_at = now() WHERE organization_id = $1 AND id = $2`,
            [orgId, due.id],
          );
          sentCount++;
        }
      }

      await this.audit.record(m, {
        organizationId: orgId,
        actorId: actor.id,
        action: 'fee.batch_reminders_sent',
        details: { totalUnpaid: unpaidDues.length, sentCount, channel: 'in_app' },
      });

      return {
        success: true,
        channel: 'in_app',
        totalUnpaid: unpaidDues.length,
        sentCount,
      };
    });
  }

  async recordOfflinePayment(orgId: string, actor: User, dto: RecordOfflinePaymentDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const [due] = await manager.query(
        `SELECT * FROM student_fee_dues WHERE organization_id = $1 AND id = $2 FOR UPDATE`,
        [orgId, dto.dueId],
      );
      if (!due) throw new NotFoundException('Fee record not found');

      const paymentAmt = Number(dto.amount);
      const newPaid = Number(due.amount_paid || 0) + paymentAmt;
      const newPending = Math.max(0, Number(due.amount_pending || 0) - paymentAmt);
      const newStatus = newPending <= 0 ? 'paid' : 'partial';

      const [updated] = await manager.query(
        `UPDATE student_fee_dues
         SET amount_paid = $1,
             amount_pending = $2,
             status = $3
         WHERE id = $4 AND organization_id = $5
         RETURNING *`,
        [newPaid, newPending, newStatus, dto.dueId, orgId],
      );

      await this.audit.record(manager, {
        organizationId: orgId,
        actorId: actor.id,
        action: 'fee.payment_recorded',
        details: {
          dueId: dto.dueId,
          studentName: due.student_name,
          amount: paymentAmt,
          paymentMode: dto.paymentMode || 'cash',
          referenceNo: dto.referenceNo || null,
        },
      });

      return updated;
    });
  }

  async grantFeeConcession(orgId: string, actor: User, dto: GrantFeeConcessionDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const [due] = await manager.query(
        `UPDATE student_fee_dues
         SET concession_amount = concession_amount + $1,
             amount_pending = GREATEST(0, amount_pending - $1),
             status = CASE WHEN (amount_pending - $1) <= 0 THEN 'paid' ELSE status END,
             concession_reason = $2
         WHERE id = $3 AND organization_id = $4
         RETURNING *`,
        [dto.concessionAmount, dto.concessionReason, dto.dueId, orgId],
      );
      if (!due) throw new NotFoundException('Fee record not found');
      await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action: 'fee.concession_granted' });
      return due;
    });
  }

  // 8. COMMUNICATION — BROADCASTS
  async getBroadcasts(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      return manager.query(
        `SELECT * FROM school_broadcasts WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [orgId],
      );
    });
  }

  async getCommunicationTickets(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      try {
        const rows = await manager.query(
          `SELECT tm.*, su.name as sender_name, su.email as sender_email, sm.role as sender_role
           FROM teacher_messages tm
           LEFT JOIN users su ON su.id = tm.sender_id
           LEFT JOIN memberships sm ON sm.user_id = tm.sender_id AND sm.organization_id = tm.organization_id
           WHERE tm.organization_id = $1 AND (tm.recipient_role = 'school_admin' OR tm.recipient_id = $2)
           ORDER BY tm.created_at DESC`,
          [orgId, actor.id]
        );
        if (rows && rows.length > 0) {
          return rows.map((m: any) => ({
            id: m.id,
            senderName: m.sender_name || 'Academic Staff',
            senderRole: m.sender_role ? m.sender_role.charAt(0).toUpperCase() + m.sender_role.slice(1) : 'Teacher',
            subject: m.subject_line,
            snippet: m.body,
            priority: m.priority === 'urgent' ? 'Urgent' : 'High',
            status: m.is_read ? 'Resolved' : 'Open',
            timestamp: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            assignedTo: 'Academic Admin Desk',
          }));
        }
      } catch (error) { throw error; }

      return [];
    });
  }

  async createBroadcast(orgId: string, actor: User, dto: CreateBroadcastDto) {
    if (!dto.channels.length || dto.channels.some(c=>c!=='in_app')) throw new BadRequestException('Only the in-app noticeboard is configured; external delivery is unavailable');
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const [b] = await manager.query(
        `INSERT INTO school_broadcasts
          (organization_id, title, message, channels, target_audience, priority, sent_by, sender_name, recipient_count, delivery_stats)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          orgId,
          dto.title,
          dto.message,
          dto.channels,
          dto.targetAudience,
          dto.priority || 'normal',
          actor.id,
          actor.name || actor.email,
          0,
          JSON.stringify({ sent: 0, delivered: 0, failed: 0 }),
        ],
      );
      await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action: 'broadcast.sent' });
      return b;
    });
  }

  // 9. OPERATIONS (FLEET, LIBRARY, ASSETS, PTM)
  async getOperationsOverview(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const fleet = await manager.query(`SELECT * FROM transport_fleet WHERE organization_id = $1 ORDER BY vehicle_number`, [orgId]);


      const library = await manager.query(`SELECT * FROM library_catalog WHERE organization_id = $1 ORDER BY title LIMIT 30`, [orgId]);


      const assets = await manager.query(`SELECT * FROM school_assets WHERE organization_id = $1 ORDER BY name LIMIT 30`, [orgId]);


      const ptms = await manager.query(`SELECT * FROM ptm_schedules WHERE organization_id = $1 ORDER BY event_date DESC LIMIT 10`, [orgId]);

      return { fleet, library, assets, ptms };
    });
  }

  async createPtmSchedule(orgId: string, actor: User, dto: SchedulePtmDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const mins = (s: string) => {
        const match = s.match(/^(\d{1,2}):(\d{2})$/);
        return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
      };
      const start = mins(dto.startTime);
      const end = mins(dto.endTime);
      const duration = dto.slotDurationMinutes || 15;

      if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
        throw new BadRequestException('End time must be after start time');
      }
      const totalSlots = Math.floor((end - start) / duration);
      if (totalSlots <= 0) {
        throw new BadRequestException('Time window too short for given slot duration');
      }

      const [row] = await manager.query(
        `INSERT INTO ptm_schedules (organization_id, title, event_date, start_time, end_time, slot_duration_minutes, target_grades, total_slots, booked_slots, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'open')
         RETURNING *`,
        [
          orgId,
          dto.title.trim(),
          dto.eventDate,
          dto.startTime,
          dto.endTime,
          duration,
          dto.targetGrades && dto.targetGrades.length > 0 ? dto.targetGrades : ['All Classes'],
          totalSlots,
        ],
      );

      await this.audit.record(manager, {
        organizationId: orgId,
        actorId: actor.id,
        action: 'ptm.schedule.created',
        details: { scheduleId: row.id, title: row.title },
      });

      return row;
    });
  }

  async createTransportVehicle(orgId: string, actor: User, dto: CreateTransportVehicleDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const [existing] = await manager.query(
        `SELECT id FROM transport_fleet WHERE organization_id = $1 AND vehicle_number = $2`,
        [orgId, dto.vehicleNumber.trim()],
      );
      if (existing) {
        throw new ConflictException(`Vehicle number ${dto.vehicleNumber} already exists`);
      }

      const [row] = await manager.query(
        `INSERT INTO transport_fleet (organization_id, vehicle_number, route_name, capacity, driver_name, driver_phone, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          orgId,
          dto.vehicleNumber.trim(),
          dto.routeName.trim(),
          dto.capacity || 40,
          dto.driverName.trim(),
          dto.driverPhone.trim(),
          dto.status || 'idle',
        ],
      );

      await this.audit.record(manager, {
        organizationId: orgId,
        actorId: actor.id,
        action: 'transport.vehicle.created',
        details: { vehicleId: row.id, vehicleNumber: row.vehicle_number },
      });

      return row;
    });
  }

  async createLibraryBook(orgId: string, actor: User, dto: CreateLibraryBookDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const [existing] = await manager.query(
        `SELECT id FROM library_catalog WHERE organization_id = $1 AND isbn = $2`,
        [orgId, dto.isbn.trim()],
      );
      if (existing) {
        throw new ConflictException(`ISBN ${dto.isbn} already exists in library catalog`);
      }

      const totalCopies = dto.totalCopies || 1;
      const [row] = await manager.query(
        `INSERT INTO library_catalog (organization_id, isbn, title, author, category, total_copies, available_copies, shelf_location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          orgId,
          dto.isbn.trim(),
          dto.title.trim(),
          dto.author.trim(),
          dto.category?.trim() || 'General',
          totalCopies,
          totalCopies,
          dto.shelfLocation?.trim() || 'A-1',
        ],
      );

      await this.audit.record(manager, {
        organizationId: orgId,
        actorId: actor.id,
        action: 'library.book.created',
        details: { bookId: row.id, title: row.title },
      });

      return row;
    });
  }

  async createSchoolAsset(orgId: string, actor: User, dto: CreateSchoolAssetDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      const [existing] = await manager.query(
        `SELECT id FROM school_assets WHERE organization_id = $1 AND asset_code = $2`,
        [orgId, dto.assetCode.trim()],
      );
      if (existing) {
        throw new ConflictException(`Asset code ${dto.assetCode} already exists`);
      }

      const [row] = await manager.query(
        `INSERT INTO school_assets (organization_id, asset_code, name, category, location, purchase_cost, condition, custodian_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          orgId,
          dto.assetCode.trim(),
          dto.name.trim(),
          dto.category.trim(),
          dto.location.trim(),
          dto.purchaseCost || 0,
          dto.condition || 'good',
          dto.custodianName?.trim() || 'School Property',
        ],
      );

      await this.audit.record(manager, {
        organizationId: orgId,
        actorId: actor.id,
        action: 'school.asset.created',
        details: { assetId: row.id, assetCode: row.asset_code },
      });

      return row;
    });
  }

  // 10. GOVERNANCE & DISCIPLINE
  async getGovernanceOverview(orgId: string, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      await manager.query(`
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS attendance_threshold integer DEFAULT 75;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS workload_threshold integer DEFAULT 30;
      `).catch(() => null);

      const [school] = await manager.query(
        `SELECT id, name, slug, code, school_type AS "schoolType", board, affiliation_number AS "affiliationNumber",
                official_email AS "officialEmail", official_phone AS "officialPhone", address_line1 AS "addressLine1",
                city, state, pincode, website, time_zone AS "timeZone", locale,
                COALESCE(attendance_threshold, 75) AS "attendanceThreshold",
                COALESCE(workload_threshold, 30) AS "workloadThreshold"
         FROM organizations WHERE id = $1`,
        [orgId],
      );

      const discipline = await manager.query(
        `SELECT * FROM discipline_incidents WHERE organization_id = $1 ORDER BY incident_date DESC LIMIT 30`,
        [orgId],
      );

      const auditLogs = await manager.query(
        `SELECT a.*, u.email as "actorEmail"
         FROM audit_events a
         LEFT JOIN users u ON u.id = a.actor_id
         WHERE a.organization_id = $1
         ORDER BY a.created_at DESC
         LIMIT 50`,
        [orgId],
      );

      const alerts: any[] = [];
      const [pendingLeaves] = await manager.query(
        `SELECT COUNT(*)::int as count FROM leave_requests WHERE organization_id = $1 AND status = 'pending'`,
        [orgId],
      );
      if (pendingLeaves?.count > 0) {
        alerts.push({
          type: 'Pending Leave Approvals',
          source: 'Attendance & Leave',
          desc: `${pendingLeaves.count} leave request(s) awaiting administrative review.`,
          action: 'Review Leaves',
        });
      }

      const [overdueFees] = await manager.query(
        `SELECT COUNT(*)::int as count, COALESCE(SUM(amount_pending), 0)::int as total FROM student_fee_dues WHERE organization_id = $1 AND status IN ('overdue', 'pending') AND due_date < CURRENT_DATE`,
        [orgId],
      );
      if (overdueFees?.count > 0) {
        alerts.push({
          type: 'Statutory Fee Recovery Overdue',
          source: 'Finance Management',
          desc: `${overdueFees.count} student account(s) have overdue fee balances totaling ₹${Number(overdueFees.total).toLocaleString('en-IN')}.`,
          action: 'View Fee Dues',
        });
      }

      const [unresolvedIncidents] = await manager.query(
        `SELECT COUNT(*)::int as count FROM discipline_incidents WHERE organization_id = $1 AND status = 'open'`,
        [orgId],
      );
      if (unresolvedIncidents?.count > 0) {
        alerts.push({
          type: 'Open Discipline Matters',
          source: 'Discipline Register',
          desc: `${unresolvedIncidents.count} recorded student behavioral incident(s) currently open under investigation.`,
          action: 'Investigate',
        });
      }

      return { school: school || null, alerts, discipline, auditLogs };
    });
  }

  async updateSchoolConfiguration(orgId: string, actor: User, dto: UpdateSchoolConfigDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);

      await manager.query(`
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS attendance_threshold integer DEFAULT 75;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS workload_threshold integer DEFAULT 30;
      `).catch(() => null);

      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (dto.name !== undefined) {
        updates.push(`name = $${idx++}`);
        values.push(dto.name.trim());
      }
      if (dto.affiliationNumber !== undefined) {
        updates.push(`affiliation_number = $${idx++}`);
        values.push(dto.affiliationNumber.trim());
      }
      if (dto.board !== undefined) {
        updates.push(`board = $${idx++}`);
        values.push(dto.board.trim());
      }
      if (dto.officialEmail !== undefined) {
        updates.push(`official_email = $${idx++}`);
        values.push(dto.officialEmail.trim().toLowerCase());
      }
      if (dto.officialPhone !== undefined) {
        updates.push(`official_phone = $${idx++}`);
        values.push(dto.officialPhone.trim());
      }
      if (dto.attendanceThreshold !== undefined) {
        updates.push(`attendance_threshold = $${idx++}`);
        values.push(dto.attendanceThreshold);
      }
      if (dto.workloadThreshold !== undefined) {
        updates.push(`workload_threshold = $${idx++}`);
        values.push(dto.workloadThreshold);
      }

      if (updates.length === 0) {
        throw new BadRequestException('No fields to update');
      }

      updates.push(`updated_at = NOW()`);
      values.push(orgId);

      const [updated] = await manager.query(
        `UPDATE organizations
         SET ${updates.join(', ')}
         WHERE id = $${idx}
         RETURNING id, name, slug, board, affiliation_number AS "affiliationNumber",
                   official_email AS "officialEmail", official_phone AS "officialPhone",
                   attendance_threshold AS "attendanceThreshold", workload_threshold AS "workloadThreshold"`,
        values,
      );

      await this.audit.record(manager, {
        organizationId: orgId,
        actorId: actor.id,
        action: 'school.configuration.updated',
        details: { changes: dto },
      });

      return updated;
    });
  }

  async createDisciplineIncident(orgId: string, actor: User, dto: CreateDisciplineIncidentDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const code = `INC-${Date.now().toString().slice(-6)}`;
      const [inc] = await manager.query(
        `INSERT INTO discipline_incidents
          (organization_id, incident_code, student_user_id, student_name, class_section, incident_type, severity, description, action_taken, reported_by_name, parent_notified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          orgId,
          code,
          dto.studentUserId || null,
          dto.studentName,
          dto.classSection || '',
          dto.incidentType,
          dto.severity,
          dto.description,
          dto.actionTaken || '',
          dto.reportedByName || 'Staff Member',
          dto.parentNotified || false,
        ],
      );
      await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action: 'discipline.recorded' });
      return inc;
    });
  }
  async getLearningOverview(orgId:string,actor:User) {
    await this.authorize(this.drizzle,orgId,actor);
    const assignments=await this.drizzle.query(`SELECT a.id,a.title,sec.name AS class,sub.name AS subject,u.name AS teacher,a.due_at AS "dueDate",a.status,(SELECT COUNT(*)::int FROM submissions ss WHERE ss.organization_id=a.organization_id AND ss.assignment_id=a.id) AS total,(SELECT COUNT(*)::int FROM submissions ss WHERE ss.organization_id=a.organization_id AND ss.assignment_id=a.id AND ss.status IN ('submitted','late','graded')) AS submitted FROM assignments a JOIN sections sec ON sec.id=a.section_id AND sec.organization_id=a.organization_id JOIN subjects sub ON sub.id=a.subject_id AND sub.organization_id=a.organization_id JOIN users u ON u.id=a.created_by WHERE a.organization_id=$1 ORDER BY a.created_at DESC`,[orgId]);
    const exams=await this.drizzle.query(`SELECT ep.id,ep.exam_name AS name,ep.term AS "examType",sec.name AS grade,y.name AS "academicYear",ep.exam_date AS "startDate",ep.exam_date AS "endDate",ep.max_marks AS "totalMarks",ep.status FROM principal_exam_plans ep JOIN sections sec ON sec.id=ep.section_id AND sec.organization_id=ep.organization_id JOIN academic_years y ON y.id=sec.academic_year_id AND y.organization_id=sec.organization_id WHERE ep.organization_id=$1 ORDER BY ep.exam_date DESC`,[orgId]);
    const results=await this.drizzle.query(`SELECT id,exam_name AS exam,subject_name AS subject,student_name AS student,marks_obtained AS score,max_marks AS max,status FROM principal_exam_results WHERE organization_id=$1 ORDER BY created_at DESC`,[orgId]);
    const sections=await this.drizzle.query(`SELECT s.id,s.name,p.name AS "programName" FROM sections s JOIN programs p ON p.id=s.program_id WHERE s.organization_id=$1 ORDER BY p.sequence_order,s.name`,[orgId]);
    const subjects=await this.drizzle.query(`SELECT id,name,code FROM subjects WHERE organization_id=$1 ORDER BY name`,[orgId]);
    return {assignments:assignments.map(a=>({...a,completionPct:a.total?Math.round(100*a.submitted/a.total):0})),exams,results,sections,subjects};
  }

  async createCoursework(orgId: string, actor: User, dto: CreateCourseworkDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      const dueDate = new Date(dto.dueAt);
      const [asg] = await manager.query(
        `INSERT INTO assignments (
           organization_id, section_id, subject_id, created_by, title, description, due_at, max_score, status, published_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', now())
         RETURNING id, title, section_id, subject_id, due_at AS "dueDate", status`,
        [orgId, dto.sectionId, dto.subjectId, actor.id, dto.title.trim(), dto.description?.trim() || '', dueDate, dto.maxScore || 100],
      );

      await manager.query(
        `INSERT INTO submissions (organization_id, assignment_id, student_id, status)
         SELECT $1, $2, student_user_id, 'pending'
         FROM enrollments
         WHERE organization_id = $1 AND section_id = $3 AND status = 'active'
         ON CONFLICT (organization_id, assignment_id, student_id) DO NOTHING`,
        [orgId, asg.id, dto.sectionId],
      );

      return asg;
    });
  }

  async scheduleExam(orgId: string, actor: User, dto: ScheduleExamDto) {
    return this.drizzle.transaction(async (manager) => {
      await this.authorize(manager, orgId, actor);
      if (dto.startTime >= dto.endTime) {
        throw new BadRequestException('End time must be after start time');
      }
      const [exam] = await manager.query(
        `INSERT INTO principal_exam_plans (
           organization_id, section_id, subject_id, exam_name, term, exam_date, start_time, end_time, max_marks, status, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled', $10)
         RETURNING id, exam_name AS name, term AS "examType", exam_date AS "startDate", max_marks AS "totalMarks", status`,
        [
          orgId, dto.sectionId, dto.subjectId, dto.examName.trim(), dto.term.trim(),
          dto.examDate, dto.startTime, dto.endTime, dto.maxMarks || 100, actor.id
        ],
      );
      return exam;
    });
  }

}
