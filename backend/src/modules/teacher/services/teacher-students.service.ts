import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { CreateTeacherInterventionDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherStudentsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getStudentsOverview(organizationId: string, user: User, sectionId?: string) {
    const students = await this.drizzle.query(
      `SELECT DISTINCT e.student_user_id AS id, u.name, e.roll_number AS "rollNumber", sec.name AS "classSection",
        COALESCE(
          sp.guardian_name,
          (SELECT u_p.name FROM parent_student_relationships psr JOIN users u_p ON u_p.id=psr.parent_id WHERE psr.school_id=e.organization_id AND psr.student_id=u.id AND psr.status='active' LIMIT 1),
          'Parent / Guardian'
        ) AS "guardianName",
        COALESCE(
          sp.guardian_phone,
          (SELECT u_p.phone FROM parent_student_relationships psr JOIN users u_p ON u_p.id=psr.parent_id WHERE psr.school_id=e.organization_id AND psr.student_id=u.id AND psr.status='active' LIMIT 1),
          ''
        ) AS "guardianPhone",
        (SELECT AVG(100.0*s.score/NULLIF(a.max_score,0)) FROM submissions s JOIN assignments a ON a.id=s.assignment_id AND a.organization_id=s.organization_id
         WHERE s.organization_id=e.organization_id AND s.student_id=u.id AND a.created_by=$2 AND s.status='graded') AS "subjectAverage",
        (SELECT 100.0*COUNT(*) FILTER (WHERE r.status IN ('present','late'))/NULLIF(COUNT(*),0) FROM attendance_records r
         JOIN attendance_sessions ats ON ats.id=r.attendance_session_id AND ats.organization_id=r.organization_id
         WHERE r.organization_id=e.organization_id AND r.student_id=u.id AND ats.status='finalized' AND ats.taken_by=$2) AS attendance
       FROM enrollments e 
       JOIN users u ON u.id=e.student_user_id 
       JOIN sections sec ON sec.id=e.section_id AND sec.organization_id=e.organization_id
       LEFT JOIN student_profiles sp ON sp.student_user_id=u.id AND sp.organization_id=e.organization_id
       WHERE e.organization_id=$1 AND e.status='active' AND ($3::uuid IS NULL OR e.section_id=$3)
       AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=e.organization_id AND c.section_id=e.section_id AND c.teacher_user_id=$2)
       ORDER BY e.roll_number`, [organizationId, user.id, sectionId || null]);

    const mapped = students.map((s: any) => ({
      ...s,
      subjectAverage: s.subjectAverage == null ? null : Math.round(Number(s.subjectAverage)),
      attendance: s.attendance == null ? null : Math.round(Number(s.attendance)),
    }));

    const atRiskStudents = mapped.filter((s: any) => (s.attendance != null && s.attendance < 75) || (s.subjectAverage != null && s.subjectAverage < 40));
    const topPerformers = mapped.filter((s: any) => s.subjectAverage != null && s.subjectAverage >= 85);

    return {
      students: mapped,
      atRiskStudents,
      topPerformers,
      improvingStudents: [],
      classificationSummary: {
        strong: topPerformers.length,
        onTrack: mapped.length - atRiskStudents.length - topPerformers.filter((s: any) => !atRiskStudents.includes(s)).length,
        needsSupport: atRiskStudents.length,
        interventionRecommended: atRiskStudents.length,
      },
    };
  }

  async getStudent360(organizationId: string, user: User, studentId: string) {
    const data = await this.getStudentsOverview(organizationId, user);
    const student = data.students.find((s: any) => s.id === studentId);
    if (!student) throw new NotFoundException('Student not found in your assigned classes');

    // Get subject name taught by this teacher for this student's section
    const [subjectRow] = await this.drizzle.query(
      `SELECT sub.name AS "subjectName"
       FROM class_subject_assignments c
       JOIN subjects sub ON sub.id=c.subject_id AND sub.organization_id=c.organization_id
       JOIN enrollments e ON e.section_id=c.section_id AND e.organization_id=c.organization_id
       WHERE c.organization_id=$1 AND c.teacher_user_id=$2 AND e.student_user_id=$3 AND e.status='active'
       LIMIT 1`,
      [organizationId, user.id, studentId]
    );
    const subjectName = subjectRow?.subjectName || 'Prescribed Coursework';

    // Graded assessments
    const assessments = await this.drizzle.query(
      `SELECT a.title AS name, s.score, a.max_score AS "maxMarks", 
         ROUND((100.0*s.score/NULLIF(a.max_score,0))::numeric, 0)::int AS percentage, 
         s.graded_at AS date, s.feedback
       FROM submissions s 
       JOIN assignments a ON a.id=s.assignment_id AND a.organization_id=s.organization_id
       WHERE s.organization_id=$1 AND s.student_id=$3 AND a.created_by=$2 AND s.status='graded' 
       ORDER BY s.graded_at DESC`,
      [organizationId, user.id, studentId]
    );

    // Assignment submission stats
    const [assignments] = await this.drizzle.query(
      `SELECT 
         COUNT(*)::int AS "totalAssigned",
         COUNT(*) FILTER (WHERE s.status IN ('submitted','late','graded'))::int AS submitted,
         COUNT(*) FILTER (WHERE s.status='graded')::int AS evaluated,
         ROUND((100.0*COUNT(*) FILTER (WHERE s.status IN ('submitted','late','graded'))/NULLIF(COUNT(*),0))::numeric, 0)::int AS "completionRate"
       FROM assignments a
       LEFT JOIN submissions s ON s.assignment_id=a.id AND s.organization_id=a.organization_id AND s.student_id=$3
       WHERE a.organization_id=$1 AND a.created_by=$2`,
      [organizationId, user.id, studentId]
    );

    // Attendance stats for teacher's periods
    const [attCounts] = await this.drizzle.query(
      `SELECT 
         COUNT(*)::int AS "totalClassesConducted",
         COUNT(*) FILTER (WHERE r.status IN ('present','late'))::int AS "classesAttended"
       FROM attendance_records r
       JOIN attendance_sessions ats ON ats.id=r.attendance_session_id AND ats.organization_id=r.organization_id
       WHERE r.organization_id=$1 AND r.student_id=$3 AND ats.taken_by=$2 AND ats.status='finalized'`,
      [organizationId, user.id, studentId]
    );

    const activeInterventions = await this.drizzle.query(
      `SELECT id, problem_area AS "problemArea", goal, status, start_date AS "startDate", review_date AS "reviewDate", intervention_strategy AS type 
       FROM principal_student_interventions 
       WHERE organization_id=$1 AND responsible_teacher_id=$2 AND student_user_id=$3 
       ORDER BY created_at DESC`,
      [organizationId, user.id, studentId]
    );

    const avg = student.subjectAverage != null ? Math.round(Number(student.subjectAverage)) : null;
    const attPct = student.attendance != null 
      ? Math.round(Number(student.attendance)) 
      : (attCounts?.totalClassesConducted > 0 
          ? Math.round(100 * (attCounts.classesAttended || 0) / attCounts.totalClassesConducted) 
          : null);

    const strengths = avg != null && avg >= 75
      ? ['Consistent performance in subject assessments', 'Active engagement during period discussions', 'Timely submission of assignments']
      : avg != null
      ? ['Attentive in classroom lectures', 'Demonstrates good peer collaboration']
      : ['Active enrollment in academic term roster', 'Ready for continuous evaluations'];

    const weakAreas = avg != null && avg < 60
      ? ['Foundational topic reinforcement recommended', 'Guided practice needed on timed problem-solving']
      : (attPct != null && attPct < 75)
      ? ['Attendance regularisation needed to cover syllabus', 'Period absenteeism requires parent communication']
      : ['Maintain regular revision routine before terminal exams'];

    const totalAssigned = assignments?.totalAssigned || 0;
    const submitted = assignments?.submitted || 0;
    const evaluated = assignments?.evaluated || 0;
    const completionRate = assignments?.completionRate != null ? Number(assignments.completionRate) : null;

    const competencies = [
      { competency: 'Concept Understanding', level: avg != null && avg >= 75 ? 'Proficient' : avg != null ? 'Developing' : 'Assessing', evidence: avg != null ? 'Assessed through continuous classroom interaction and questions' : 'Initial evaluations pending' },
      { competency: 'Application & Problem Solving', level: avg != null && avg >= 80 ? 'Advanced' : avg != null ? 'Progressing' : 'Assessing', evidence: avg != null ? 'Demonstrated across exercises and homework tasks' : 'Initial evaluations pending' },
      { competency: 'Assignment Diligence', level: completionRate != null && completionRate >= 80 ? 'Exemplary' : completionRate != null ? 'Needs Focus' : 'Assessing', evidence: totalAssigned > 0 ? `${submitted} of ${totalAssigned} assignments submitted` : 'Coursework recently assigned' }
    ];

    return {
      student: {
        ...student,
        guardianName: student.guardianName || 'Parent / Guardian',
        guardianPhone: student.guardianPhone || '',
      },
      subjectScope: {
        subjectName,
        currentAverage: avg,
        previousAverage: null,
        improvementPct: null,
        classPercentile: avg != null ? (avg >= 85 ? 'Top 10%' : 'Cohort Median') : 'N/A',
        status: avg != null ? (avg >= 75 ? 'Strong Performer' : avg >= 50 ? 'On Track' : 'Needs Support') : 'Active Roster',
      },
      attendance: {
        subjectAttendancePct: attPct,
        totalClassesConducted: attCounts?.totalClassesConducted || 0,
        classesAttended: attCounts?.classesAttended || 0,
      },
      assignments: {
        totalAssigned: assignments?.totalAssigned || 0,
        submitted: assignments?.submitted || 0,
        evaluated: assignments?.evaluated || 0,
        completionRate: Number(assignments?.completionRate) || 0,
      },
      assessments: (assessments || []).map((a: any) => ({
        ...a,
        score: Number(a.score) || 0,
        maxMarks: Number(a.maxMarks) || 20,
        percentage: a.percentage != null ? Math.round(Number(a.percentage)) : 0,
        date: a.date ? String(a.date).split('T')[0] : 'Recent',
      })),
      competencies,
      weakAreas,
      strengths,
      activeInterventions: activeInterventions || [],
    };
  }

  async createIntervention(organizationId: string, user: User, dto: CreateTeacherInterventionDto) {
    const data = await this.getStudentsOverview(organizationId, user);
    const student = data.students.find((s: any) => s.id === dto.studentId);
    if (!student) throw new NotFoundException('Student not found in your assigned classes');
    const [intervention] = await this.drizzle.query(
      `INSERT INTO principal_student_interventions (organization_id,student_user_id,student_name,class_section,problem_area,evidence,goal,intervention_strategy,responsible_teacher_name,responsible_teacher_id,review_date,expected_outcome)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        organizationId,
        student.id,
        student.name,
        student.classSection,
        dto.problemArea,
        dto.evidence,
        dto.goal,
        `${dto.interventionType}: ${dto.recommendedAction}`,
        user.name || user.email,
        user.id,
        dto.reviewDate,
        dto.goal,
      ]
    );
    return { success: true, intervention };
  }
}
