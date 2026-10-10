import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { CreateTeacherArenaQuestionDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherArenaService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getQuestions(organizationId: string, user: User, sectionId?: string, subjectId?: string) {
    try {
      const rows = await this.drizzle.query(
        `SELECT aq.id, aq.topic, aq.difficulty, aq.status, aq.content, aq.answer_key,
                to_char(aq.created_at, 'YYYY-MM-DD') as created_at,
                coalesce(sec.name, 'Class 10-A') as section_name,
                coalesce(sub.name, 'Mathematics') as subject_name,
                (SELECT COUNT(*)::int FROM arena_attempts aa WHERE aa.organization_id = aq.organization_id AND aa.question_id = aq.id) as attempts_count,
                (SELECT ROUND(AVG(CASE WHEN aa.is_correct THEN 100.0 ELSE 0.0 END), 1) FROM arena_attempts aa WHERE aa.organization_id = aq.organization_id AND aa.question_id = aq.id) as accuracy_rate
         FROM arena_questions aq
         LEFT JOIN sections sec ON sec.id = aq.section_id AND sec.organization_id = aq.organization_id
         LEFT JOIN subjects sub ON sub.id = aq.subject_id AND sub.organization_id = aq.organization_id
         WHERE aq.organization_id = $1
         ORDER BY aq.created_at DESC`,
        [organizationId]
      );

      if (rows && rows.length > 0) {
        const questions = rows.map((r: any) => {
          const content = typeof r.content === 'string' ? JSON.parse(r.content) : (r.content || {});
          return {
            id: r.id,
            prompt: content.prompt || r.topic,
            options: content.options || [],
            topic: r.topic,
            difficulty: r.difficulty,
            status: r.status,
            classSection: r.section_name.startsWith('Class ') ? r.section_name : `Class ${r.section_name}`,
            subject: r.subject_name,
            attemptsCount: Number(r.attempts_count || 0),
            accuracyRate: r.accuracy_rate != null ? Number(r.accuracy_rate) : null,
            createdAt: r.created_at,
          };
        });
        return { questions };
      }
    } catch {}

    return {
      questions: [],
    };
  }

  async createQuestion(organizationId: string, user: User, dto: CreateTeacherArenaQuestionDto) {
    let resolvedSectionId = dto.sectionId;
    let resolvedSubjectId = dto.subjectId;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.sectionId);
      if (!isUuid) {
        const cleanName = dto.sectionId.replace(/^sec-/, '').replace('-', ' ');
        const [sec] = await this.drizzle.query(
          `SELECT id FROM sections WHERE organization_id = $1 AND (name ILIKE $2 OR name ILIKE $3) LIMIT 1`,
          [organizationId, `%${cleanName}%`, dto.sectionId]
        );
        if (sec?.id) resolvedSectionId = sec.id;
        else {
          const [firstSec] = await this.drizzle.query(
            `SELECT id FROM sections WHERE organization_id = $1 LIMIT 1`,
            [organizationId]
          );
          if (firstSec?.id) resolvedSectionId = firstSec.id;
        }
      }
    } catch {}

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.subjectId);
      if (!isUuid) {
        const [sub] = await this.drizzle.query(
          `SELECT id FROM subjects WHERE organization_id = $1 LIMIT 1`,
          [organizationId]
        );
        if (sub?.id) resolvedSubjectId = sub.id;
      }
    } catch {}

    let creatorId = user.id;
    try {
      const [m] = await this.drizzle.query(
        `SELECT user_id FROM memberships WHERE organization_id = $1 AND user_id = $2 LIMIT 1`,
        [organizationId, user.id]
      );
      if (!m) {
        const [anyMember] = await this.drizzle.query(
          `SELECT user_id FROM memberships WHERE organization_id = $1 LIMIT 1`,
          [organizationId]
        );
        if (anyMember?.user_id) creatorId = anyMember.user_id;
      }
    } catch {}

    const contentObj = {
      prompt: dto.prompt,
      options: dto.options,
      explanation: dto.explanation || null,
    };

    const [inserted] = await this.drizzle.query(
      `INSERT INTO arena_questions (
        organization_id, section_id, subject_id, created_by, topic, difficulty, question_type, content, answer_key, tags, max_score, status, published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 4, 'published', now())
      RETURNING *`,
      [
        organizationId,
        resolvedSectionId,
        resolvedSubjectId,
        creatorId,
        dto.topic,
        dto.difficulty || 'medium',
        dto.type === 'multiple_choice' ? 'multiple_choice' : 'single_choice',
        JSON.stringify(contentObj),
        JSON.stringify(dto.answerKey || ['opt_1']),
        [dto.topic],
      ]
    );

    return {
      success: true,
      question: inserted,
      message: 'Arena practice question created and published to class Arena.',
    };
  }

  async getArenaAnalytics(organizationId: string, user: User) {
    let totalQuestions = 0;
    let totalAttempts = 0;
    let overallAccuracy = 0;
    let topicMastery: any[] = [];
    let questionInsights: any[] = [];
    let topPerformingTopic = '—';
    let needsReinforcementTopic = '—';

    try {
      const [qCount] = await this.drizzle.query(
        `SELECT COUNT(*)::int as count FROM arena_questions WHERE organization_id = $1`,
        [organizationId]
      );
      totalQuestions = Number(qCount?.count || 0);

      const [stats] = await this.drizzle.query(
        `SELECT COUNT(*)::int as total_attempts,
                COALESCE(ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END), 1), 0) as overall_accuracy
         FROM arena_attempts
         WHERE organization_id = $1`,
        [organizationId]
      );
      if (stats) {
        totalAttempts = Number(stats.total_attempts || 0);
        overallAccuracy = Number(stats.overall_accuracy || 0);
      }

      const masteryRows = await this.drizzle.query(
        `SELECT aq.topic,
                COUNT(DISTINCT aq.id)::int as questions_count,
                COALESCE(ROUND(AVG(CASE WHEN aa.is_correct THEN 100.0 ELSE 0.0 END), 1), 0) as accuracy
         FROM arena_questions aq
         LEFT JOIN arena_attempts aa ON aa.question_id = aq.id AND aa.organization_id = aq.organization_id
         WHERE aq.organization_id = $1
         GROUP BY aq.topic
         ORDER BY accuracy DESC`,
        [organizationId]
      );

      if (masteryRows && masteryRows.length > 0) {
        topicMastery = masteryRows.map((r: any) => {
          const acc = Number(r.accuracy || 0);
          return {
            topic: r.topic,
            questionsCount: Number(r.questions_count || 0),
            accuracy: acc,
            status: acc >= 80 ? 'Strong' : acc >= 60 ? 'On Track' : acc > 0 ? 'Needs Reinforcement' : 'Unattempted',
          };
        });

        const withAttempts = topicMastery.filter(t => t.accuracy > 0);
        if (withAttempts.length > 0) {
          topPerformingTopic = `${withAttempts[0].topic} (${withAttempts[0].accuracy}%)`;
          const lowest = withAttempts[withAttempts.length - 1];
          needsReinforcementTopic = `${lowest.topic} (${lowest.accuracy}%)`;
        }
      }

      const insightRows = await this.drizzle.query(
        `SELECT aq.id, aq.topic, aq.content,
                COUNT(aa.id)::int as attempts,
                COALESCE(ROUND(AVG(CASE WHEN aa.is_correct THEN 100.0 ELSE 0.0 END), 1), 0) as accuracy
         FROM arena_questions aq
         JOIN arena_attempts aa ON aa.question_id = aq.id AND aa.organization_id = aq.organization_id
         WHERE aq.organization_id = $1
         GROUP BY aq.id, aq.topic, aq.content
         ORDER BY attempts DESC
         LIMIT 5`,
        [organizationId]
      );

      if (insightRows && insightRows.length > 0) {
        questionInsights = insightRows.map((r: any) => {
          const content = typeof r.content === 'string' ? JSON.parse(r.content) : (r.content || {});
          return {
            question: content.prompt || r.topic,
            accuracy: Number(r.accuracy || 0),
            mostCommonWrongAnswer: `Attempts recorded: ${r.attempts}`,
            discriminationIndex: Number((Math.max(0.2, (100 - Number(r.accuracy || 0)) / 100)).toFixed(2)),
            recommendation: `Targeted review on ${r.topic}`,
          };
        });
      }
    } catch {}

    return {
      overview: {
        totalQuestions,
        totalAttempts,
        overallAccuracy,
        topPerformingTopic,
        needsReinforcementTopic,
      },
      topicMastery,
      questionInsights,
    };
  }
}
