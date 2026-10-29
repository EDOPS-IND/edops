import { DrizzleService } from "../../../database/drizzle.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { User } from "../../auth/user.entity";
import {
  AllocateSectionSubjectDto,
  ReviewLessonPlanDto,
  UpdateCurriculumProgressDto,
} from "../dto/principal.dto";

@Injectable()
export class PrincipalAcademicsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getAcademicsOverview(orgId: string, _actor: User) {
    const manager = this.drizzle;

    // Fetch classes / sections with class teacher & metrics
    const sections = await manager.query(
      `SELECT s.id, s.name, s.capacity, p.name as "programName",
        s.class_teacher_user_id as "classTeacherUserId",
        ctu.name as "classTeacherName",
        ctu.email as "classTeacherEmail",
        (SELECT COUNT(*)::int FROM enrollments e WHERE e.section_id = s.id AND e.organization_id = $1 AND e.status = 'active') as "enrolledCount",
        (SELECT COUNT(DISTINCT csa.subject_id)::int FROM class_subject_assignments csa WHERE csa.section_id = s.id AND csa.organization_id = $1) as "subjectsCount",
        (SELECT ROUND(AVG(CASE WHEN ar.status IN ('present','late') THEN 100.0 ELSE 0.0 END), 0)::int 
         FROM attendance_records ar 
         JOIN attendance_sessions ats ON ats.id = ar.attendance_session_id AND ats.organization_id = ar.organization_id
         WHERE ar.organization_id = $1 AND ats.section_id = s.id AND ats.status = 'finalized') as "attendanceRate"
       FROM sections s
       JOIN programs p ON p.id = s.program_id
       LEFT JOIN users ctu ON ctu.id = s.class_teacher_user_id
       WHERE s.organization_id = $1
       ORDER BY p.sequence_order ASC, s.name ASC`,
      [orgId],
    );

    const classesList = sections.map((c: any) => ({
      id: c.id,
      name: c.name,
      sectionName: c.name,
      programName: c.programName,
      className: c.programName,
      displayName: `${c.programName} - ${c.name}`,
      code: `${c.programName?.replace(/^Class\s*/i, "") || ""} ${c.name}`.trim(),
      enrolledCount: Number(c.enrolledCount || 0),
      studentCount: Number(c.enrolledCount || 0),
      capacity: Number(c.capacity || 40),
      isOverCapacity: Number(c.enrolledCount || 0) > Number(c.capacity || 40),
      classTeacherUserId: c.classTeacherUserId || null,
      classTeacherName: c.classTeacherName || null,
      classTeacherEmail: c.classTeacherEmail || null,
      subjectsCount: Number(c.subjectsCount || 0),
      attendanceRate:
        c.attendanceRate != null ? Number(c.attendanceRate) : null,
      averageScore: null,
      medianScore: null,
      passRate: null,
      assignmentCompletion: null,
      curriculumCompletion: null,
      trend: null,
    }));

    const [year] = await manager.query(
      `SELECT start_date, end_date,
              ROUND(
                LEAST(100.0, GREATEST(0.0,
                  (CURRENT_DATE - start_date)::numeric / NULLIF((end_date - start_date)::numeric, 0) * 100.0
                )), 0
              )::int as "expectedYearPct"
       FROM academic_years 
       WHERE organization_id = $1 AND (is_current = true OR start_date <= CURRENT_DATE) 
       ORDER BY is_current DESC, start_date DESC LIMIT 1`,
      [orgId],
    );
    const currentWeek = year?.start_date
      ? Math.max(
          0,
          Math.ceil(
            (Date.now() - new Date(year.start_date).getTime()) / (7 * 86400000),
          ),
        )
      : null;
    const nodeRows = await manager.query(
      `SELECT id, grade, subject_name, unit_name, chapter_name, expected_completion_week,
              actual_completion_percentage, learning_outcomes, competencies, status
       FROM principal_curriculum_nodes 
       WHERE organization_id = $1 
       ORDER BY grade, subject_name, expected_completion_week ASC, chapter_name`,
      [orgId],
    );

