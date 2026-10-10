import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
import { User } from '../../auth/user.entity';

@Injectable()
export class TeacherDashboardService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getDashboard(organizationId: string, user: User) {
    const userId = user?.id;

    // 1. Fetch teacher assignments to know their classes & subjects
    let assignments: any[] = [];
    try {
      assignments = await this.drizzle.query(
        `SELECT csa.section_id, csa.subject_id, sec.name as section_name, sub.name as subject_name, sub.code as subject_code
         FROM class_subject_assignments csa
         JOIN sections sec ON sec.id = csa.section_id AND sec.organization_id = csa.organization_id
         JOIN subjects sub ON sub.id = csa.subject_id AND sub.organization_id = csa.organization_id
         WHERE csa.organization_id = $1 AND csa.teacher_user_id = $2`,
        [organizationId, userId]
      );
    } catch {
      assignments = [];
    }

    if (!assignments || assignments.length === 0) {
      try {
        const secRows = await this.drizzle.query(
          `SELECT sec.id as section_id, sec.name as section_name, sub.id as subject_id, sub.name as subject_name, sub.code as subject_code
           FROM sections sec
           LEFT JOIN subjects sub ON sub.organization_id = sec.organization_id
           WHERE sec.organization_id = $1 LIMIT 3`,
          [organizationId]
        );
        assignments = secRows || [];
      } catch {
        assignments = [];
      }
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const sectionIds = assignments
      .map((a: any) => a.section_id)
      .filter((id: any) => typeof id === 'string' && uuidRegex.test(id));

    // 2. Count active students in assigned sections
    let studentCount = 0;
    if (sectionIds.length > 0) {
      try {
        const rows = await this.drizzle.query(
          `SELECT COUNT(DISTINCT student_user_id) as count
           FROM enrollments
           WHERE organization_id = $1 AND section_id = ANY($2::uuid[]) AND status = 'active'`,
          [organizationId, sectionIds]
        );
        if (rows && rows[0] && rows[0].count) {
          studentCount = Number(rows[0].count);
        }
      } catch {
        studentCount = 0;
      }
    }

    // 3. Count pending assignment evaluations
    let pendingEvaluations = 0;
    if (sectionIds.length > 0) {
      try {
        const rows = await this.drizzle.query(
          `SELECT COUNT(sub.id) as count
           FROM submissions sub
           JOIN assignments a ON a.id = sub.assignment_id AND a.organization_id = sub.organization_id
           WHERE a.organization_id = $1 AND a.section_id = ANY($2::uuid[]) AND sub.status IN ('submitted', 'late')`,
          [organizationId, sectionIds]
        );
        if (rows && rows[0] && rows[0].count) {
          pendingEvaluations = Number(rows[0].count);
        }
      } catch {
        pendingEvaluations = 0;
      }
    }

    // 4. Today's Timetable Slots
    const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toLowerCase();
    let todaySlots: any[] = [];
    try {
      todaySlots = await this.drizzle.query(
        `SELECT tts.*, sec.name as section_name, sub.name as subject_name
         FROM teacher_timetable_slots tts
         JOIN sections sec ON sec.id = tts.section_id AND sec.organization_id = tts.organization_id
         JOIN subjects sub ON sub.id = tts.subject_id AND sub.organization_id = tts.organization_id
         WHERE tts.organization_id = $1 AND tts.teacher_user_id = $2 AND tts.day_of_week = $3
         ORDER BY tts.period_number ASC`,
        [organizationId, userId, today]
      );
    } catch {
      todaySlots = [];
    }

    // 5. Next class computation
    const nextSlot = todaySlots.find((s: any) => s.status !== 'completed') || todaySlots[0];

    const teacherName = user?.name || (user?.email ? user.email.split('@')[0] : 'Teacher');
    const teacherEmail = user?.email || '';

    // 6. Query today's attendance sessions to know real marked periods
    let markedPeriodsToday: number[] = [];
    try {
      const markedRows = await this.drizzle.query(
        `SELECT DISTINCT period FROM attendance_sessions WHERE organization_id = $1 AND date = CURRENT_DATE`,
        [organizationId]
      );
      if (markedRows && markedRows.length > 0) {
        markedPeriodsToday = markedRows.map((r: any) => Number(r.period));
      }
    } catch {
      markedPeriodsToday = [];
    }
    const markedPeriodsSet = new Set(markedPeriodsToday);

    // 7. Recent activity from delivery & assignments
    let recentActivity: any[] = [];
    try {
      const actRows = await this.drizzle.query(
        `SELECT action_type as text, to_char(created_at, 'HH12:MI AM') as time
         FROM audit_logs
         WHERE organization_id = $1
         ORDER BY created_at DESC LIMIT 5`,
        [organizationId]
      );
      if (actRows && actRows.length > 0) {
        recentActivity = actRows.map((r: any, idx: number) => ({
          id: `act-${idx}`,
          text: r.text,
          time: r.time,
        }));
      }
    } catch {
      recentActivity = [];
    }

    const attentionRequired: any[] = [];
    if (pendingEvaluations > 0) {
      attentionRequired.push({
        id: 'att-eval',
        type: 'evaluation_pending',
        message: `${pendingEvaluations} assignment submissions awaiting evaluation`,
        severity: 'critical',
        action: 'Open Evaluation Queue',
      });
    }

    return {
      teacher: {
        id: userId || 'teacher-id',
        name: teacherName,
        email: teacherEmail,
        primarySubject: assignments[0]?.subject_name || 'General',
        assignedClassesCount: new Set(assignments.map((a: any) => a.section_id)).size,
        totalStudents: studentCount,
      },
      kpis: {
        classesToday: todaySlots.length,
        periodsToday: todaySlots.length,
        studentsToday: studentCount,
        pendingAttendance: Math.max(0, todaySlots.length - markedPeriodsSet.size),
        pendingAssignments: 0,
        pendingEvaluations: pendingEvaluations,
        upcomingAssessments: 0,
        curriculumProgress: 0,
        unreadMessages: 0,
      },
      nextClass: nextSlot ? {
        classSection: nextSlot.section_name || 'Section',
        sectionId: nextSlot.section_id,
        subject: nextSlot.subject_name || 'Subject',
        subjectId: nextSlot.subject_id,
        startTime: nextSlot.start_time || '09:00',
        endTime: nextSlot.end_time || '09:45',
        room: nextSlot.room || 'Classroom',
        topic: nextSlot.topic || 'Class Session',
        lessonPlanStatus: 'Ready',
        startsInMinutes: 0,
      } : null,
      todaySchedule: todaySlots.map((s: any) => ({
        period: s.period_number,
        time: `${s.start_time}–${s.end_time}`,
        classSection: s.section_name,
        sectionId: s.section_id,
        subject: s.subject_name,
        room: s.room,
        attendanceDone: markedPeriodsSet.has(s.period_number),
        status: s.status || (markedPeriodsSet.has(s.period_number) ? 'completed' : 'upcoming'),
      })),
      attentionRequired,
      recentActivity,
    };
  }
}
