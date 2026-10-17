import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { CreateTeacherInterventionDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherStudentsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getStudentsOverview(organizationId: string, user: User, sectionId?: string) {
    const students = await this.drizzle.query(
      `SELECT DISTINCT e.student_user_id AS id,u.name,e.roll_number AS "rollNumber",sec.name AS "classSection",
        (SELECT AVG(100.0*s.score/NULLIF(a.max_score,0)) FROM submissions s JOIN assignments a ON a.id=s.assignment_id AND a.organization_id=s.organization_id
         WHERE s.organization_id=e.organization_id AND s.student_id=u.id AND a.created_by=$2 AND s.status='graded') AS "subjectAverage",
        (SELECT 100.0*COUNT(*) FILTER (WHERE r.status IN ('present','late'))/NULLIF(COUNT(*),0) FROM attendance_records r
         JOIN attendance_sessions ats ON ats.id=r.attendance_session_id AND ats.organization_id=r.organization_id
         WHERE r.organization_id=e.organization_id AND r.student_id=u.id AND ats.status='finalized' AND ats.taken_by=$2) AS attendance
       FROM enrollments e JOIN users u ON u.id=e.student_user_id JOIN sections sec ON sec.id=e.section_id AND sec.organization_id=e.organization_id
       WHERE e.organization_id=$1 AND e.status='active' AND ($3::uuid IS NULL OR e.section_id=$3)
       AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=e.organization_id AND c.section_id=e.section_id AND c.teacher_user_id=$2)
       ORDER BY e.roll_number`, [organizationId,user.id,sectionId || null]);
    const mapped = students.map(s=>({...s,subjectAverage:s.subjectAverage==null?null:Number(s.subjectAverage),attendance:s.attendance==null?null:Number(s.attendance)}));
    const atRiskStudents = mapped.filter(s=>(s.attendance!=null && s.attendance<75)||(s.subjectAverage!=null && s.subjectAverage<40));
    const topPerformers = mapped.filter(s=>s.subjectAverage!=null && s.subjectAverage>=85);
    return { students:mapped,atRiskStudents,topPerformers,improvingStudents:[],
      classificationSummary:{ strong:topPerformers.length,onTrack:mapped.length-atRiskStudents.length-topPerformers.filter(s=>!atRiskStudents.includes(s)).length,needsSupport:atRiskStudents.length,interventionRecommended:0 } };
  }

  async getStudent360(organizationId: string, user: User, studentId: string) {
    const data = await this.getStudentsOverview(organizationId,user);
    const student = data.students.find(s=>s.id===studentId);
    if (!student) throw new NotFoundException('Student not found in your assigned classes');
    const assessments = await this.drizzle.query(
      `SELECT a.title AS name,s.score,a.max_score AS "maxMarks",100.0*s.score/NULLIF(a.max_score,0) AS percentage,s.graded_at AS date,s.feedback
       FROM submissions s JOIN assignments a ON a.id=s.assignment_id AND a.organization_id=s.organization_id
       WHERE s.organization_id=$1 AND s.student_id=$3 AND a.created_by=$2 AND s.status='graded' ORDER BY s.graded_at DESC`, [organizationId,user.id,studentId]);
    const [assignments] = await this.drizzle.query(
      `SELECT COUNT(*)::int AS "totalAssigned",COUNT(*) FILTER (WHERE s.status IN ('submitted','late','graded'))::int AS submitted,
        COUNT(*) FILTER (WHERE s.status='graded')::int AS evaluated,
        100.0*COUNT(*) FILTER (WHERE s.status IN ('submitted','late','graded'))/NULLIF(COUNT(*),0) AS "completionRate"
       FROM submissions s JOIN assignments a ON a.id=s.assignment_id AND a.organization_id=s.organization_id
       WHERE s.organization_id=$1 AND a.created_by=$2 AND s.student_id=$3`, [organizationId,user.id,studentId]);
    const activeInterventions = await this.drizzle.query(`SELECT id,problem_area AS "problemArea",goal,status,start_date AS "startDate",review_date AS "reviewDate",intervention_strategy AS type FROM principal_student_interventions WHERE organization_id=$1 AND responsible_teacher_id=$2 AND student_user_id=$3 ORDER BY created_at DESC`, [organizationId,user.id,studentId]);
    return { student,subjectScope:{ currentAverage:student.subjectAverage,previousAverage:null,improvementPct:null,classPercentile:null,status:'Recorded results' },
      attendance:{ subjectAttendancePct:student.attendance,totalClassesConducted:null,classesAttended:null },assignments,assessments,competencies:[],weakAreas:[],strengths:[],activeInterventions };
  }

  async createIntervention(organizationId: string, user: User, dto: CreateTeacherInterventionDto) {
    const data = await this.getStudentsOverview(organizationId,user);
    const student = data.students.find(s=>s.id===dto.studentId);
    if (!student) throw new NotFoundException('Student not found in your assigned classes');
    const [intervention] = await this.drizzle.query(
      `INSERT INTO principal_student_interventions (organization_id,student_user_id,student_name,class_section,problem_area,evidence,goal,intervention_strategy,responsible_teacher_name,responsible_teacher_id,review_date,expected_outcome)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [organizationId,student.id,student.name,student.classSection,dto.problemArea,dto.evidence,dto.goal,`${dto.interventionType}: ${dto.recommendedAction}`,user.name || user.email,user.id,dto.reviewDate,dto.goal]);
    return { success:true,intervention };
  }
}
