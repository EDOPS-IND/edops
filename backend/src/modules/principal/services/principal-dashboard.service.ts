import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
import { User } from '../../auth/user.entity';

@Injectable()
export class PrincipalDashboardService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getLearningRoster(orgId: string) {
    return this.drizzle.query(`SELECT a.id, a.title, a.due_at AS "dueAt", a.published_at AS "publishedAt",
      p.name || ' - ' || sec.name AS "className",
      subj.name AS "subjectName", COALESCE(u.name, u.email) AS "teacherName",
      (SELECT COUNT(*)::int FROM enrollments e WHERE e.organization_id = a.organization_id
        AND e.section_id = a.section_id AND e.status = 'active' AND e.academic_year_id = sec.academic_year_id) AS assigned,
      COUNT(sub.id) FILTER (WHERE sub.submitted_at IS NOT NULL)::int AS submitted,
      COUNT(sub.id) FILTER (WHERE sub.graded_at IS NOT NULL)::int AS evaluated,
      COUNT(sub.id) FILTER (WHERE sub.submitted_at IS NOT NULL AND sub.graded_at IS NULL)::int AS "pendingEvaluation"
      FROM assignments a
      JOIN sections sec ON sec.id = a.section_id AND sec.organization_id = a.organization_id
      JOIN academic_years y ON y.id = sec.academic_year_id AND y.organization_id = a.organization_id AND y.is_current = true
      JOIN programs p ON p.id = sec.program_id AND p.organization_id = a.organization_id
      JOIN subjects subj ON subj.id = a.subject_id AND subj.organization_id = a.organization_id
      JOIN users u ON u.id = a.created_by
      LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.organization_id = a.organization_id
        AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id = a.organization_id
          AND e.student_user_id = sub.student_id AND e.section_id = a.section_id
          AND e.academic_year_id = sec.academic_year_id AND e.status = 'active')
      WHERE a.organization_id = $1 AND a.status = 'published'
      GROUP BY a.id, sec.academic_year_id, p.name, sec.name, subj.name, u.name, u.email
      ORDER BY p.name, sec.name, subj.name`, [orgId]);
  }

  async getLearningOverview(orgId: string) {
    const [assignments, submissions, materials, activities] = await Promise.all([
      this.getLearningRoster(orgId),
      this.drizzle.query(`SELECT sub.id, a.id AS "assignmentId", a.title AS "assignmentTitle",
        p.name || ' - ' || sec.name AS "className", COALESCE(u.name, u.email) AS "studentName",
        sub.status, sub.submitted_at AS "submittedAt", sub.graded_at AS "gradedAt",
        sub.score, a.max_score AS "maxScore", a.due_at AS "dueAt"
        FROM submissions sub
        JOIN assignments a ON a.id = sub.assignment_id AND a.organization_id = sub.organization_id AND a.status = 'published'
        JOIN sections sec ON sec.id = a.section_id AND sec.organization_id = a.organization_id
        JOIN academic_years y ON y.id = sec.academic_year_id AND y.organization_id = a.organization_id AND y.is_current = true
        JOIN programs p ON p.id = sec.program_id AND p.organization_id = a.organization_id
        JOIN enrollments e ON e.organization_id = sub.organization_id AND e.student_user_id = sub.student_id
          AND e.section_id = a.section_id AND e.academic_year_id = sec.academic_year_id AND e.status = 'active'
        JOIN users u ON u.id = sub.student_id
        WHERE sub.organization_id = $1 AND sub.submitted_at IS NOT NULL
        ORDER BY sub.submitted_at DESC LIMIT 100`, [orgId]),
      this.drizzle.query(`SELECT m.id, m.title, m.description, m.chapter, m.topic,
        m.file_type AS "fileType", m.file_url AS "fileUrl", m.created_at AS "createdAt",
        p.name || ' - ' || sec.name AS "className", subj.name AS "subjectName",
        COALESCE(u.name, u.email) AS "teacherName"
        FROM teacher_study_materials m
        JOIN sections sec ON sec.id = m.section_id AND sec.organization_id = m.organization_id
        JOIN academic_years y ON y.id = sec.academic_year_id AND y.organization_id = m.organization_id AND y.is_current = true
        JOIN programs p ON p.id = sec.program_id AND p.organization_id = m.organization_id
        JOIN subjects subj ON subj.id = m.subject_id AND subj.organization_id = m.organization_id
        JOIN users u ON u.id = m.teacher_user_id
        WHERE m.organization_id = $1 ORDER BY m.created_at DESC LIMIT 100`, [orgId]),
      this.drizzle.query(`SELECT d.id, TO_CHAR(d.delivery_date, 'YYYY-MM-DD') AS date,
        d.period_number AS period, d.topics_covered AS "topicsCovered",
        d.participation_pct AS "participationPct", d.homework_assigned AS "homeworkAssigned",
        d.reflection, d.status, p.name || ' - ' || sec.name AS "className",
        subj.name AS "subjectName", COALESCE(u.name, u.email) AS "teacherName"
        FROM teacher_lesson_deliveries d
        JOIN sections sec ON sec.id = d.section_id AND sec.organization_id = d.organization_id
        JOIN academic_years y ON y.id = sec.academic_year_id AND y.organization_id = d.organization_id AND y.is_current = true
        JOIN programs p ON p.id = sec.program_id AND p.organization_id = d.organization_id
        JOIN subjects subj ON subj.id = d.subject_id AND subj.organization_id = d.organization_id
        JOIN users u ON u.id = d.teacher_user_id
        WHERE d.organization_id = $1 ORDER BY d.delivery_date DESC, d.period_number DESC LIMIT 100`, [orgId]),
    ]);
    return { assignments, submissions, materials, activities };
  }

  async getAttendance(orgId: string) {
    const [summary] = await this.drizzle.query(`WITH school_day AS (
      SELECT (NOW() AT TIME ZONE time_zone)::date AS day FROM organizations WHERE id = $1
    ), roster AS (
      SELECT e.student_user_id, e.section_id FROM enrollments e
      JOIN academic_years y ON y.id = e.academic_year_id AND y.organization_id = e.organization_id AND y.is_current = true
      WHERE e.organization_id = $1 AND e.status = 'active'
    ), marked AS (
      SELECT ar.status FROM attendance_records ar
      JOIN attendance_sessions s ON s.id = ar.attendance_session_id AND s.organization_id = ar.organization_id
      JOIN roster r ON r.student_user_id = ar.student_id AND r.section_id = s.section_id
      WHERE ar.organization_id = $1 AND s.status = 'finalized' AND s.date = (SELECT day FROM school_day)
    ), scheduled AS (
      SELECT DISTINCT t.section_id, t.period_number FROM timetable_entries t
      JOIN academic_years y ON y.id = t.academic_year_id AND y.organization_id = t.organization_id AND y.is_current = true
      WHERE t.organization_id = $1 AND t.day_of_week = EXTRACT(ISODOW FROM (SELECT day FROM school_day))
    ) SELECT (SELECT COUNT(DISTINCT student_user_id)::int FROM roster) AS "enrolledStudents",
      (SELECT COUNT(*)::int FROM marked) AS "markedRecords",
      (SELECT COUNT(*)::int FROM marked WHERE status IN ('present', 'late')) AS "presentRecords",
      (SELECT COUNT(*)::int FROM scheduled sc WHERE NOT EXISTS (
        SELECT 1 FROM attendance_sessions s WHERE s.organization_id = $1 AND s.section_id = sc.section_id
          AND s.period = sc.period_number AND s.date = (SELECT day FROM school_day) AND s.status = 'finalized')) AS "pendingRegisters",
      (SELECT TO_CHAR(day, 'YYYY-MM-DD') FROM school_day) AS date`, [orgId]);

    const students = await this.drizzle.query(`SELECT e.student_user_id AS id,
      COALESCE(u.name, u.email) AS name, p.name || ' - ' || sec.name AS "className", e.roll_number AS roll,
      COUNT(ar.id)::int AS "markedRecords",
      COUNT(ar.id) FILTER (WHERE ar.status IN ('present', 'late'))::int AS "presentRecords",
      COUNT(DISTINCT s.date) FILTER (WHERE ar.status = 'absent')::int AS "daysAbsent",
      COUNT(ar.id) FILTER (WHERE ar.status = 'absent')::int AS "unexcusedAbsences"
      FROM enrollments e
      JOIN academic_years y ON y.id = e.academic_year_id AND y.organization_id = e.organization_id AND y.is_current = true
      JOIN users u ON u.id = e.student_user_id
      JOIN sections sec ON sec.id = e.section_id AND sec.organization_id = e.organization_id
      JOIN programs p ON p.id = sec.program_id AND p.organization_id = e.organization_id
      LEFT JOIN attendance_sessions s ON s.organization_id = e.organization_id AND s.section_id = e.section_id
        AND s.status = 'finalized' AND s.date BETWEEN y.start_date AND y.end_date
      LEFT JOIN attendance_records ar ON ar.attendance_session_id = s.id AND ar.organization_id = e.organization_id
        AND ar.student_id = e.student_user_id
      WHERE e.organization_id = $1 AND e.status = 'active'
      GROUP BY e.student_user_id, u.name, u.email, p.name, sec.name, e.roll_number
      ORDER BY p.name, sec.name, u.name, u.email`, [orgId]);
    const atRisk = students.filter((student: any) => student.markedRecords > 0 &&
      student.presentRecords / student.markedRecords < 0.75).map((student: any) => ({
      ...student, attendanceRate: Number((100 * student.presentRecords / student.markedRecords).toFixed(1)),
    }));

    const trend = await this.drizzle.query(`WITH school_day AS (
      SELECT (NOW() AT TIME ZONE time_zone)::date AS day FROM organizations WHERE id = $1
    ), days AS (SELECT generate_series((SELECT day FROM school_day) - 13,
      (SELECT day FROM school_day), interval '1 day')::date AS date), marked AS (
      SELECT ar.id, s.date, ar.status FROM attendance_sessions s
      JOIN attendance_records ar ON ar.attendance_session_id = s.id AND ar.organization_id = s.organization_id
      JOIN enrollments e ON e.organization_id = s.organization_id AND e.student_user_id = ar.student_id
        AND e.section_id = s.section_id AND e.status = 'active'
      JOIN academic_years y ON y.id = e.academic_year_id AND y.organization_id = e.organization_id AND y.is_current = true
      WHERE s.organization_id = $1 AND s.status = 'finalized' AND s.date BETWEEN y.start_date AND y.end_date
    )
      SELECT TO_CHAR(d.date, 'YYYY-MM-DD') AS date, COUNT(ar.id)::int AS "markedRecords",
        COUNT(ar.id) FILTER (WHERE ar.status IN ('present', 'late'))::int AS "presentRecords"
      FROM days d
      LEFT JOIN marked ar ON ar.date = d.date
      GROUP BY d.date ORDER BY d.date`, [orgId]);

    const teachers = await this.drizzle.query(`WITH school_day AS (
      SELECT (NOW() AT TIME ZONE time_zone)::date AS day FROM organizations WHERE id = $1
    ) SELECT u.id, COALESCE(u.name, u.email) AS name,
      EXISTS (SELECT 1 FROM leave_requests l WHERE l.organization_id = $1 AND l.user_id = u.id
        AND l.status = 'approved' AND (SELECT day FROM school_day) BETWEEN l.start_date AND l.end_date) AS "approvedLeave",
      (SELECT COUNT(*)::int FROM attendance_sessions s WHERE s.organization_id = $1 AND s.taken_by = u.id
        AND s.date = (SELECT day FROM school_day) AND s.status = 'finalized') AS "recordedClasses"
      FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.organization_id = $1 AND m.role = 'teacher' AND m.status = 'active' AND u.is_active = true
      ORDER BY u.name, u.email`, [orgId]);

    const marked = Number(summary?.markedRecords ?? 0);
    return {
      date: summary?.date,
      enrolledStudents: Number(summary?.enrolledStudents ?? 0),
      markedRecords: marked,
      studentAttendanceRate: marked ? Number((100 * Number(summary.presentRecords) / marked).toFixed(1)) : null,
      pendingRegisters: Number(summary?.pendingRegisters ?? 0),
      atRisk,
      trend: trend.map((day: any) => ({ ...day,
        attendanceRate: day.markedRecords ? Number((100 * day.presentRecords / day.markedRecords).toFixed(1)) : null })),
      teachers,
    };
  }

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
        COUNT(*) FILTER (WHERE sub.submitted_at IS NOT NULL AND sub.graded_at IS NULL)::int as pending_evaluations,
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
         SELECT t.section_id, COALESCE(ps.substitute_teacher_user_id, t.teacher_user_id) AS teacher_user_id,
           ps.id IS NOT NULL AS is_substitution, t.start_time, t.end_time
         FROM timetable_entries t
         JOIN academic_years y ON y.id = t.academic_year_id AND y.organization_id = t.organization_id AND y.is_current = true
         CROSS JOIN local_now
         LEFT JOIN principal_timetable_substitutions ps ON ps.organization_id = t.organization_id
           AND ps.timetable_entry_id = t.id AND ps.event_date = local_now.at_school::date
         WHERE t.organization_id = $1 AND t.day_of_week = EXTRACT(ISODOW FROM local_now.at_school)
           AND local_now.at_school::date BETWEEN y.start_date AND y.end_date
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
        pendingEvaluations: Number(submissionsStats?.pending_evaluations ?? 0),
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
