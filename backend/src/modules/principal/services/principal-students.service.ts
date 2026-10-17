import { Injectable, NotFoundException } from "@nestjs/common";
import { DrizzleService } from "../../../database/drizzle.service";
import { User } from "../../auth/user.entity";
import {
  CreateEnrichmentProgramDto,
  CreateRemedialProgramDto,
  CreateStudentInterventionDto,
} from "../dto/principal.dto";

@Injectable()
export class PrincipalStudentsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getStudentsOverview(orgId: string, _actor: User) {
    const students = await this.drizzle.query(
      `SELECT u.id,u.name,u.email,e.roll_number AS "rollNumber",s.name AS "sectionName",p.name AS "className",
        (SELECT AVG(r.percentage) FROM principal_exam_results r WHERE r.organization_id=e.organization_id AND r.student_user_id=u.id AND r.status='Published') AS "overallAverage",
        (SELECT 100.0*COUNT(*) FILTER (WHERE ar.status IN ('present','late'))/NULLIF(COUNT(*),0) FROM attendance_records ar
         JOIN attendance_sessions ats ON ats.id=ar.attendance_session_id AND ats.organization_id=ar.organization_id
         WHERE ar.organization_id=e.organization_id AND ar.student_id=u.id AND ats.status='finalized') AS "attendanceRate",
        (SELECT 100.0*COUNT(*) FILTER (WHERE ss.status IN ('submitted','late','graded'))/NULLIF(COUNT(*),0) FROM submissions ss WHERE ss.organization_id=e.organization_id AND ss.student_id=u.id) AS "assignmentCompletion"
       FROM enrollments e JOIN users u ON u.id=e.student_user_id
       JOIN sections s ON s.id=e.section_id AND s.organization_id=e.organization_id
       JOIN programs p ON p.id=s.program_id AND p.organization_id=s.organization_id
       WHERE e.organization_id=$1 AND e.status='active' ORDER BY s.name,e.roll_number`, [orgId]);
    const enriched = students.map(s=> {
      const avg = s.overallAverage==null?null:Number(s.overallAverage);
      const att = s.attendanceRate==null?null:Number(s.attendanceRate);
      const riskStatus = avg!=null && avg<40 ? 'Academic Risk' : att!=null && att<75 ? 'Attendance Risk' : 'On Track';
      return { ...s,overallAverage:avg,attendanceRate:att,assignmentCompletion:s.assignmentCompletion==null?null:Number(s.assignmentCompletion),riskStatus,needsIntervention:riskStatus!=='On Track' };
    });
    const remedialPrograms = await this.drizzle.query(`SELECT * FROM principal_remedial_programs WHERE organization_id=$1 ORDER BY created_at DESC`, [orgId]);
    const enrichmentPrograms = await this.drizzle.query(`SELECT * FROM principal_enrichment_programs WHERE organization_id=$1 ORDER BY created_at DESC`, [orgId]);
    return { totalEnrolled:enriched.length,students:enriched,remedialPrograms,enrichmentPrograms };
  }

  async getStudent360(orgId: string, _actor: User, studentId: string) {
    const overviewData = await this.getStudentsOverview(orgId,_actor);
    const student = overviewData.students.find(s=>s.id===studentId);
    if (!student) throw new NotFoundException('Student not found in this school');
    const [profile] = await this.drizzle.query(`SELECT * FROM student_profiles WHERE organization_id=$1 AND student_user_id=$2`, [orgId,studentId]);
    const academics = await this.drizzle.query(
      `SELECT subject_name AS subject,AVG(percentage) AS "currentScore" FROM principal_exam_results
       WHERE organization_id=$1 AND student_user_id=$2 AND status='Published' GROUP BY subject_name`, [orgId,studentId]);
    const assessments = await this.drizzle.query(
      `SELECT exam_name AS assessment,subject_name AS subject,marks_obtained AS score,max_marks AS "maxMarks",published_at AS date
       FROM principal_exam_results WHERE organization_id=$1 AND student_user_id=$2 AND status='Published' ORDER BY published_at DESC`, [orgId,studentId]);
    const [attendance] = await this.drizzle.query(
      `SELECT COUNT(*)::int AS "totalWorkingDays",COUNT(*) FILTER (WHERE ar.status IN ('present','late'))::int AS "presentDays"
       FROM attendance_records ar JOIN attendance_sessions s ON s.id=ar.attendance_session_id AND s.organization_id=ar.organization_id
       WHERE ar.organization_id=$1 AND ar.student_id=$2 AND s.status='finalized'`, [orgId,studentId]);
    const [assignments] = await this.drizzle.query(
      `SELECT COUNT(*)::int AS "totalAssigned",COUNT(*) FILTER (WHERE status IN ('submitted','late','graded'))::int AS submitted,
        COUNT(*) FILTER (WHERE status='graded')::int AS evaluated,COUNT(*) FILTER (WHERE status='pending')::int AS "pendingSubmission",AVG(score) AS "averageAssignmentScore"
       FROM submissions WHERE organization_id=$1 AND student_id=$2`, [orgId,studentId]);
    const interventions = await this.drizzle.query(`SELECT * FROM principal_student_interventions WHERE organization_id=$1 AND student_user_id=$2 ORDER BY created_at DESC`, [orgId,studentId]);
    const teacherFeedback = await this.drizzle.query(
      `SELECT u.name AS teacher,su.name AS subject,s.feedback FROM submissions s
       JOIN assignments a ON a.id=s.assignment_id AND a.organization_id=s.organization_id
       JOIN subjects su ON su.id=a.subject_id AND su.organization_id=a.organization_id JOIN users u ON u.id=s.graded_by
       WHERE s.organization_id=$1 AND s.student_id=$2 AND s.feedback IS NOT NULL`, [orgId,studentId]);
    const [holisticProgress] = await this.drizzle.query(`SELECT cognitive_summary AS "cognitiveSummary",affective_summary AS "affectiveSummary",socio_emotional_summary AS "socioEmotionalSummary",psychomotor_summary AS "psychomotorSummary",creative_summary AS "creativeSummary" FROM principal_holistic_progress WHERE organization_id=$1 AND student_user_id=$2 ORDER BY created_at DESC LIMIT 1`, [orgId,studentId]);
    return { overview:{ ...student,section:student.sectionName,admissionNumber:profile?.admission_number || '',guardianName:profile?.guardian_name || '',guardianPhone:profile?.guardian_phone || '',attentionCategory:student.riskStatus },
      academics:academics.map(a=>({...a,currentScore:Number(a.currentScore),previousScore:null,change:null,trend:null})),
      attendance:{ ...attendance,attendancePercentage:student.attendanceRate,threshold:75,isDefaulter:student.attendanceRate!=null && student.attendanceRate<75,recentAbsences:[] },
      assignments,assessments,learningOutcomes:[],competencies:[],interventions,teacherFeedback,holisticProgress:holisticProgress || {} };
  }

  async getAtRiskStudents(orgId: string, _actor: User) {
    const data = await this.getStudentsOverview(orgId,_actor);
    const students = data.students.filter(s=>s.needsIntervention).map(s=>({...s,riskCategory:s.riskStatus,indicators:`Attendance: ${s.attendanceRate ?? 'Unknown'}; average: ${s.overallAverage ?? 'Unknown'}`}));
    return { summary:{ totalAtRisk:students.length,academicDropCount:students.filter(s=>s.overallAverage!=null && s.overallAverage<40).length,
      attendanceRiskCount:students.filter(s=>s.attendanceRate!=null && s.attendanceRate<75).length,assignmentLapseCount:students.filter(s=>s.assignmentCompletion!=null && s.assignmentCompletion<50).length },students };
  }

  async createIntervention(
    orgId: string,
    _actor: User,
    dto: CreateStudentInterventionDto,
  ) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO principal_student_interventions (
        organization_id, student_user_id, student_name, class_section, problem_area,
        evidence, goal, intervention_strategy, responsible_teacher_name, responsible_teacher_id,
        review_date, expected_outcome, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Active')
      RETURNING *`,
      [
        orgId,
        dto.studentUserId,
        dto.studentName,
        dto.classSection,
        dto.problemArea,
        dto.evidence || "",
        dto.goal,
        dto.interventionStrategy,
        dto.responsibleTeacherName,
        dto.responsibleTeacherId || null,
        dto.reviewDate,
        dto.expectedOutcome || "",
      ],
    );
    return inserted;
  }

  async createRemedialProgram(
    orgId: string,
    _actor: User,
    dto: CreateRemedialProgramDto,
  ) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO principal_remedial_programs (
        organization_id, title, subject_name, class_name, assigned_teacher_name,
        schedule, enrolled_student_count, target_competency, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active')
      RETURNING *`,
      [
        orgId,
        dto.title,
        dto.subjectName,
        dto.className,
        dto.assignedTeacherName,
        dto.schedule,
        dto.enrolledStudentCount ?? 0,
        dto.targetCompetency || "",
      ],
    );
    return inserted;
  }

  async createEnrichmentProgram(
    orgId: string,
    _actor: User,
    dto: CreateEnrichmentProgramDto,
  ) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO principal_enrichment_programs (
        organization_id, title, category, assigned_mentor_name, schedule, enrolled_student_count, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Active')
      RETURNING *`,
      [
        orgId,
        dto.title,
        dto.category || "Olympiad & Research",
        dto.assignedMentorName,
        dto.schedule,
        dto.enrolledStudentCount ?? 0,
      ],
    );
    return inserted;
  }
}
