import { Injectable } from '@nestjs/common';
import { User } from '../auth/user.entity';
import { TeachingAccess } from '../assignments/teaching-access.service';
import { ClassQuery } from '../assignments/teaching.dto';
import { Queryable } from '../billing/entitlements';

@Injectable()
export class ScorecardsService {
  constructor(private readonly access: TeachingAccess) {}

  async refresh(manager: Queryable, org: string, sectionId: string, subjectId: string | null, studentId?: string) {
    // ponytail: refresh one class/subject on writes; scope to one student when possible to avoid deadlocks.
    // Aggregate independently before joining, so attendance never multiplies assignment counts.
    const params = [org, sectionId, subjectId, studentId ?? null];
    await manager.query(`WITH grades AS (
      SELECT s.student_id, count(*)::int AS assigned,
        count(s.submitted_at)::int AS submitted, count(s.score)::int AS graded,
        avg(s.score / a.max_score * 100) AS average
      FROM submissions s JOIN assignments a ON a.organization_id=s.organization_id AND a.id=s.assignment_id
      WHERE a.organization_id=$1 AND a.section_id=$2 AND a.subject_id IS NOT DISTINCT FROM $3::uuid AND a.status='published'
        AND ($4::uuid IS NULL OR s.student_id=$4)
      GROUP BY s.student_id
    ), attendance AS (
      SELECT r.student_id, count(*) FILTER (WHERE r.status IS NOT NULL AND r.status <> 'excused')::int AS counted,
        count(*) FILTER (WHERE r.status IN ('present','late'))::int AS attended
      FROM attendance_records r JOIN attendance_sessions a ON a.organization_id=r.organization_id AND a.id=r.attendance_session_id
      WHERE a.organization_id=$1 AND a.section_id=$2 AND a.subject_id IS NOT DISTINCT FROM $3::uuid AND a.status='finalized'
        AND ($4::uuid IS NULL OR r.student_id=$4)
      GROUP BY r.student_id
    ), practice_questions AS (
      SELECT a.student_id,a.question_id,count(*)::int AS attempts,max(100.0*a.score/a.max_score) AS best
      FROM arena_attempts a JOIN arena_questions q ON q.organization_id=a.organization_id AND q.id=a.question_id
      WHERE q.organization_id=$1 AND q.section_id=$2 AND q.subject_id IS NOT DISTINCT FROM $3::uuid
        AND ($4::uuid IS NULL OR a.student_id=$4) GROUP BY a.student_id,a.question_id
    ), practice AS (
      SELECT student_id,sum(attempts)::int AS attempts,count(*)::int AS questions,avg(best) AS score
      FROM practice_questions GROUP BY student_id
    ), students AS (SELECT student_id FROM grades UNION SELECT student_id FROM attendance UNION SELECT student_id FROM practice)
    INSERT INTO scorecards (organization_id, student_id, section_id, subject_id, assignment_count, submitted_count,
      graded_count, avg_score, completion_pct, attendance_count, attended_count, attendance_pct, generated_at,
      arena_attempt_count, arena_question_count, arena_score)
    SELECT $1, s.student_id, $2, $3, coalesce(g.assigned,0), coalesce(g.submitted,0), coalesce(g.graded,0), g.average,
      100.0*g.submitted/nullif(g.assigned,0), coalesce(a.counted,0), coalesce(a.attended,0),
      100.0*a.attended/nullif(a.counted,0), clock_timestamp(),coalesce(p.attempts,0),coalesce(p.questions,0),p.score
    FROM students s LEFT JOIN grades g USING(student_id) LEFT JOIN attendance a USING(student_id) LEFT JOIN practice p USING(student_id)
    ON CONFLICT (organization_id, student_id, section_id, subject_id) DO UPDATE SET
      assignment_count=excluded.assignment_count, submitted_count=excluded.submitted_count, graded_count=excluded.graded_count,
      avg_score=excluded.avg_score, completion_pct=excluded.completion_pct, attendance_count=excluded.attendance_count,
      attended_count=excluded.attended_count, attendance_pct=excluded.attendance_pct, generated_at=excluded.generated_at,
      arena_attempt_count=excluded.arena_attempt_count, arena_question_count=excluded.arena_question_count, arena_score=excluded.arena_score`, params);
  }

  list(org: string, actor: User, query: ClassQuery) {
    return this.access.run(org, actor, null, null, null,
      (manager, role) => this.access.classScope(manager, org, actor, role, query.sectionId, query.subjectId ?? null),
      async (manager, role) => {
        const params = [org, query.sectionId, query.subjectId ?? null, role === 'student' ? actor.id : null];
        const where = 'organization_id=$1 AND section_id=$2 AND subject_id IS NOT DISTINCT FROM $3::uuid AND ($4::uuid IS NULL OR student_id=$4)';
        const [count] = await manager.query(`SELECT count(*)::int AS total FROM scorecards WHERE ${where}`, params);
        const items = await manager.query(`SELECT id, organization_id AS "organizationId", student_id AS "studentId", section_id AS "sectionId",
          subject_id AS "subjectId", term, assignment_count AS "assignmentCount", submitted_count AS "submittedCount",
          graded_count AS "gradedCount", avg_score AS "avgScore", completion_pct AS "completionPct", attendance_count AS "attendanceCount",
          attended_count AS "attendedCount", attendance_pct AS "attendancePct", generated_at AS "generatedAt",
          arena_attempt_count AS "arenaAttemptCount", arena_question_count AS "arenaQuestionCount", arena_score AS "arenaScore",
          (SELECT email FROM users WHERE id = scorecards.student_id) AS "studentEmail",
          (SELECT coalesce(nullif(name, ''), split_part(email, '@', 1)) FROM users WHERE id = scorecards.student_id) AS "studentName",
          (SELECT roll_number FROM enrollments WHERE organization_id = scorecards.organization_id AND student_user_id = scorecards.student_id AND section_id = scorecards.section_id AND status = 'active' LIMIT 1) AS "rollNumber"
          FROM scorecards WHERE ${where} ORDER BY student_id LIMIT $5 OFFSET $6`, [...params, query.limit, query.offset]);
        return { items, total: count.total, limit: query.limit, offset: query.offset };
      });
  }
}
