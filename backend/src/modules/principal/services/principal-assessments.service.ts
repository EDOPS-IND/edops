import { DrizzleService } from "../../../database/drizzle.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { User } from "../../auth/user.entity";
import {
  CreateExamPlanDto,
  CreateExamPlansDto,
  CreateQuestionPaperDto,
  PublishExamResultsDto,
  ReviewExamResultDto,
  ReviewQuestionPaperDto,
  UpdateExamPlanDto,
} from "../dto/principal.dto";

@Injectable()
export class PrincipalAssessmentsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getAssessmentsOverview(orgId: string, _actor: User) {
    const manager = this.drizzle;

    // 1. Fetch real question papers with camelCase aliases
    const questionPapers = await manager.query(
      `SELECT id, title, subject_name AS "subjectName", grade, term,
              total_marks AS "totalMarks", duration_minutes AS "durationMinutes",
              difficulty_easy_pct AS "difficultyEasyPct", difficulty_medium_pct AS "difficultyMediumPct",
              difficulty_hard_pct AS "difficultyHardPct", competency_mapped AS "competencyMapped",
              submitted_by_name AS "submittedByName", status, review_comments AS "reviewComments",
              created_at AS "createdAt"
       FROM principal_question_papers
       WHERE organization_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [orgId],
    );

    // 2. Fetch evaluation records from teacher exam_evaluations
    const evaluations = await manager.query(
      `SELECT ee.id, ee.title, ee.max_marks AS "maxMarks", ee.weightage, ee.student_scores AS "studentScores",
              to_char(ee.created_at, 'YYYY-MM-DD') AS "date",
              coalesce(sec.name, 'Class 10-A') AS "sectionName",
              coalesce(sub.name, 'Mathematics') AS "subjectName"
       FROM exam_evaluations ee
       LEFT JOIN sections sec ON sec.id = ee.section_id AND sec.organization_id = ee.organization_id
       LEFT JOIN subjects sub ON sub.id = ee.subject_id AND sub.organization_id = ee.organization_id
       WHERE ee.organization_id = $1
       ORDER BY ee.created_at DESC LIMIT 20`,
      [orgId],
    );

    // 3. Query teacher list for question paper assignment/setter selector
    const teachers = await manager.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       JOIN memberships m ON m.user_id = u.id
       WHERE m.organization_id = $1 AND m.role IN ('teacher', 'school_admin', 'principal') AND m.status = 'active'
       ORDER BY u.name ASC`,
      [orgId],
    );

    // 4. Query subjects for question paper registration
    const subjects = await manager.query(
      `SELECT id, name, code FROM subjects WHERE organization_id = $1 ORDER BY name ASC`,
      [orgId],
    );

    // 5. Query counts to dynamically power the 4 assessment KPI cards
    const [asgStats] = await manager.query(
      `SELECT count(*)::int AS "count" FROM assignments WHERE organization_id = $1`,
      [orgId],
    );

    const [examStats] = await manager.query(
      `SELECT count(*)::int AS "count" FROM principal_exam_results WHERE organization_id = $1`,
      [orgId],
    );

    const totalPapers = questionPapers.length;
    const formativeTestsCount = evaluations.length;
    const subjectEnrichmentCount = asgStats?.count || 0;
    const summativeCount = examStats?.count || 0;
    const competencyPapers = questionPapers.filter(
      (p: any) => p.competencyMapped,
    ).length;
    const competencyPct =
      totalPapers > 0 ? Math.round((competencyPapers / totalPapers) * 100) : 0;

    const assessmentTypes = [
      {
        type: "Formative (Periodic)",
        weight: "20%",
        compliance: null,
        status:
          formativeTestsCount > 0
            ? `${formativeTestsCount} Tests Recorded`
            : "No records",
      },
      {
        type: "Subject Enrichment",
        weight: "20%",
        compliance: null,
        status:
          subjectEnrichmentCount > 0
            ? `${subjectEnrichmentCount} Activities Active`
            : "No records",
      },
      {
        type: "Summative (Term End)",
        weight: "60%",
        compliance: null,
        status:
          totalPapers > 0 ? `${totalPapers} Papers Registered` : "No records",
      },
      {
        type: "Competency Items (CBE)",
        weight: "50% min",
        compliance: `${competencyPct}%`,
        status: competencyPct >= 50 ? "Compliant" : "Needs Review",
      },
    ];

