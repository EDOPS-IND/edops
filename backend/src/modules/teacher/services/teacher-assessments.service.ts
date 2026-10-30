import { DrizzleService } from '../../../database/drizzle.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { SubmitAssessmentMarksDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherAssessmentsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getAssessments(organizationId: string, user: User) {
    const rows=await this.drizzle.query(`SELECT ee.*, COALESCE(p.name || ' - ', '') || sec.name AS section_name, sub.name AS subject_name FROM exam_evaluations ee JOIN sections sec ON sec.id=ee.section_id AND sec.organization_id=ee.organization_id LEFT JOIN programs p ON p.id=sec.program_id AND p.organization_id=ee.organization_id JOIN subjects sub ON sub.id=ee.subject_id AND sub.organization_id=ee.organization_id WHERE ee.organization_id=$1 AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=ee.organization_id AND c.section_id=ee.section_id AND c.subject_id=ee.subject_id AND c.teacher_user_id=$2) ORDER BY ee.created_at DESC`, [organizationId,user.id]);
    const assessments=rows.map(r=>{
      const values=Object.values(r.student_scores || {}).map(Number).filter(Number.isFinite).sort((a,b)=>a-b),max=Number(r.max_marks);
      const average=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
      return {id:r.id,title:r.title,type:'Formative Test',classSection:r.section_name,sectionId:r.section_id,subject:r.subject_name,subjectId:r.subject_id,maxMarks:max,studentScores:r.student_scores,date:r.created_at,status:r.is_locked?'Marks Locked':'Marks Recorded',classAverage:average,highestScore:values.length?values[values.length-1]:null,lowestScore:values.length?values[0]:null,medianScore:values.length?(values[Math.floor((values.length-1)/2)]+values[Math.floor(values.length/2)])/2:null,passPercentage:values.length?100*values.filter(v=>v>=max*0.4).length/values.length:null,blueprint:null};
    });
    const examSchedules = await this.drizzle.query(
      `SELECT ep.id, ep.exam_name AS name,
              ep.section_id AS "sectionId",
              ep.subject_id AS "subjectId",
              COALESCE(p.name || ' - ', '') || sec.name AS "classSection",
              sub.name AS subject,
              TO_CHAR(ep.exam_date, 'YYYY-MM-DD') AS date,
              TO_CHAR(ep.start_time, 'HH24:MI') || ' - ' || TO_CHAR(ep.end_time, 'HH24:MI') AS time,
              TO_CHAR(ep.exam_date + INTERVAL '7 days', 'YYYY-MM-DD') AS "marksSubmissionDeadline",
              ep.max_marks AS "maxMarks",
              ep.passing_marks AS "passingMarks",
              ep.status,
              ee.id AS "evaluationId",
              ee.is_locked AS "isLocked",
              ee.student_scores AS "studentScores"
       FROM principal_exam_plans ep
       JOIN sections sec ON sec.id = ep.section_id AND sec.organization_id = ep.organization_id
       LEFT JOIN programs p ON p.id = sec.program_id AND p.organization_id = ep.organization_id
       JOIN academic_years y ON y.id = sec.academic_year_id AND y.organization_id = ep.organization_id AND y.is_current = true
       JOIN subjects sub ON sub.id = ep.subject_id AND sub.organization_id = ep.organization_id
       LEFT JOIN LATERAL (
         SELECT ee.id, ee.is_locked, ee.student_scores
         FROM exam_evaluations ee
         WHERE ee.organization_id = ep.organization_id
           AND ee.section_id = ep.section_id
           AND ee.subject_id = ep.subject_id
           AND ee.title = ep.exam_name
         ORDER BY ee.created_at DESC LIMIT 1
       ) ee ON true
       WHERE ep.organization_id = $1
         AND ep.status = 'scheduled'
         AND EXISTS (
           SELECT 1 FROM class_subject_assignments c
           WHERE c.organization_id = ep.organization_id
             AND c.section_id = ep.section_id
             AND c.subject_id = ep.subject_id
             AND c.teacher_user_id = $2
         )
       ORDER BY ep.exam_date, ep.start_time`,
      [organizationId, user.id],
    );
    const questionPapers = await this.drizzle.query(
      `SELECT id, title, subject_name AS "subjectName", grade, term, total_marks AS "totalMarks",
              duration_minutes AS "durationMinutes", difficulty_easy_pct AS "difficultyEasyPct",
              difficulty_medium_pct AS "difficultyMediumPct", difficulty_hard_pct AS "difficultyHardPct",
              blueprint_json AS "blueprintJson",
              competency_mapped AS "competencyMapped", status, review_comments AS "reviewComments",
              approved_at AS "approvedAt", created_at AS "createdAt"
       FROM principal_question_papers
       WHERE organization_id = $1 AND submitted_by_user_id = $2
       ORDER BY created_at DESC`,
      [organizationId, user.id],
    );
    return { assessments, examSchedules, questionPapers };
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

    const [existing] = await this.drizzle.query(
      `SELECT id, is_locked FROM exam_evaluations WHERE organization_id = $1 AND section_id = $2 AND subject_id = $3 AND title = $4 LIMIT 1`,
      [organizationId, resolvedSectionId, resolvedSubjectId, dto.title]
    );
    if (existing && existing.is_locked) {
      throw new BadRequestException('Marks are already submitted and locked for this assessment');
    }

    let savedRow;
    if (existing) {
      const [updated] = await this.drizzle.query(
        `UPDATE exam_evaluations
         SET max_marks = $5, student_scores = $6, is_locked = $7, updated_at = now()
         WHERE id = $8 AND organization_id = $1
         RETURNING *`,
        [
          organizationId,
          resolvedSectionId,
          resolvedSubjectId,
          dto.title,
          dto.maxMarks,
          JSON.stringify(scoresRecord),
          !!dto.lockMarks,
          existing.id,
        ]
      );
      savedRow = updated;
    } else {
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
      savedRow = inserted;
    }

    return {
      success: true,
      evaluationId: savedRow.id,
      evaluatedCount: dto.scores.length,
      locked: Boolean(dto.lockMarks),
      message: dto.lockMarks ? 'Marks submitted and locked for report card processing.' : 'Draft marks recorded successfully.',
    };
  }

  async submitQuestionPaper(organizationId: string, user: User, dto: any) {
    const blueprintJson = dto.blueprintJson || (dto.formattedContent ? { formattedContent: dto.formattedContent } : {});
    const [row] = await this.drizzle.query(
      `INSERT INTO principal_question_papers (
        organization_id, title, subject_name, grade, term, total_marks, duration_minutes,
        difficulty_easy_pct, difficulty_medium_pct, difficulty_hard_pct, blueprint_json, competency_mapped,
        submitted_by_name, submitted_by_user_id, status, review_comments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Under Review', '')
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
        JSON.stringify(blueprintJson),
        dto.competencyMapped ?? true,
        user.name || user.email || 'Teacher',
        user.id,
      ]
    );
    return row;
  }
}