    // Sequential chapter pacing: Chapter 2 starts only after Chapter 1 window
    const curriculumNodes = nodeRows.map((n: any, idx: number) => {
      const actualProgress = Number(n.actual_completion_percentage || 0);
      let expectedProgress: number | null = null;
      if (currentWeek !== null) {
        // Find prior chapter end week for the same grade & subject
        let prevEndWeek = 0;
        for (let j = idx - 1; j >= 0; j--) {
          if (nodeRows[j].grade === n.grade && nodeRows[j].subject_name?.toLowerCase() === n.subject_name?.toLowerCase()) {
            prevEndWeek = Number(nodeRows[j].expected_completion_week || 0);
            break;
          }
        }
        const targetWeek = Math.max(prevEndWeek + 1, Number(n.expected_completion_week || 10));
        if (currentWeek <= prevEndWeek) {
          expectedProgress = 0; // Upcoming chapter, not started yet
        } else if (currentWeek >= targetWeek) {
          expectedProgress = 100; // Target deadline has elapsed
        } else {
          expectedProgress = Math.min(100, Math.round(((currentWeek - prevEndWeek) / (targetWeek - prevEndWeek)) * 100));
        }
      }

      return {
        id: n.id,
        grade: n.grade,
        subject: n.subject_name,
        unit: n.unit_name,
        chapter: n.chapter_name,
        expectedWeek: n.expected_completion_week,
        expectedProgress,
        actualProgress,
        gap: expectedProgress === null ? null : actualProgress - expectedProgress,
        status: n.status,
        learningOutcomes: n.learning_outcomes || [],
        competency: (n.competencies || []).join(", "),
      };
    });

    // Query subjects with aggregated faculty & section counts
    const subjectRows = await manager.query(
      `SELECT s.id, s.name, s.code, s.is_elective as "isElective",
              count(DISTINCT csa.section_id)::int AS "sectionCount",
              count(DISTINCT csa.teacher_user_id)::int AS "teacherCount",
              string_agg(DISTINCT u.name, ', ') AS "teachers"
       FROM subjects s
       LEFT JOIN class_subject_assignments csa ON csa.subject_id = s.id AND csa.organization_id = s.organization_id
       LEFT JOIN users u ON u.id = csa.teacher_user_id
       WHERE s.organization_id = $1
       GROUP BY s.id, s.name, s.code, s.is_elective ORDER BY s.name`,
      [orgId],
    );

    // Query class allocations per subject
    const sectionAllocations = await manager.query(
      `SELECT 
        csa.subject_id AS "subjectId",
        sec.id AS "sectionId",
        sec.name AS "sectionName",
        p.name AS "programName",
        concat(p.name, ' - ', sec.name) AS "displayName",
        u.id AS "teacherUserId",
        coalesce(u.name, 'Unassigned') AS "teacherName",
        u.email AS "teacherEmail",
        (SELECT count(*)::int FROM enrollments e WHERE e.section_id = sec.id AND e.organization_id = $1 AND e.status = 'active') AS "studentCount",
        (SELECT round(avg(CASE WHEN ar.status IN ('present','late') THEN 100.0 ELSE 0.0 END), 0)::int 
         FROM attendance_records ar 
         JOIN attendance_sessions ats ON ats.id = ar.attendance_session_id AND ats.organization_id = ar.organization_id
         WHERE ar.organization_id = $1 AND ats.section_id = sec.id AND ats.status = 'finalized') AS "attendanceRate"
       FROM class_subject_assignments csa
       JOIN sections sec ON sec.id = csa.section_id AND sec.organization_id = csa.organization_id
       JOIN programs p ON p.id = sec.program_id
       LEFT JOIN users u ON u.id = csa.teacher_user_id
       WHERE csa.organization_id = $1
       ORDER BY p.sequence_order ASC, sec.name ASC`,
      [orgId],
    );

    // Query assignment turn-in & score stats per subject-section
    const assignmentStats = await manager.query(
      `SELECT 
        a.subject_id AS "subjectId",
        a.section_id AS "sectionId",
        count(DISTINCT a.id)::int AS "totalAssignments",
        count(sub.id)::int AS "submittedCount",
        round(avg(CASE WHEN sub.status = 'graded' THEN 100.0 * sub.score / nullif(a.max_score, 0) ELSE null END)::numeric, 0)::int AS "avgScore"
       FROM assignments a
       LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.organization_id = a.organization_id
       WHERE a.organization_id = $1
       GROUP BY a.subject_id, a.section_id`,
      [orgId],
    );

