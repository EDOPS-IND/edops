import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
import { CreateStudentGoalDto, CreateStudentSupportRequestDto, StudentReflectionDto } from '../dto/student.dto';

@Injectable()
export class StudentProgressService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getProgressOverview(organizationId: string, studentUserId: string) {
    const goals = await this.drizzle.query(
      `SELECT g.id, g.title, s.name AS subject, g.target_score AS "targetScore", g.current_score AS "currentScore",
        to_char(g.deadline,'YYYY-MM-DD') AS deadline, g.status,
        LEAST(100, ROUND(100.0*g.current_score/NULLIF(g.target_score,0)))::int AS "progressPct"
       FROM student_goals g LEFT JOIN subjects s ON s.id=g.subject_id AND s.organization_id=g.organization_id
       WHERE g.organization_id=$1 AND g.student_user_id=$2 ORDER BY g.created_at DESC`, [organizationId, studentUserId]);
    const supportRequests = await this.drizzle.query(
      `SELECT r.id, r.category, s.name AS subject, r.description, r.urgency, r.status, r.response,
        to_char(r.created_at,'YYYY-MM-DD') AS date
       FROM student_support_requests r LEFT JOIN subjects s ON s.id=r.subject_id AND s.organization_id=r.organization_id
       WHERE r.organization_id=$1 AND r.student_user_id=$2 ORDER BY r.created_at DESC`, [organizationId, studentUserId]);
    const interventions = await this.drizzle.query(
      `SELECT problem_area AS subject, evidence AS "needsPractice", intervention_strategy AS recommendations
       FROM principal_student_interventions WHERE organization_id=$1 AND student_user_id=$2 ORDER BY created_at DESC`, [organizationId, studentUserId]);
    const [selfReflection]=await this.drizzle.query(`SELECT ratings,reflection_text AS "reflectionText",improvement_text AS "improvementText" FROM student_reflections WHERE organization_id=$1 AND student_user_id=$2`,[organizationId,studentUserId]);
    return { selfReflection:selfReflection || null,gapsAndStrengths: interventions.map(i => ({ ...i, recommendations: [i.recommendations] })), goals, supportRequests,
      goalsAchieved: goals.filter(g => g.status === 'completed').length, totalGoals: goals.length };
  }

  async createGoal(organizationId: string, studentUserId: string, dto: CreateStudentGoalDto) {
    const [goal] = await this.drizzle.query(
      `INSERT INTO student_goals (organization_id,student_user_id,subject_id,title,target_score,deadline)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [organizationId, studentUserId, dto.subjectId || null, dto.title, dto.targetScore, dto.deadline]);
    return { success: true, goal };
  }

  async createSupportRequest(organizationId: string, studentUserId: string, dto: CreateStudentSupportRequestDto) {
    const [request] = await this.drizzle.query(
      `INSERT INTO student_support_requests (organization_id,student_user_id,category,subject_id,preferred_teacher_id,description,urgency)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [organizationId, studentUserId, dto.category, dto.subjectId || null, dto.preferredTeacherId || null, dto.description, dto.urgency || 'normal']);
    return { success: true, request };
  }
  async saveReflection(organizationId:string,studentUserId:string,dto:StudentReflectionDto) {
    const {reflectionText,improvementText,...ratings}=dto;
    const [reflection]=await this.drizzle.query(`INSERT INTO student_reflections (organization_id,student_user_id,ratings,reflection_text,improvement_text) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (organization_id,student_user_id) DO UPDATE SET ratings=EXCLUDED.ratings,reflection_text=EXCLUDED.reflection_text,improvement_text=EXCLUDED.improvement_text,updated_at=now() RETURNING *`,[organizationId,studentUserId,JSON.stringify(ratings),reflectionText,improvementText]);
    return reflection;
  }

}