    return {
      summary: {
        totalPapersReviewed: totalPapers,
        pendingReview: questionPapers.filter(
          (p: any) => p.status === "Submitted" || p.status === "Under Review",
        ).length,
        approvedPapers: questionPapers.filter(
          (p: any) => p.status === "Approved",
        ).length,
        publishedPapers: questionPapers.filter(
          (p: any) => p.status === "Published",
        ).length,
      },
      assessmentTypes,
      questionPapers,
      evaluations,
      teachers: teachers.map((t: any) => ({
        id: t.id,
        name: t.name || t.email,
      })),
      subjects: subjects.map((s: any) => ({
        id: s.id,
        name: s.name,
        code: s.code,
      })),
    };
  }

  async createQuestionPaper(
    orgId: string,
    actor: User,
    dto: CreateQuestionPaperDto,
  ) {
    const manager = this.drizzle;
    const [row] = await manager.query(
      `INSERT INTO principal_question_papers (
        organization_id, title, subject_name, grade, term, total_marks, duration_minutes,
        difficulty_easy_pct, difficulty_medium_pct, difficulty_hard_pct, competency_mapped,
        submitted_by_name, submitted_by_user_id, status, review_comments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, title, subject_name AS "subjectName", grade, term, total_marks AS "totalMarks",
                duration_minutes AS "durationMinutes", difficulty_easy_pct AS "difficultyEasyPct",
                difficulty_medium_pct AS "difficultyMediumPct", difficulty_hard_pct AS "difficultyHardPct",
                competency_mapped AS "competencyMapped", submitted_by_name AS "submittedByName",
                status, review_comments AS "reviewComments", created_at AS "createdAt"`,
      [
        orgId,
        dto.title,
        dto.subjectName,
        dto.grade,
        dto.term || "Term 1 Midterm",
        dto.totalMarks || 80,
        dto.durationMinutes || 180,
        dto.difficultyEasyPct ?? 30,
        dto.difficultyMediumPct ?? 50,
        dto.difficultyHardPct ?? 20,
        dto.competencyMapped ?? true,
        dto.submittedByName || actor.name || actor.email || "Teacher",
        dto.submittedByUserId || actor.id,
        dto.status || "Under Review",
        dto.reviewComments || "",
      ],
    );
    return row;
  }

  async reviewQuestionPaper(
    orgId: string,
    actor: User,
    paperId: string,
    dto: ReviewQuestionPaperDto,
  ) {
    const manager = this.drizzle;
    const [row] = await manager.query(
      `UPDATE principal_question_papers
       SET status = $1, review_comments = $2, approved_by = $3, approved_at = now()
       WHERE id = $4 AND organization_id = $5
       RETURNING id, title, subject_name AS "subjectName", status, review_comments AS "reviewComments"`,
      [dto.status, dto.reviewComments || "", actor.id, paperId, orgId],
    );
    return { success: true, paperId, status: dto.status, paper: row };
  }

  async getExaminationsOverview(orgId: string, _actor: User) {
    const [plans, evaluations, results, sections, subjects] = await Promise.all(
      [
        this.drizzle.query(
          `SELECT p.id, p.section_id AS "sectionId", p.subject_id AS "subjectId",
        p.exam_name AS "examName", p.term, TO_CHAR(p.exam_date, 'YYYY-MM-DD') AS "examDate",
        TO_CHAR(p.start_time, 'HH24:MI') AS "startTime", TO_CHAR(p.end_time, 'HH24:MI') AS "endTime",
        p.max_marks AS "maxMarks", p.passing_marks AS "passingMarks", p.status, prog.name AS "className", sec.name AS "sectionName",
        subj.name AS "subjectName" FROM principal_exam_plans p
        JOIN sections sec ON sec.id = p.section_id AND sec.organization_id = p.organization_id
        JOIN academic_years y ON y.id = sec.academic_year_id AND y.organization_id = p.organization_id AND y.is_current = true
        JOIN programs prog ON prog.id = sec.program_id AND prog.organization_id = p.organization_id
        JOIN subjects subj ON subj.id = p.subject_id AND subj.organization_id = p.organization_id
        WHERE p.organization_id = $1 ORDER BY p.exam_date, p.start_time`,
          [orgId],
        ),
        this.drizzle.query(
          `SELECT e.id, e.title, e.max_marks AS "maxMarks",
        prog.name AS "className", sec.name AS "sectionName", subj.name AS "subjectName",
        (SELECT COUNT(*)::int FROM jsonb_object_keys(e.student_scores)) AS "enteredStudents"
        FROM exam_evaluations e JOIN sections sec ON sec.id = e.section_id AND sec.organization_id = e.organization_id
        JOIN academic_years y ON y.id = sec.academic_year_id AND y.organization_id = e.organization_id AND y.is_current = true
        JOIN programs prog ON prog.id = sec.program_id AND prog.organization_id = e.organization_id
        JOIN subjects subj ON subj.id = e.subject_id AND subj.organization_id = e.organization_id
        WHERE e.organization_id = $1 ORDER BY e.created_at DESC`,
          [orgId],
        ),
        this.drizzle.query(
          `SELECT id, student_user_id AS "studentUserId", exam_name AS "examName", term,
        class_name AS "className", section_name AS "sectionName", subject_name AS "subjectName",
        student_name AS "studentName", marks_obtained AS "marksObtained", max_marks AS "maxMarks",
        percentage, NULLIF(grade, '') AS grade, status, is_locked AS "isLocked",
        published_at AS "publishedAt" FROM principal_exam_results
        WHERE organization_id = $1 ORDER BY exam_name, class_name, section_name, student_name, subject_name`,
          [orgId],
        ),
        this.drizzle.query(
          `SELECT sec.id, sec.name, prog.name AS "programName",
             COALESCE(json_agg(json_build_object('id',sub.id,'name',sub.name,'code',sub.code) ORDER BY sub.name)
               FILTER (WHERE sub.id IS NOT NULL), '[]'::json) AS subjects
          FROM sections sec
        JOIN academic_years y ON y.id = sec.academic_year_id AND y.organization_id = sec.organization_id AND y.is_current = true
        JOIN programs prog ON prog.id = sec.program_id AND prog.organization_id = sec.organization_id
        LEFT JOIN class_subject_assignments csa ON csa.organization_id = sec.organization_id AND csa.section_id = sec.id
        LEFT JOIN subjects sub ON sub.organization_id = sec.organization_id AND sub.id = csa.subject_id
        WHERE sec.organization_id = $1
        GROUP BY sec.id, sec.name, prog.name
        ORDER BY prog.name, sec.name`,
          [orgId],
        ),
        this.drizzle.query(
          `SELECT id, name FROM subjects WHERE organization_id = $1 ORDER BY name`,
          [orgId],
        ),
      ],
    );
    const reportCards = new Map<
      string,
      {
        studentUserId: string;
        studentName: string;
        examName: string;
        term: string;
        className: string;
        sectionName: string;
        subjects: any[];
      }
    >();
    for (const row of results) {
      if (row.status !== "Published" || !row.isLocked) continue;
      const key = JSON.stringify([
        row.examName,
        row.term,
        row.studentUserId,
        row.className,
        row.sectionName,
      ]);
      const card = reportCards.get(key) ?? {
        studentUserId: row.studentUserId,
        studentName: row.studentName,
        examName: row.examName,
        term: row.term,
        className: row.className,
        sectionName: row.sectionName,
        subjects: [] as any[],
      };
      card.subjects.push({
        subjectName: row.subjectName,
        marksObtained: row.marksObtained,
        maxMarks: row.maxMarks,
        percentage: row.percentage,
        grade: row.grade,
      });
      reportCards.set(key, card);
    }
    return {
      plans,
      evaluations,
      results,
      sections,
      subjects,
      reportCards: [...reportCards.values()],
      workflow: {
        entered: results.filter((r) => r.status === "Entered").length,
        verified: results.filter((r) => r.status === "Verified").length,
        approved: results.filter((r) => r.status === "Approved").length,
        published: results.filter((r) => r.status === "Published" && r.isLocked)
          .length,
      },
    };
  }

  createExamPlan(orgId: string, actor: User, dto: CreateExamPlanDto) {
    return this.saveExamPlan(orgId, actor.id, null, dto);
  }

  async createExamPlans(orgId: string, actor: User, dto: CreateExamPlansDto) {
    return this.drizzle.transaction(async (manager) => {
      await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [orgId]);
      const saved: any[] = [];
      for (const plan of dto.plans) {
        if (plan.startTime >= plan.endTime || Number(plan.passingMarks) > Number(plan.maxMarks)) {
          throw new BadRequestException("Each subject needs a valid time range and passing marks no higher than maximum marks");
        }
        const [valid] = await manager.query(
          `SELECT 1 FROM sections sec
           JOIN academic_years y ON y.id=sec.academic_year_id AND y.organization_id=sec.organization_id AND y.is_current=true
           JOIN class_subject_assignments csa ON csa.organization_id=sec.organization_id AND csa.section_id=sec.id AND csa.subject_id=$3
           WHERE sec.organization_id=$1 AND sec.id=$2 AND $4::date BETWEEN y.start_date AND y.end_date`,
          [orgId, plan.sectionId, plan.subjectId, dto.examDate],
        );
        if (!valid) throw new BadRequestException("Select an enrolled subject for a current-year section");
        const [clash] = await manager.query(
          `SELECT id FROM principal_exam_plans WHERE organization_id=$1 AND section_id=$2 AND exam_date=$3::date
           AND start_time < $5 AND end_time > $4 AND exam_name <> $6 LIMIT 1`,
          [orgId, plan.sectionId, dto.examDate, plan.startTime, plan.endTime, dto.examName],
        );
        if (clash) throw new ConflictException("This class already has an exam during that time");
        const [duplicate] = await manager.query(
          `SELECT id FROM principal_exam_plans WHERE organization_id=$1 AND section_id=$2 AND subject_id=$3
           AND exam_name=$4 AND exam_date=$5::date LIMIT 1`,
          [orgId, plan.sectionId, plan.subjectId, dto.examName, dto.examDate],
        );
        if (duplicate) throw new ConflictException("This exam is already planned for one of the selected subjects");
        const [row] = await manager.query(
          `INSERT INTO principal_exam_plans
           (organization_id,section_id,subject_id,exam_name,term,exam_date,start_time,end_time,max_marks,passing_marks,status,created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
          [orgId, plan.sectionId, plan.subjectId, dto.examName, dto.term, dto.examDate,
            plan.startTime, plan.endTime, plan.maxMarks, plan.passingMarks, dto.status, actor.id],
        );
        saved.push(row);
      }
      return { success: true, count: saved.length, plans: saved };
    });
  }

  updateExamPlan(orgId: string, id: string, dto: UpdateExamPlanDto) {
    return this.saveExamPlan(orgId, null, id, dto);
  }

  private async saveExamPlan(
    orgId: string,
    actorId: string | null,
    id: string | null,
    dto: UpdateExamPlanDto,
  ) {
    return this.drizzle.transaction(async (manager) => {
      // ponytail: a school-wide transaction lock keeps the overlap check atomic; split by class if write volume grows.
      await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        orgId,
      ]);
      const [previous] = id
        ? await manager.query(
            `SELECT *, TO_CHAR(exam_date, 'YYYY-MM-DD') AS "examDate"
        FROM principal_exam_plans WHERE organization_id = $1 AND id = $2`,
            [orgId, id],
          )
        : [];
      if (id && !previous) throw new NotFoundException("Exam plan not found");
      if (previous) {
        const [published] = await manager.query(
          `SELECT 1 FROM principal_exam_results r
          JOIN sections s ON s.id = $2 AND s.organization_id = $1
          JOIN programs p ON p.id = s.program_id AND p.organization_id = $1
          WHERE r.organization_id = $1 AND r.exam_name = $3 AND r.class_name = p.name
            AND r.section_name = s.name AND r.term = $4 AND r.status = 'Published' LIMIT 1`,
          [orgId, previous.section_id, previous.exam_name, previous.term],
        );
        if (published)
          throw new ConflictException("Published exam plans cannot be changed");
      }
      const value = {
        sectionId: dto.sectionId ?? previous?.section_id,
        subjectId: dto.subjectId ?? previous?.subject_id,
        examName: dto.examName ?? previous?.exam_name,
        term: dto.term ?? previous?.term,
        examDate: dto.examDate ?? previous?.examDate,
        startTime: dto.startTime ?? previous?.start_time,
        endTime: dto.endTime ?? previous?.end_time,
        maxMarks: dto.maxMarks ?? previous?.max_marks,
        passingMarks: dto.passingMarks ?? previous?.passing_marks,
        status: dto.status ?? previous?.status,
      };
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value.examDate || "") ||
        !value.startTime ||
        !value.endTime ||
        value.startTime >= value.endTime
      )
        throw new BadRequestException(
          "Choose a valid exam date and time range",
        );
      if (Number(value.passingMarks) <= 0 || Number(value.passingMarks) > Number(value.maxMarks))
        throw new BadRequestException("Passing marks must be greater than 0 and no more than maximum marks");
      const [valid] = await manager.query(
        `SELECT 1 FROM sections sec
        JOIN academic_years y ON y.id = sec.academic_year_id AND y.organization_id = sec.organization_id AND y.is_current = true
        JOIN subjects subj ON subj.id = $3 AND subj.organization_id = sec.organization_id
        WHERE sec.organization_id = $1 AND sec.id = $2 AND $4::date BETWEEN y.start_date AND y.end_date`,
        [orgId, value.sectionId, value.subjectId, value.examDate],
      );
      if (!valid)
        throw new BadRequestException(
          "Choose a current-year class, school subject, and date within the academic year",
        );
      const [clash] = await manager.query(
        `SELECT id FROM principal_exam_plans WHERE organization_id = $1
        AND section_id = $2 AND exam_date = $3::date AND start_time < $5 AND end_time > $4
        AND ($6::uuid IS NULL OR id <> $6::uuid) LIMIT 1`,
        [
          orgId,
          value.sectionId,
          value.examDate,
          value.startTime,
          value.endTime,
          id,
        ],
      );
      if (clash)
        throw new ConflictException(
          "This class already has an exam during that time",
        );
      const [duplicate] = await manager.query(
        `SELECT id FROM principal_exam_plans WHERE organization_id = $1
        AND section_id = $2 AND subject_id = $3 AND exam_name = $4 AND exam_date = $5::date
        AND ($6::uuid IS NULL OR id <> $6::uuid) LIMIT 1`,
        [
          orgId,
          value.sectionId,
          value.subjectId,
          value.examName,
          value.examDate,
          id,
        ],
      );
      if (duplicate)
        throw new ConflictException(
          "This exam is already planned for the class and date",
        );
      const params = [
        orgId,
        value.sectionId,
        value.subjectId,
        value.examName,
        value.term,
        value.examDate,
        value.startTime,
        value.endTime,
        value.maxMarks,
        value.passingMarks,
        value.status,
      ];
      const [saved] = id
        ? await manager.query(
            `UPDATE principal_exam_plans SET section_id = $2, subject_id = $3,
        exam_name = $4, term = $5, exam_date = $6, start_time = $7, end_time = $8,
        max_marks = $9, passing_marks = $10, status = $11 WHERE organization_id = $1 AND id = $12 RETURNING id`,
            [...params, id],
          )
        : await manager.query(
            `INSERT INTO principal_exam_plans
        (organization_id, section_id, subject_id, exam_name, term, exam_date, start_time, end_time, max_marks, passing_marks, status, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [...params, actorId],
          );
      return saved;
    });
  }

  async importTeacherMarks(orgId: string, evaluationId: string) {
    return this.drizzle.transaction(async (manager) => {
      const [evaluation] = await manager.query(
        `SELECT e.title, e.max_marks AS "maxMarks", e.student_scores AS "studentScores",
        p.name AS "className", sec.name AS "sectionName", subj.name AS "subjectName",
        COALESCE(plan.term, y.name) AS term,
        sec.id AS "sectionId", y.id AS "yearId"
        FROM exam_evaluations e JOIN sections sec ON sec.id = e.section_id AND sec.organization_id = e.organization_id
        JOIN academic_years y ON y.id = sec.academic_year_id AND y.organization_id = e.organization_id AND y.is_current = true
        JOIN programs p ON p.id = sec.program_id AND p.organization_id = e.organization_id
        JOIN subjects subj ON subj.id = e.subject_id AND subj.organization_id = e.organization_id
        LEFT JOIN LATERAL (SELECT ep.term FROM principal_exam_plans ep WHERE ep.organization_id = e.organization_id
          AND ep.section_id = e.section_id AND ep.subject_id = e.subject_id AND ep.exam_name = e.title
          ORDER BY ep.exam_date DESC LIMIT 1) plan ON true
        WHERE e.organization_id = $1 AND e.id = $2`,
        [orgId, evaluationId],
      );
      if (!evaluation)
        throw new NotFoundException("Teacher evaluation not found");
      if (Number(evaluation.maxMarks) > 999.99)
        throw new BadRequestException(
          "Maximum marks exceed the result ledger limit",
        );
      const students = await manager.query(
        `SELECT e.student_user_id AS id, COALESCE(u.name, u.email) AS name
        FROM enrollments e JOIN users u ON u.id = e.student_user_id
        WHERE e.organization_id = $1 AND e.section_id = $2 AND e.academic_year_id = $3 AND e.status = 'active'`,
        [orgId, evaluation.sectionId, evaluation.yearId],
      );
      let imported = 0;
      for (const student of students) {
        const raw = evaluation.studentScores?.[student.id];
        if (raw === undefined) continue;
        const score = Number(raw);
        if (
          !Number.isFinite(score) ||
          score < 0 ||
          score > Number(evaluation.maxMarks)
        )
          throw new BadRequestException(
            "Teacher evaluation contains an invalid score",
          );
        const [saved] = await manager.query(
          `INSERT INTO principal_exam_results
          (organization_id, exam_name, term, class_name, section_name, subject_name, student_user_id,
            student_name, marks_obtained, max_marks, percentage, grade, status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,ROUND(100 * $9::numeric / $10::numeric, 2),'','Entered')
          ON CONFLICT (organization_id, term, exam_name, class_name, section_name, subject_name, student_user_id)
          DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, max_marks = EXCLUDED.max_marks,
            percentage = EXCLUDED.percentage
          WHERE principal_exam_results.status = 'Entered' AND principal_exam_results.is_locked = false
          RETURNING id`,
          [
            orgId,
            evaluation.title,
            evaluation.term,
            evaluation.className,
            evaluation.sectionName,
            evaluation.subjectName,
            student.id,
            student.name,
            score,
            evaluation.maxMarks,
          ],
        );
        if (saved) imported++;
      }
      if (!imported)
        throw new ConflictException(
          "No editable student scores were found in this evaluation",
        );
      return { imported };
    });
  }

  async reviewExamResult(orgId: string, id: string, dto: ReviewExamResultDto) {
    if (
      dto.marksObtained === undefined &&
      dto.grade === undefined &&
      dto.status === undefined
    )
      throw new BadRequestException("No result change supplied");
    return this.drizzle.transaction(async (manager) => {
      const [row] = await manager.query(
        `SELECT * FROM principal_exam_results WHERE organization_id = $1 AND id = $2 FOR UPDATE`,
        [orgId, id],
      );
      if (!row) throw new NotFoundException("Result not found");
      if (row.is_locked || row.status === "Published")
        throw new ConflictException("Published results are locked");
      if (
        (dto.marksObtained !== undefined || dto.grade !== undefined) &&
        row.status === "Approved"
      )
        throw new ConflictException(
          "Approved marks and grades cannot be changed; review before approval",
        );
      if (
        dto.marksObtained !== undefined &&
        dto.marksObtained > Number(row.max_marks)
      )
        throw new BadRequestException("Marks cannot exceed maximum marks");
      if (
        dto.status &&
        !(
          (row.status === "Entered" && dto.status === "Verified") ||
          (row.status === "Verified" && dto.status === "Approved")
        )
      )
        throw new ConflictException(
          "Verify entered marks, then approve verified marks",
        );
      const marks = dto.marksObtained ?? Number(row.marks_obtained);
      const [saved] = await manager.query(
        `UPDATE principal_exam_results SET marks_obtained = $3,
        percentage = ROUND(100 * $3::numeric / max_marks, 2), status = COALESCE($4, status),
        grade = COALESCE($5, grade)
        WHERE organization_id = $1 AND id = $2 RETURNING id, status, marks_obtained AS "marksObtained", percentage, grade`,
        [orgId, id, marks, dto.status || null, dto.grade ?? null],
      );
      return saved;
    });
  }

  async publishResults(orgId: string, actor: User, dto: PublishExamResultsDto) {
    return this.drizzle.transaction(async (manager) => {
      const rows = await manager.query(
        `SELECT id, status, is_locked FROM principal_exam_results
        WHERE organization_id = $1 AND term = $2 AND exam_name = $3 AND class_name = $4 AND section_name = $5 FOR UPDATE`,
        [orgId, dto.term, dto.examName, dto.className, dto.sectionName],
      );
      if (!rows.length)
        throw new NotFoundException(
          "No saved results match this exam and class",
        );
      if (rows.some((row: any) => row.status !== "Approved" || row.is_locked))
        throw new ConflictException(
          "Verify and approve every result before publishing",
        );
      const published = await manager.query(
        `UPDATE principal_exam_results SET status = 'Published', is_locked = true,
        published_by = $6, published_at = now() WHERE organization_id = $1 AND term = $2 AND exam_name = $3
        AND class_name = $4 AND section_name = $5 AND status = 'Approved' AND is_locked = false RETURNING id`,
        [
          orgId,
          dto.term,
          dto.examName,
          dto.className,
          dto.sectionName,
          actor.id,
        ],
      );
      if (published.length !== rows.length)
        throw new ConflictException(
          "Result set changed; reload and review again",
        );
      return { published: published.length };
    });
  }
}
