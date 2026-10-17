import { DrizzleService } from '../../../database/drizzle.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SubmitArenaAttemptDto } from '../dto/student.dto';

@Injectable()
export class StudentArenaService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getActivities(organizationId: string, studentUserId: string) {
    const rows = await this.drizzle.query(
      `SELECT q.id,q.topic,q.difficulty,q.content,q.question_type,q.max_score,s.name AS subject,
        (SELECT COUNT(*)::int FROM arena_attempts a WHERE a.organization_id=q.organization_id AND a.question_id=q.id AND a.student_id=$2) AS attempts,
        (SELECT MAX(100.0*a.score/NULLIF(a.max_score,0)) FROM arena_attempts a WHERE a.organization_id=q.organization_id AND a.question_id=q.id AND a.student_id=$2) AS best
       FROM arena_questions q JOIN subjects s ON s.id=q.subject_id AND s.organization_id=q.organization_id
       WHERE q.organization_id=$1 AND q.status='published' AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=q.organization_id AND e.section_id=q.section_id AND e.student_user_id=$2 AND e.status='active')
       ORDER BY q.created_at DESC`, [organizationId,studentUserId]);
    const activities = rows.map(q => ({ id:q.id,title:q.topic,topic:q.topic,subject:q.subject,difficulty:q.difficulty,mode:'practice',questionCount:1,
      attemptsMade:q.attempts,bestScore:q.best==null?null:Number(q.best),status:q.attempts?'completed':'available',
      questions:[{ id:q.id,question:q.content.prompt,options:(q.content.options || []).map((o:any)=>o.text),type:q.question_type }] }));
    const [stats] = await this.drizzle.query(
      `SELECT COUNT(*)::int AS "completedCount",COUNT(DISTINCT question_id)::int AS "attemptedCount",
        AVG(100.0*score/NULLIF(max_score,0)) AS "averageScore",MAX(100.0*score/NULLIF(max_score,0)) AS "bestScore"
       FROM arena_attempts WHERE organization_id=$1 AND student_id=$2`, [organizationId,studentUserId]);
    return { activities,performance:{ ...stats,averageScore:stats.averageScore==null?null:Number(stats.averageScore),bestScore:stats.bestScore==null?null:Number(stats.bestScore),topicMastery:[] } };
  }

  async submitAttempt(organizationId: string, studentUserId: string, activityId: string, dto: SubmitArenaAttemptDto) {
    const [q] = await this.drizzle.query(
      `SELECT q.* FROM arena_questions q WHERE q.organization_id=$1 AND q.id=$3 AND q.status='published'
       AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=q.organization_id AND e.section_id=q.section_id AND e.student_user_id=$2 AND e.status='active')`, [organizationId,studentUserId,activityId]);
    if (!q) throw new NotFoundException('Published question not found in your class');
    if (q.question_type === 'subjective') throw new BadRequestException('This question requires teacher evaluation');
    const options = q.content.options || [];
    if (!dto.submittedAnswer.length || dto.submittedAnswer.some(i=>!Number.isInteger(i)||!options[i]) || (q.question_type==='single_choice' && dto.submittedAnswer.length!==1)) throw new BadRequestException('Select valid answer options');
    const answer = [...new Set(dto.submittedAnswer.map(i=>options[i].id))];
    const isCorrect = answer.length===q.answer_key.length && answer.every(i=>q.answer_key.includes(i));
    const score = isCorrect?Number(q.max_score):0;
    const [attempt] = await this.drizzle.query(
      `INSERT INTO arena_attempts (organization_id,question_id,student_id,submitted_answer,is_correct,score,max_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [organizationId,q.id,studentUserId,JSON.stringify(answer),isCorrect,score,q.max_score]);
    return { success:true,id:attempt.id,score,maxScore:Number(q.max_score),isCorrect,correctIndex:options.findIndex((o:any)=>q.answer_key.includes(o.id)),explanation:q.content.explanation || '' };
  }
}
