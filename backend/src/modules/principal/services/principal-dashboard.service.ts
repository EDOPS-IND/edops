import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
import { User } from '../../auth/user.entity';

@Injectable()
export class PrincipalDashboardService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getDashboard(orgId: string, _actor: User) {
    const manager = this.drizzle;

    // Real counts from school core tables
    const [counts] = await manager.query(
      `SELECT
        COUNT(*) FILTER (WHERE role = 'student' AND status = 'active') as "totalStudents",
        COUNT(*) FILTER (WHERE role = 'teacher' AND status = 'active') as "totalTeachers"
       FROM memberships WHERE organization_id = $1`,
      [orgId],
    );

    const [academicStats] = await manager.query(
      `SELECT
        (SELECT COUNT(*) FROM programs WHERE organization_id = $1) as "totalClasses",
        (SELECT COUNT(*) FROM sections WHERE organization_id = $1) as "totalSections",
        (SELECT COUNT(*) FROM subjects WHERE organization_id = $1) as "totalSubjects",
        (SELECT name FROM academic_years WHERE organization_id = $1 AND is_current = true LIMIT 1) as "activeYear"`,
      [orgId],
    );

    const totalStudents = Number(counts?.totalStudents || 0);
    const totalTeachers = Number(counts?.totalTeachers || 0);
    const totalClasses = Number(academicStats?.totalClasses || 0);
    const totalSections = Number(academicStats?.totalSections || 0);
    const totalSubjects = Number(academicStats?.totalSubjects || 0);
    const activeYear = academicStats?.activeYear ?? null;

    // Alerts count
    const [alertsCount] = await manager.query(
      `SELECT COUNT(*)::int as "openAlerts" FROM principal_academic_alerts WHERE organization_id = $1 AND status != 'resolved'`,
      [orgId],
    );

    // Attendance stats from live attendance tables
    const [attStats] = await manager.query(
      `SELECT
        COUNT(*)::int as total_records,
        COUNT(*) FILTER (WHERE ar.status IN ('present', 'late'))::int as present_records
       FROM attendance_records ar
       JOIN attendance_sessions as_sess ON ar.attendance_session_id = as_sess.id
       WHERE as_sess.organization_id = $1
         AND as_sess.date = (NOW() AT TIME ZONE
           (SELECT time_zone FROM organizations WHERE id = $1))::date`,
      [orgId],
    );

    const totalAtt = Number(attStats?.total_records ?? 0);
    const presentAtt = Number(attStats?.present_records ?? 0);
    const studentAttendanceRate = totalAtt > 0 ? Number(((presentAtt / totalAtt) * 100).toFixed(1)) : null;
    const [riskStats] = await manager.query(
      `SELECT COUNT(*)::int as students FROM (
         SELECT ar.student_id FROM attendance_records ar
         JOIN attendance_sessions sess ON sess.id = ar.attendance_session_id
         WHERE sess.organization_id = $1
         GROUP BY ar.student_id
         HAVING COUNT(*) FILTER (WHERE ar.status IN ('present', 'late')) * 100.0 / COUNT(*) < 75
       ) at_risk`, [orgId],
    );
    const studentsBelowThreshold = Number(riskStats?.students ?? 0);

    // Curriculum progress comes from recorded curriculum nodes.
    const [curriculumStats] = await manager.query(
      `SELECT ROUND(AVG(actual_completion_percentage), 1) as completion,
              ROUND(AVG(actual_completion_percentage) FILTER (WHERE cardinality(learning_outcomes) > 0), 1) as learning,
              ROUND(AVG(actual_completion_percentage) FILTER (WHERE cardinality(competencies) > 0), 1) as competency
       FROM principal_curriculum_nodes WHERE organization_id = $1`, [orgId],
    );
    const curriculumCompletion = curriculumStats?.completion == null ? null : Number(curriculumStats.completion);
    const learningProgress = curriculumStats?.learning == null ? null : Number(curriculumStats.learning);
    const competencyProgress = curriculumStats?.competency == null ? null : Number(curriculumStats.competency);

