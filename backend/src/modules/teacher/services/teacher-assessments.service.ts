import { DrizzleService } from '../../../database/drizzle.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { SubmitAssessmentMarksDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherAssessmentsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getAssessments(organizationId: string, user: User) {
    const rows=await this.drizzle.query(`SELECT ee.*,sec.name AS section_name,sub.name AS subject_name FROM exam_evaluations ee JOIN sections sec ON sec.id=ee.section_id AND sec.organization_id=ee.organization_id JOIN subjects sub ON sub.id=ee.subject_id AND sub.organization_id=ee.organization_id WHERE ee.organization_id=$1 AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=ee.organization_id AND c.section_id=ee.section_id AND c.subject_id=ee.subject_id AND c.teacher_user_id=$2) ORDER BY ee.created_at DESC`, [organizationId,user.id]);
    const assessments=rows.map(r=>{
      const values=Object.values(r.student_scores || {}).map(Number).filter(Number.isFinite).sort((a,b)=>a-b),max=Number(r.max_marks);
      const average=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
      return {id:r.id,title:r.title,type:'Formative Test',classSection:r.section_name,sectionId:r.section_id,subject:r.subject_name,subjectId:r.subject_id,maxMarks:max,studentScores:r.student_scores,date:r.created_at,status:r.is_locked?'Marks Locked':'Marks Recorded',classAverage:average,highestScore:values.length?values[values.length-1]:null,lowestScore:values.length?values[0]:null,medianScore:values.length?(values[Math.floor((values.length-1)/2)]+values[Math.floor(values.length/2)])/2:null,passPercentage:values.length?100*values.filter(v=>v>=max*0.4).length/values.length:null,blueprint:null};
    });
    const examSchedules=await this.drizzle.query(`SELECT ep.id,ep.exam_name AS name,sec.name AS "classSection",sub.name AS subject,ep.exam_date AS date,ep.start_time || ' - ' || ep.end_time AS time,ep.status FROM principal_exam_plans ep JOIN sections sec ON sec.id=ep.section_id AND sec.organization_id=ep.organization_id JOIN subjects sub ON sub.id=ep.subject_id AND sub.organization_id=ep.organization_id WHERE ep.organization_id=$1 AND ep.status='scheduled' AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=ep.organization_id AND c.section_id=ep.section_id AND c.subject_id=ep.subject_id AND c.teacher_user_id=$2) ORDER BY ep.exam_date`, [organizationId,user.id]);
    return {assessments,examSchedules};
  }

  async submitMarks(organizationId: string, user: User, dto: SubmitAssessmentMarksDto) {
    const resolvedSectionId=dto.sectionId, resolvedSubjectId=dto.subjectId;
    const [assignment] = await this.drizzle.query(`SELECT 1 FROM class_subject_assignments WHERE organization_id=$1 AND section_id=$2 AND subject_id=$3 AND teacher_user_id=$4 LIMIT 1`, [organizationId,dto.sectionId,dto.subjectId,user.id]);
    if (!assignment) throw new NotFoundException('Assigned section and subject not found');
    const enrolled = await this.drizzle.query(`SELECT student_user_id FROM enrollments WHERE organization_id=$1 AND section_id=$2 AND status='active' AND student_user_id=ANY($3::uuid[])`, [organizationId,dto.sectionId,dto.scores.map(s=>s.studentId)]);
    const allowed = new Set(enrolled.map(s=>s.student_user_id));
    if (new Set(dto.scores.map(s=>s.studentId)).size !== dto.scores.length || dto.scores.some(s=>!allowed.has(s.studentId) || !Number.isFinite(s.score) || s.score<0 || s.score>dto.maxMarks)) throw new BadRequestException('Each score must belong to an enrolled student and be within the assessment marks');
    const scoresRecord: Record<string, number> = {};
    for (const sc of dto.scores) {
      scoresRecord[sc.studentId] = sc.score;
    }

    const [inserted] = await this.drizzle.query(
      `INSERT INTO exam_evaluations (
        organization_id, section_id, subject_id, title, max_marks, weightage, student_scores, is_locked
      )
      VALUES ($1, $2, $3, $4, $5, 20, $6, $7)
      RETURNING *`,
      [
        organizationId,
        resolvedSectionId,
        resolvedSubjectId,
        dto.title,
        dto.maxMarks,
        JSON.stringify(scoresRecord),
        !!dto.lockMarks,
      ]
    );

    return {
      success: true,
      evaluationId: inserted.id,
      evaluatedCount: dto.scores.length,
      locked: Boolean(dto.lockMarks),
      message: dto.lockMarks ? 'Marks submitted and locked for report card processing.' : 'Draft marks recorded successfully.',
    };
  }

  async submitQuestionPaper(organizationId: string, user: User, dto: any) {
    const [row] = await this.drizzle.query(
      `INSERT INTO principal_question_papers (
        organization_id, title, subject_name, grade, term, total_marks, duration_minutes,
        difficulty_easy_pct, difficulty_medium_pct, difficulty_hard_pct, competency_mapped,
        submitted_by_name, submitted_by_user_id, status, review_comments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Under Review', '')
      RETURNING *`,
      [
        organizationId,
        dto.title,
        dto.subjectName || 'General',
        dto.grade || 'Grade 10',
        dto.term || 'Term 1 Midterm',
        dto.totalMarks || 80,
        dto.durationMinutes || 180,
        dto.difficultyEasyPct ?? 30,
        dto.difficultyMediumPct ?? 50,
        dto.difficultyHardPct ?? 20,
        dto.competencyMapped ?? true,
        user.name || user.email || 'Teacher',
        user.id,
      ]
    );
    return row;
  }
}