    // Query exam evaluations per subject-section
    const examStats = await manager.query(
      `SELECT ee.subject_id AS "subjectId", ee.section_id AS "sectionId", ee.max_marks AS "maxMarks", ee.student_scores AS "studentScores"
       FROM exam_evaluations ee
       WHERE ee.organization_id = $1`,
      [orgId],
    );

    const subjects = subjectRows.map((s: any) => {
      // Find all sections teaching this subject
      const matchingAllocations = sectionAllocations.filter((a: any) => a.subjectId === s.id);
      
      const sections = matchingAllocations.map((sec: any) => {
        const asg = assignmentStats.find((a: any) => a.subjectId === s.id && a.sectionId === sec.sectionId);
        const totalAsg = asg?.totalAssignments || 0;
        const subCount = asg?.submittedCount || 0;
        const asgAvg = asg?.avgScore ?? null;
        const asgRate = (totalAsg > 0 && sec.studentCount > 0) 
          ? Math.min(100, Math.round((subCount / (totalAsg * sec.studentCount)) * 100)) 
          : null;

        const matchingExams = examStats.filter((e: any) => e.subjectId === s.id && e.sectionId === sec.sectionId);
        let examScoreSum = 0;
        let examScoreCount = 0;
        let examPassCount = 0;
        matchingExams.forEach((ex: any) => {
          const rawScores = typeof ex.studentScores === "string" ? JSON.parse(ex.studentScores) : (ex.studentScores || {});
          const maxM = Number(ex.maxMarks) || 100;
          Object.values(rawScores).forEach((sc: any) => {
            const val = Number(sc);
            if (Number.isFinite(val)) {
              examScoreSum += Math.min(100, Math.round((val / maxM) * 100));
              examScoreCount++;
              if (val >= maxM * 0.4) examPassCount++;
            }
          });
        });

        const examAvg = examScoreCount > 0 ? Math.round(examScoreSum / examScoreCount) : null;
        const examPassRate = examScoreCount > 0 ? Math.round((examPassCount / examScoreCount) * 100) : null;
        const sectionAvgScore = examAvg ?? asgAvg;
        const sectionPassRate = examPassRate ?? (sectionAvgScore !== null ? (sectionAvgScore >= 40 ? 100 : 0) : null);
        const sectionStatus = sectionAvgScore !== null 
          ? (sectionAvgScore < 50 ? "Needs Attention" : sectionAvgScore >= 75 ? "Excelling" : "On Track")
          : "Active";

        return {
          sectionId: sec.sectionId,
          sectionName: sec.sectionName,
          programName: sec.programName,
          displayName: sec.displayName,
          teacherUserId: sec.teacherUserId || null,
          teacherName: sec.teacherName,
          teacherEmail: sec.teacherEmail || null,
          studentCount: Number(sec.studentCount || 0),
          averageScore: sectionAvgScore,
          assignmentRate: asgRate,
          passRate: sectionPassRate,
          attendanceRate: sec.attendanceRate != null ? Number(sec.attendanceRate) : null,
          status: sectionStatus,
        };
      });

      // Aggregate metrics across sections
      const scoredSections = sections.filter((d: any) => d.averageScore != null);
      const avgScore = scoredSections.length 
        ? Math.round(scoredSections.reduce((acc: number, d: any) => acc + d.averageScore, 0) / scoredSections.length) 
        : null;

      const passedSections = sections.filter((d: any) => d.passRate != null);
      const passRate = passedSections.length 
        ? Math.round(passedSections.reduce((acc: number, d: any) => acc + d.passRate, 0) / passedSections.length) 
        : null;

      const asgSections = sections.filter((d: any) => d.assignmentRate != null);
      const assignmentRate = asgSections.length 
        ? Math.round(asgSections.reduce((acc: number, d: any) => acc + d.assignmentRate, 0) / asgSections.length) 
        : null;

      // Match curriculum progress for this subject
      const subNodes = curriculumNodes.filter((n: any) => n.subject && n.subject.toLowerCase() === s.name.toLowerCase());
      const curriculum = subNodes.length 
        ? Math.round(subNodes.reduce((acc: number, n: any) => acc + (n.actualProgress || 0), 0) / subNodes.length) 
        : null;
      const expectedCurriculum = subNodes.length 
        ? (year?.expectedYearPct != null 
            ? Number(year.expectedYearPct) 
            : Math.round(subNodes.reduce((acc: number, n: any) => acc + (n.expectedProgress || 0), 0) / subNodes.length))
        : null;
      const gap = (curriculum !== null && expectedCurriculum !== null) ? curriculum - expectedCurriculum : null;

      const status = sections.length === 0 
        ? "Unassigned" 
        : (gap !== null && gap < -5) || (avgScore !== null && avgScore < 50) 
        ? "Needs Attention" 
        : "On Track";

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        isElective: Boolean(s.isElective),
        teacher: s.teachers || "Unassigned",
        teacherCount: Number(s.teacherCount || 0),
        sectionCount: Number(s.sectionCount || 0),
        classes: `${s.sectionCount} sections`,
        average: avgScore,
        passRate,
        assignmentRate,
        curriculum,
        expectedCurriculum,
        gap,
        status,
        sections,
      };
    });

    const planRows = await manager.query(
      `SELECT id, teacher_name, class_section, subject_name, topic,
              to_char(planned_date, 'YYYY-MM-DD') AS "plannedDate", learning_outcomes,
              teaching_strategy, assessment_method, status, principal_feedback
       FROM principal_lesson_plans WHERE organization_id = $1 ORDER BY planned_date DESC LIMIT 50`,
      [orgId],
    );
    const lessonPlans = planRows.map((p: any) => ({
      id: p.id,
      teacherName: p.teacher_name,
      classSection: p.class_section,
      subject: p.subject_name,
      topic: p.topic,
      plannedDate: p.plannedDate,
      learningOutcomes: p.learning_outcomes,
      teachingStrategy: p.teaching_strategy,
      assessmentMethod: p.assessment_method,
      status: p.status,
      principalFeedback: p.principal_feedback,
    }));

    const programs = await manager.query(
      `SELECT id, name, sequence_order as "sequenceOrder" FROM programs WHERE organization_id = $1 ORDER BY sequence_order, name`,
      [orgId],
    );

    return {
      classes: classesList,
      subjects,
      curriculumNodes,
      lessonPlans,
      programs,
    };
  }

  async getClassPerformance(orgId: string, _actor: User, classId: string) {
    const [section] = await this.drizzle.query(
      `SELECT id,name FROM sections WHERE organization_id=$1 AND id=$2`,
      [orgId, classId],
    );
    if (!section) throw new NotFoundException("Class section not found");
    const [counts] = await this.drizzle.query(
      `SELECT COUNT(*)::int AS students FROM enrollments WHERE organization_id=$1 AND section_id=$2 AND status='active'`,
      [orgId, classId],
    );
    const subjects = await this.drizzle.query(
      `SELECT sub.name,u.name AS teacher,AVG(100.0*ss.score/NULLIF(a.max_score,0)) AS avg FROM class_subject_assignments c JOIN subjects sub ON sub.organization_id=c.organization_id AND sub.id=c.subject_id JOIN users u ON u.id=c.teacher_user_id LEFT JOIN assignments a ON a.organization_id=c.organization_id AND a.section_id=c.section_id AND a.subject_id=c.subject_id LEFT JOIN submissions ss ON ss.organization_id=a.organization_id AND ss.assignment_id=a.id AND ss.status='graded' WHERE c.organization_id=$1 AND c.section_id=$2 GROUP BY sub.name,u.name`,
      [orgId, classId],
    );
    const measured = subjects.filter((s) => s.avg != null);
    return {
      classId,
      name: section.name,
      studentCount: counts.students,
      averageScore: measured.length
        ? measured.reduce((sum, s) => sum + Number(s.avg), 0) / measured.length
        : null,
      passRate: null,
      attendance: null,
      curriculumProgress: null,
      assignmentCompletion: null,
      subjects: subjects.map((s) => ({
        ...s,
        avg: s.avg == null ? null : Number(s.avg),
        target: null,
        status: s.avg == null ? "No results" : "Recorded",
      })),
      atRiskStudentsCount: null,
      remedialAssignedCount: null,
    };
  }

  async updateCurriculumProgress(
    orgId: string,
    _actor: User,
    dto: UpdateCurriculumProgressDto,
  ) {
    const manager = this.drizzle;
    const rows = await manager.query(
      `UPDATE principal_curriculum_nodes
       SET actual_completion_percentage = $1, status = $2
       WHERE id = $3 AND organization_id = $4 RETURNING id`,
      [
        dto.actualCompletionPercentage,
        dto.status || "On Track",
        dto.nodeId,
        orgId,
      ],
    );
    if (!rows.length)
      throw new NotFoundException("Curriculum chapter not found");
    return {
      success: true,
      nodeId: dto.nodeId,
      progress: dto.actualCompletionPercentage,
    };
  }

  async reviewLessonPlan(
    orgId: string,
    actor: User,
    lessonId: string,
    dto: ReviewLessonPlanDto,
  ) {
    const manager = this.drizzle;
    const rows = await manager.query(
      `UPDATE principal_lesson_plans
       SET status = $1, principal_feedback = $2, reviewed_by = $3, reviewed_at = now()
       WHERE id = $4 AND organization_id = $5 RETURNING id`,
      [dto.status, dto.principalFeedback || "", actor.id, lessonId, orgId],
    );
    if (!rows.length) throw new NotFoundException("Lesson plan not found");
    return { success: true, lessonId, status: dto.status };
  }

  async updateClassTeacher(
    orgId: string,
    sectionId: string,
    teacherUserId: string | null,
  ) {
    if (teacherUserId) {
      const [t] = await this.drizzle.query(
        `SELECT u.id, u.name FROM users u JOIN memberships m ON m.user_id = u.id WHERE m.organization_id = $1 AND u.id = $2 AND m.role = 'teacher'`,
        [orgId, teacherUserId],
      );
      if (!t) throw new NotFoundException("Teacher not found in this school");

      const [existing] = await this.drizzle.query(
        `SELECT s.name as "sectionName", p.name as "programName"
         FROM sections s
         JOIN programs p ON p.id = s.program_id
         WHERE s.organization_id = $1 AND s.class_teacher_user_id = $2 AND s.id != $3
         LIMIT 1`,
        [orgId, teacherUserId, sectionId],
      );
      if (existing) {
        throw new ConflictException(
          `Teacher ${t.name} is already assigned as Class Teacher for ${existing.programName || ""} ${existing.sectionName || ""}`.trim(),
        );
      }
    }
    const [row] = await this.drizzle.query(
      `UPDATE sections SET class_teacher_user_id = $1 WHERE organization_id = $2 AND id = $3 RETURNING id, class_teacher_user_id as "classTeacherUserId"`,
      [teacherUserId || null, orgId, sectionId],
    );
    if (!row) throw new NotFoundException("Section not found");
    return { success: true, sectionId, classTeacherUserId: teacherUserId };
  }

  async getSectionDetail(orgId: string, sectionId: string) {
    const manager = this.drizzle;
    const [section] = await manager.query(
      `SELECT s.id, s.name, s.capacity, p.name as "programName",
              s.class_teacher_user_id as "classTeacherUserId",
              ctu.name as "classTeacherName", ctu.email as "classTeacherEmail",
              (SELECT COUNT(*)::int FROM enrollments e WHERE e.section_id = s.id AND e.organization_id = $1 AND e.status = 'active') as "enrolledCount"
       FROM sections s
       JOIN programs p ON p.id = s.program_id
       LEFT JOIN users ctu ON ctu.id = s.class_teacher_user_id
       WHERE s.organization_id = $1 AND s.id = $2`,
      [orgId, sectionId],
    );
    if (!section) throw new NotFoundException("Section not found");

    const subjects = await manager.query(
      `SELECT 
         sub.id as "subjectId", sub.name as "subjectName", sub.code as "subjectCode",
         csa.teacher_user_id as "teacherUserId", u.name as "teacherName", u.email as "teacherEmail",
         (SELECT COUNT(*)::int FROM principal_curriculum_nodes pcn WHERE pcn.organization_id = $1 AND pcn.subject_name = sub.name AND (pcn.grade = prog.name OR pcn.grade = REPLACE(prog.name, 'Class ', ''))) as "totalChapters",
         (SELECT ROUND(AVG(pcn.actual_completion_percentage), 0)::int FROM principal_curriculum_nodes pcn WHERE pcn.organization_id = $1 AND pcn.subject_name = sub.name AND (pcn.grade = prog.name OR pcn.grade = REPLACE(prog.name, 'Class ', ''))) as "completionPct",
         (SELECT COUNT(*)::int FROM timetable_entries te WHERE te.organization_id = $1 AND te.section_id = sec.id AND te.subject_id = sub.id) as "weeklyPeriodsCount",
         (SELECT COALESCE(tu.name, tu.email) FROM timetable_entries te JOIN users tu ON tu.id = te.teacher_user_id WHERE te.organization_id = $1 AND te.section_id = sec.id AND te.subject_id = sub.id GROUP BY te.teacher_user_id, tu.name, tu.email ORDER BY COUNT(*) DESC LIMIT 1) as "timetableTeacherName",
         (SELECT te.teacher_user_id FROM timetable_entries te WHERE te.organization_id = $1 AND te.section_id = sec.id AND te.subject_id = sub.id GROUP BY te.teacher_user_id ORDER BY COUNT(*) DESC LIMIT 1) as "timetableTeacherUserId"
       FROM subjects sub
       JOIN sections sec ON sec.id = $2 AND sec.organization_id = $1
       JOIN programs prog ON prog.id = sec.program_id
       LEFT JOIN class_subject_assignments csa ON csa.section_id = sec.id AND csa.subject_id = sub.id AND csa.organization_id = $1
       LEFT JOIN users u ON u.id = csa.teacher_user_id
       WHERE sub.organization_id = $1
         AND (csa.id IS NOT NULL OR EXISTS (SELECT 1 FROM timetable_entries te WHERE te.organization_id = $1 AND te.section_id = sec.id AND te.subject_id = sub.id))
       ORDER BY sub.name`,
      [orgId, sectionId],
    );

    const availableSubjects = await manager.query(
      `SELECT s.id, s.name, s.code
       FROM subjects s
       WHERE s.organization_id = $1
       ORDER BY s.name ASC`,
      [orgId],
    );

    const students = await manager.query(
      `SELECT 
         u.id as "studentId", u.name, u.email, COALESCE(u.phone, '') as "phone",
         e.roll_number as "rollNo", sp.admission_number as "admissionNo",
         sp.guardian_name as "parentName", sp.guardian_phone as "parentPhone",
         (SELECT ROUND(AVG(CASE WHEN ar.status IN ('present','late') THEN 100.0 ELSE 0.0 END), 0)::int 
          FROM attendance_records ar 
          JOIN attendance_sessions ats ON ats.id = ar.attendance_session_id AND ats.organization_id = ar.organization_id
          WHERE ar.organization_id = $1 AND ar.student_id = u.id AND ats.section_id = $2 AND ats.status = 'finalized') as "attendanceRate"
       FROM enrollments e
       JOIN users u ON u.id = e.student_user_id
       LEFT JOIN student_profiles sp ON sp.student_user_id = u.id AND sp.organization_id = $1
       WHERE e.organization_id = $1 AND e.section_id = $2 AND e.status = 'active'
       ORDER BY e.roll_number ASC, u.name ASC`,
      [orgId, sectionId],
    );

    const teachers = await manager.query(
      `SELECT u.id, u.name, u.email, COALESCE(u.phone, '') as "phone"
       FROM users u
       JOIN memberships m ON m.user_id = u.id AND m.organization_id = $1 AND m.role = 'teacher' AND m.status = 'active'
       WHERE NOT EXISTS (
         SELECT 1 FROM sections s 
         WHERE s.organization_id = $1 
           AND s.class_teacher_user_id = u.id 
           AND s.id != $2
       )
       ORDER BY u.name ASC`,
      [orgId, sectionId],
    );

    return {
      section: {
        id: section.id,
        name: section.name,
        programName: section.programName,
        code: `${section.programName?.replace(/^Class\s*/i, "") || ""} ${section.name}`.trim(),
        capacity: Number(section.capacity || 40),
        enrolledCount: Number(section.enrolledCount || 0),
        classTeacherUserId: section.classTeacherUserId || null,
        classTeacherName: section.classTeacherName || null,
        classTeacherEmail: section.classTeacherEmail || null,
      },
      subjects: subjects.map((s: any) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        subjectCode: s.subjectCode || "SUB",
        teacherUserId: s.teacherUserId || null,
        teacherName: s.teacherName || null,
        teacherEmail: s.teacherEmail || null,
        totalChapters: Number(s.totalChapters || 0),
        completionPct: s.completionPct != null ? Number(s.completionPct) : 0,
        weeklyPeriodsCount: Number(s.weeklyPeriodsCount || 0),
        timetableTeacherName: s.timetableTeacherName || null,
        timetableTeacherUserId: s.timetableTeacherUserId || null,
      })),
      availableSubjects: (availableSubjects || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        code: s.code || "SUB",
      })),
      students: students.map((st: any) => ({
        studentId: st.studentId,
        name: st.name,
        email: st.email,
        phone: st.phone,
        rollNo: (st.rollNo || "").replace(/^ROLL-?/i, ""),
        admissionNo: st.admissionNo || "",
        parentName: st.parentName || "Not assigned",
        parentPhone: st.parentPhone || "-",
        attendanceRate:
          st.attendanceRate != null ? Number(st.attendanceRate) : 100,
      })),
      teachers,
    };
  }

  async allocateSectionSubject(
    orgId: string,
    sectionId: string,
    dto: AllocateSectionSubjectDto,
  ) {
    const manager = this.drizzle;
    const [section] = await manager.query(
      `SELECT s.id, s.name, s.class_teacher_user_id as "classTeacherUserId"
       FROM sections s WHERE s.organization_id = $1 AND s.id = $2`,
      [orgId, sectionId],
    );
    if (!section) throw new NotFoundException("Section not found in this school");

    let subjectId = dto.subjectId;
    if (!subjectId && dto.newSubjectName) {
      const trimmedName = dto.newSubjectName.trim();
      const code = (dto.newSubjectCode || trimmedName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4) || "SUB").toUpperCase();

      const [existing] = await manager.query(
        `SELECT id FROM subjects WHERE organization_id = $1 AND (LOWER(name) = LOWER($2) OR UPPER(code) = UPPER($3))`,
        [orgId, trimmedName, code],
      );
      if (existing) {
        subjectId = existing.id;
      } else {
        const [created] = await manager.query(
          `INSERT INTO subjects (organization_id, name, code) VALUES ($1, $2, $3) RETURNING id`,
          [orgId, trimmedName, code],
        );
        subjectId = created.id;
      }
    }

    if (!subjectId) {
      throw new BadRequestException("Please select an existing subject or provide a new subject name");
    }

    let teacherUserId = dto.teacherUserId;
    if (!teacherUserId && section.classTeacherUserId) {
      teacherUserId = section.classTeacherUserId;
    }
    if (!teacherUserId) {
      const [firstTeacher] = await manager.query(
        `SELECT u.id FROM users u JOIN memberships m ON m.user_id = u.id WHERE m.organization_id = $1 AND m.role = 'teacher' AND m.status = 'active' ORDER BY u.name ASC LIMIT 1`,
        [orgId],
      );
      if (!firstTeacher) {
        throw new BadRequestException("No active teachers available to allocate for this subject");
      }
      teacherUserId = firstTeacher.id;
    } else {
      const [t] = await manager.query(
        `SELECT u.id FROM users u JOIN memberships m ON m.user_id = u.id WHERE m.organization_id = $1 AND u.id = $2 AND m.role = 'teacher'`,
        [orgId, teacherUserId],
      );
      if (!t) throw new NotFoundException("Teacher not found in this school");
    }

    const [row] = await manager.query(
      `INSERT INTO class_subject_assignments (organization_id, section_id, subject_id, teacher_user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id, section_id, subject_id)
       DO UPDATE SET teacher_user_id = EXCLUDED.teacher_user_id
       RETURNING id, section_id as "sectionId", subject_id as "subjectId", teacher_user_id as "teacherUserId"`,
      [orgId, sectionId, subjectId, teacherUserId],
    );

    return {
      success: true,
      assignmentId: row?.id,
      sectionId,
      subjectId,
      teacherUserId,
    };
  }

  async removeSectionSubject(orgId: string, sectionId: string, subjectId: string) {
    const manager = this.drizzle;
    await manager.query(
      `DELETE FROM timetable_entries WHERE organization_id = $1 AND section_id = $2 AND subject_id = $3`,
      [orgId, sectionId, subjectId],
    );
    await manager.query(
      `DELETE FROM class_subject_assignments WHERE organization_id = $1 AND section_id = $2 AND subject_id = $3`,
      [orgId, sectionId, subjectId],
    );
    return {
      success: true,
      sectionId,
      subjectId,
      message: "Subject successfully unallocated from class section",
    };
  }
}