    const [submissionsStats] = await manager.query(
      `SELECT
        COUNT(*)::int as total_submissions,
        COUNT(*) FILTER (WHERE graded_at IS NOT NULL)::int as graded_submissions,
        ROUND(AVG((100 * sub.score / NULLIF(a.max_score, 0))::numeric) FILTER (WHERE sub.graded_at IS NOT NULL), 1) as average_score
       FROM submissions sub
       JOIN assignments a ON a.id = sub.assignment_id
       WHERE a.organization_id = $1`,
      [orgId],
    );

    const totalSubs = Number(submissionsStats?.total_submissions ?? 0);
    const gradedSubs = Number(submissionsStats?.graded_submissions ?? 0);
    const averageAssessmentScore = submissionsStats?.average_score == null ? null : Number(submissionsStats.average_score);
    const assignmentCompletion = totalSubs > 0 ? Number(((gradedSubs / totalSubs) * 100).toFixed(1)) : null;

    const [resultStats] = await manager.query(
      `SELECT ROUND(AVG(percentage) FILTER (WHERE status = 'Published'), 1) as average,
              COUNT(*) FILTER (WHERE status = 'Published')::int as published,
              COUNT(*) FILTER (WHERE status = 'Published' AND is_locked)::int as locked,
              COUNT(*) FILTER (WHERE status IN ('Entered', 'Verified', 'Approved'))::int as pending
       FROM principal_exam_results WHERE organization_id = $1`, [orgId],
    );
    const schoolAverage = resultStats?.average == null ? null : Number(resultStats.average);

    const [paperStats] = await manager.query(
      `SELECT COUNT(*)::int as total,
              COUNT(*) FILTER (WHERE status = 'Published')::int as published,
              COUNT(*) FILTER (WHERE status IN ('Submitted', 'Under Review'))::int as pending
       FROM principal_question_papers WHERE organization_id = $1`, [orgId],
    );
    const assessmentCompletion = Number(paperStats?.total) > 0
      ? Math.round(100 * Number(paperStats.published) / Number(paperStats.total)) : null;

    const [planStats] = await manager.query(
      `SELECT COUNT(*)::int as total,
              COUNT(*) FILTER (WHERE status IN ('Approved', 'Completed'))::int as completed,
              COUNT(*) FILTER (WHERE status IN ('Submitted', 'Needs Revision'))::int as pending
       FROM principal_lesson_plans WHERE organization_id = $1`, [orgId],
    );
    const teacherActivity = Number(planStats?.total) > 0
      ? Math.round(100 * Number(planStats.completed) / Number(planStats.total)) : null;

    const [interventionStats] = await manager.query(
      `SELECT COUNT(*)::int as total,
              COUNT(*) FILTER (WHERE status IN ('Improved', 'Closed'))::int as completed
       FROM principal_student_interventions WHERE organization_id = $1`, [orgId],
    );
    const interventionCompletion = Number(interventionStats?.total) > 0
      ? Math.round(100 * Number(interventionStats.completed) / Number(interventionStats.total)) : null;

    const [todayStats] = await manager.query(
      `WITH local_now AS (
         SELECT NOW() AT TIME ZONE time_zone AS at_school FROM organizations WHERE id = $1
       ), slots AS (
         SELECT t.section_id, t.teacher_user_id, false AS is_substitution, t.start_time, t.end_time
         FROM timetable_entries t, local_now
         WHERE t.organization_id = $1 AND t.day_of_week = EXTRACT(ISODOW FROM local_now.at_school)
         UNION ALL
         SELECT t.section_id, t.teacher_user_id, t.is_substitution, t.start_time, t.end_time
         FROM teacher_timetable_slots t, local_now
         WHERE t.organization_id = $1
           AND t.day_of_week = LOWER(TRIM(TO_CHAR(local_now.at_school, 'Day')))
           AND NOT EXISTS (SELECT 1 FROM timetable_entries WHERE organization_id = $1)
       )
       SELECT COUNT(DISTINCT section_id)::int as classes,
              COUNT(DISTINCT teacher_user_id)::int as teachers,
              COUNT(*) FILTER (WHERE is_substitution)::int as substitutions
       FROM slots, local_now
       WHERE start_time <= TO_CHAR(local_now.at_school, 'HH24:MI')
         AND end_time > TO_CHAR(local_now.at_school, 'HH24:MI')`, [orgId],
    );

    // Live exams stats
    const [examStats] = await manager.query(
      `SELECT COUNT(*)::int as total_evaluations FROM exam_evaluations WHERE organization_id = $1`,
      [orgId],
    );
    const totalExams = Number(examStats?.total_evaluations ?? 0);

    // Live teaching delivery stats from teacher_lesson_deliveries
    const [deliveryStats] = await manager.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'conducted')::int as total_delivered,
        COUNT(*) FILTER (WHERE status = 'conducted' AND delivery_date = (NOW() AT TIME ZONE
          (SELECT time_zone FROM organizations WHERE id = $1))::date)::int as delivered_today
       FROM teacher_lesson_deliveries
       WHERE organization_id = $1`,
      [orgId],
    );
    const totalDelivered = Number(deliveryStats?.total_delivered ?? 0);
    const deliveredToday = Number(deliveryStats?.delivered_today ?? 0);

    // Explainable Academic Health Score factors
    const healthBreakdown = {
      curriculumExecution: curriculumCompletion,
      assessmentCompletion,
      studentPerformance: schoolAverage,
      teacherAcademicActivity: teacherActivity,
      attendanceRate: studentAttendanceRate,
      assignmentCompletion,
      interventionCompletion,
    };
    const healthFactors = Object.values(healthBreakdown);
    const healthWeights = [0.2, 0.15, 0.2, 0.15, 0.15, 0.1, 0.05];
    const overallHealthScore = healthFactors.every((value) => value !== null)
      ? Math.round(healthFactors.reduce((sum, value, index) => sum + Number(value) * healthWeights[index], 0))
      : null;

    // Live recent activity from audit_events
    const recentAuditRows = await manager.query(
      `SELECT ae.id, ae.action as title, ae.created_at, COALESCE(u.name, 'System') as author
       FROM audit_events ae
       LEFT JOIN users u ON u.id = ae.actor_id
       WHERE ae.organization_id = $1
       ORDER BY ae.created_at DESC
       LIMIT 5`,
      [orgId],
    );

    const recentActivity = recentAuditRows.map((r: any) => ({
      id: r.id,
      title: r.title,
      category: 'Activity',
      time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: r.author,
    }));

    return {
      schoolKpis: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSections,
        totalSubjects,
        activeAcademicYear: activeYear,
      },
      academicPerformance: {
        overallSchoolAverage: schoolAverage,
        averageAssessmentScore,
        learningOutcomeAchievement: learningProgress,
        competencyAchievement: competencyProgress,
        curriculumCompletion,
        assignmentCompletion,
      },
      academicHealth: {
        score: overallHealthScore,
        status: overallHealthScore === null ? 'Insufficient data' : overallHealthScore >= 80 ? 'Strong Academic Health' : 'Intervention Needed',
        breakdown: healthBreakdown,
      },
      todayOperations: {
        classesRunning: Number(todayStats?.classes ?? 0),
        teachersTeaching: Number(todayStats?.teachers ?? 0),
        teachersAbsent: null,
        substitutionsCovered: Number(todayStats?.substitutions ?? 0),
        examsToday: null,
        assessmentsScheduled: null,
        pendingReviews: Number(planStats?.pending ?? 0) + Number(paperStats?.pending ?? 0),
        openAlerts: Number(alertsCount?.openAlerts || 0),
      },
      attendance: {
        overallStudentAttendance: studentAttendanceRate,
        studentsBelowThreshold,
        classesMissingAttendance: null,
        teacherAttendance: null,
      },
      teachingExecution: {
        lessonPlansCompleted: Number(planStats?.completed ?? 0),
        lessonsDelivered: totalDelivered,
        deliveredToday,
        syllabusCompletion: curriculumCompletion,
        pendingLessonPlans: Number(planStats?.pending ?? 0),
        pendingEvaluations: Math.max(0, totalSubs - gradedSubs),
      },
      examinationStatus: {
        upcomingExams: null,
        resultsPending: Number(resultStats?.pending ?? 0),
        resultsPublished: Number(resultStats?.published ?? 0),
        resultsLocked: Number(resultStats?.locked ?? 0),
        papersEvaluated: totalExams,
        internalAssessmentsPending: Number(paperStats?.pending ?? 0),
      },
      recentActivity,
    };

  }

  async getAcademicHealth(orgId: string, actor: User) {
    const dash = await this.getDashboard(orgId, actor);
    const score = dash.academicHealth.score;
    const bd = dash.academicHealth.breakdown;
    const components = [
      { name: 'Curriculum Execution', score: bd.curriculumExecution, weight: '20%' },
      { name: 'Papers Published', score: bd.assessmentCompletion, weight: '15%' },
      { name: 'Published Exam Average', score: bd.studentPerformance, weight: '20%' },
      { name: 'Lesson Plan Completion', score: bd.teacherAcademicActivity, weight: '15%' },
      { name: 'Attendance Stability', score: bd.attendanceRate, weight: '15%' },
      { name: 'Assignment Completion', score: bd.assignmentCompletion, weight: '10%' },
      { name: 'Interventions Completed', score: bd.interventionCompletion, weight: '5%' },
    ].map((b) => ({
      name: b.name,
      score: b.score,
      weight: b.weight,
      status: b.score === null ? 'No data' : b.score >= 80 ? 'Good' : 'Needs Focus',
      underlyingMetric: b.score === null ? 'No recorded evidence yet' : `${b.score}% from recorded school data`,
      flaggedClasses: [],
      recommendedAction: b.score === null ? 'Record activity to calculate this factor.' : b.score < 80 ? 'Review performance metrics and schedule support session.' : 'Maintain current instructional pace.',
    }));

    return {
      overallScore: score,
      benchmark: 80,
      status: score === null ? 'Insufficient data' : score >= 80 ? 'Strong Academic Health' : 'Intervention Needed',
      components,
    };
  }

  async globalSearch(orgId: string, _actor: User, query: string) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return { results: [] };

    const manager = this.drizzle;

    // Search students
    const students = await manager.query(
      `SELECT u.id, u.name, u.email, m.role, 'student' as type
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.organization_id = $1 AND m.role = 'student'
         AND (LOWER(u.name) LIKE $2 OR LOWER(u.email) LIKE $2)
       LIMIT 5`,
      [orgId, `%${q}%`],
    ).catch(() => []);

    // Search teachers
    const teachers = await manager.query(
      `SELECT u.id, u.name, u.email, m.role, 'teacher' as type
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.organization_id = $1 AND m.role = 'teacher'
         AND (LOWER(u.name) LIKE $2 OR LOWER(u.email) LIKE $2)
       LIMIT 5`,
      [orgId, `%${q}%`],
    ).catch(() => []);

    // Search subjects and classes
    const subjects = await manager.query(
      `SELECT id, name, code, 'subject' as type FROM subjects WHERE organization_id = $1 AND (LOWER(name) LIKE $2 OR LOWER(code) LIKE $2) LIMIT 5`,
      [orgId, `%${q}%`],
    ).catch(() => []);

    const classes = await manager.query(
      `SELECT id, name, 'class' as type FROM sections WHERE organization_id = $1 AND LOWER(name) LIKE $2 LIMIT 5`,
      [orgId, `%${q}%`],
    ).catch(() => []);

    return {
      query: q,
      results: [
        ...students.map((s: any) => ({ id: s.id, title: s.name || s.email, subtitle: `Student · ${s.email}`, category: 'Students', type: 'student' })),
        ...teachers.map((t: any) => ({ id: t.id, title: t.name || t.email, subtitle: `Faculty · ${t.email}`, category: 'Teachers', type: 'teacher' })),
        ...subjects.map((s: any) => ({ id: s.id, title: s.name, subtitle: `Subject Code: ${s.code}`, category: 'Subjects', type: 'subject' })),
        ...classes.map((c: any) => ({ id: c.id, title: c.name, subtitle: 'Class Section', category: 'Classes', type: 'class' })),
      ],
    };
  }
}
