import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DrizzleService } from "../../../database/drizzle.service";
import { User } from "../../auth/user.entity";
import {
  AssignTeacherDevelopmentDto,
  RecordTeacherObservationDto,
} from "../dto/principal.dto";

@Injectable()
export class PrincipalTeachersService {
  constructor(private readonly drizzle: DrizzleService) {}

  private async activeTeacher(orgId: string, teacherId: string) {
    const [row] = await this.drizzle.query(
      `SELECT u.id FROM memberships m JOIN users u ON u.id = m.user_id
       WHERE m.organization_id = $1 AND m.user_id = $2 AND m.role = 'teacher'
         AND m.status = 'active' AND u.is_active = true`,
      [orgId, teacherId],
    );
    if (!row)
      throw new NotFoundException("Active teacher not found in this school");
  }

  async getTeachersOverview(orgId: string, _actor: User) {
    const [
      teachers,
      assignments,
      departments,
      coordinators,
      developments,
      sections,
      subjects,
      periods,
      plans,
      observations,
    ] = await Promise.all([
      this.drizzle.query(
        `SELECT u.id, u.name, u.email, m.specialty AS department, m.created_at AS "memberSince"
         FROM memberships m JOIN users u ON u.id = m.user_id
         WHERE m.organization_id = $1 AND m.role = 'teacher' AND m.status = 'active' AND u.is_active = true
         ORDER BY u.name, u.email`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT csa.id, csa.teacher_user_id AS "teacherUserId", COALESCE(NULLIF(u.name, ''), u.email) AS "teacherName",
                csa.section_id AS "sectionId", csa.subject_id AS "subjectId",
                p.name || ' - ' || sec.name AS "className", sub.name AS "subjectName"
         FROM class_subject_assignments csa
         JOIN memberships m ON m.organization_id = csa.organization_id AND m.user_id = csa.teacher_user_id AND m.role = 'teacher' AND m.status = 'active'
         JOIN users u ON u.id = csa.teacher_user_id AND u.is_active = true
         JOIN sections sec ON sec.id = csa.section_id AND sec.organization_id = csa.organization_id
         JOIN programs p ON p.id = sec.program_id AND p.organization_id = csa.organization_id
         JOIN subjects sub ON sub.id = csa.subject_id AND sub.organization_id = csa.organization_id
         WHERE csa.organization_id = $1 ORDER BY p.sequence_order, sec.name, sub.name`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT d.id, d.name, d.code, u.id AS "headTeacherId", COALESCE(NULLIF(u.name, ''), u.email) AS "headName"
         FROM school_departments d
         LEFT JOIN memberships m ON m.organization_id = d.organization_id AND m.user_id = d.head_teacher_id AND m.role = 'teacher' AND m.status = 'active'
         LEFT JOIN users u ON u.id = m.user_id AND u.is_active = true
         WHERE d.organization_id = $1 ORDER BY d.name`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT c.id, c.teacher_user_id AS "teacherUserId", COALESCE(NULLIF(u.name, ''), u.email) AS "teacherName",
                d.id AS "departmentId", d.name AS "departmentName", c.created_at AS "assignedAt"
         FROM principal_academic_coordinators c
         JOIN school_departments d ON d.id = c.department_id AND d.organization_id = c.organization_id
         JOIN memberships m ON m.organization_id = c.organization_id AND m.user_id = c.teacher_user_id AND m.role = 'teacher' AND m.status = 'active'
         JOIN users u ON u.id = c.teacher_user_id AND u.is_active = true
         WHERE c.organization_id = $1 ORDER BY d.name, u.name`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT d.id, d.teacher_user_id AS "teacherUserId", COALESCE(NULLIF(u.name, ''), u.email) AS "teacherName", d.title,
                d.category, d.provider, d.training_hours AS "trainingHours", d.status,
                d.completed_at AS "completedAt", d.notes, d.created_at AS "createdAt"
         FROM principal_teacher_developments d
         JOIN users u ON u.id = d.teacher_user_id
         WHERE d.organization_id = $1 ORDER BY d.created_at DESC`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT sec.id, p.name || ' - ' || sec.name AS name
         FROM sections sec JOIN programs p ON p.id = sec.program_id AND p.organization_id = sec.organization_id
         WHERE sec.organization_id = $1 ORDER BY p.sequence_order, sec.name`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT id, name FROM subjects WHERE organization_id = $1 ORDER BY name`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT teacher_user_id AS "teacherUserId", COUNT(*)::int AS count FROM (
           SELECT t.teacher_user_id FROM timetable_entries t
           JOIN academic_years y ON y.id = t.academic_year_id AND y.organization_id = t.organization_id AND y.is_current = true
           WHERE t.organization_id = $1
           UNION ALL
           SELECT teacher_user_id FROM teacher_timetable_slots
           WHERE organization_id = $1 AND NOT EXISTS (
             SELECT 1 FROM timetable_entries t JOIN academic_years y ON y.id = t.academic_year_id AND y.is_current = true
             WHERE t.organization_id = $1)
         ) slots GROUP BY teacher_user_id`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT teacher_user_id AS "teacherUserId", COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status IN ('Approved', 'Completed'))::int AS completed
         FROM principal_lesson_plans WHERE organization_id = $1 GROUP BY teacher_user_id`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT teacher_user_id AS "teacherUserId", COUNT(*)::int AS count
         FROM principal_teacher_observations WHERE organization_id = $1 GROUP BY teacher_user_id`,
        [orgId],
      ),
    ]);

    const teacherList = teachers.map((teacher: any) => {
      const ownAssignments = assignments.filter(
        (a: any) => a.teacherUserId === teacher.id,
      );
      const plan = plans.find((p: any) => p.teacherUserId === teacher.id);
      return {
        ...teacher,
        classes: [...new Set(ownAssignments.map((a: any) => a.className))],
        subjects: [...new Set(ownAssignments.map((a: any) => a.subjectName))],
        weeklyPeriods: Number(
          periods.find((p: any) => p.teacherUserId === teacher.id)?.count ?? 0,
        ),
        lessonPlanCompliance: plan?.total
          ? Math.round((100 * plan.completed) / plan.total)
          : null,
        observationsCount: Number(
          observations.find((o: any) => o.teacherUserId === teacher.id)
            ?.count ?? 0,
        ),
        developmentHours: developments
          .filter(
            (d: any) =>
              d.teacherUserId === teacher.id && d.status === "Completed",
          )
          .reduce((sum: number, d: any) => sum + Number(d.trainingHours), 0),
      };
    });

    return {
      teachers: teacherList,
      assignments,
      departments,
      coordinators,
      developments,
      sections,
      subjects,
    };
  }

  async getTeacherAcademicProfile(
    orgId: string,
    actor: User,
    teacherId: string,
  ) {
    const data = await this.getTeachersOverview(orgId, actor);
    const teacher = data.teachers.find((item: any) => item.id === teacherId);
    if (!teacher)
      throw new NotFoundException("Active teacher not found in this school");
    const [observations, classes] = await Promise.all([
      this.drizzle.query(
        `SELECT id, observation_date AS "observationDate", observer_name AS "observerName",
                observation_type AS "observationType", lesson_topic AS "lessonTopic",
                overall_rating AS "overallRating", strengths,
                areas_for_improvement AS "areasForImprovement", action_items AS "actionItems", status
         FROM principal_teacher_observations WHERE organization_id = $1 AND teacher_user_id = $2
         ORDER BY observation_date DESC`,
        [orgId, teacherId],
      ),
      this.drizzle.query(
        `SELECT csa.id, sec.id AS "sectionId", p.name || ' - ' || sec.name AS "className", sub.name AS subject,
                COUNT(DISTINCT e.student_user_id)::int AS "studentCount"
         FROM class_subject_assignments csa
         JOIN sections sec ON sec.id = csa.section_id AND sec.organization_id = csa.organization_id
         JOIN programs p ON p.id = sec.program_id AND p.organization_id = csa.organization_id
         JOIN subjects sub ON sub.id = csa.subject_id AND sub.organization_id = csa.organization_id
         LEFT JOIN enrollments e ON e.section_id = sec.id AND e.organization_id = csa.organization_id AND e.status = 'active'
         WHERE csa.organization_id = $1 AND csa.teacher_user_id = $2
         GROUP BY csa.id, sec.id, p.name, sec.name, sub.name ORDER BY p.name, sec.name`,
        [orgId, teacherId],
      ),
    ]);
    return {
      overview: {
        id: teacher.id,
        name: teacher.name || teacher.email,
        email: teacher.email,
        department: teacher.department,
        memberSince: teacher.memberSince,
      },
      workload: {
        weeklyPeriods: teacher.weeklyPeriods,
        classesTaught: teacher.classes.length,
        studentCount: classes
          .filter(
            (item: any, index: number) =>
              classes.findIndex(
                (other: any) => other.sectionId === item.sectionId,
              ) === index,
          )
          .reduce((sum: number, item: any) => sum + item.studentCount, 0),
      },
      metrics: {
        lessonPlanCompliance: teacher.lessonPlanCompliance,
        professionalDevelopmentHours: teacher.developmentHours,
      },
      classes,
      observations,
      developments: data.developments.filter(
        (item: any) => item.teacherUserId === teacherId,
      ),
    };
  }

  async recordObservation(
    orgId: string,
    actor: User,
    dto: RecordTeacherObservationDto,
  ) {
    await this.activeTeacher(orgId, dto.teacherUserId);
    const [assignment] = await this.drizzle.query(
      `SELECT 1 FROM class_subject_assignments csa
       JOIN sections sec ON sec.id = csa.section_id AND sec.organization_id = csa.organization_id
       JOIN programs p ON p.id = sec.program_id AND p.organization_id = csa.organization_id
       JOIN subjects sub ON sub.id = csa.subject_id AND sub.organization_id = csa.organization_id
       WHERE csa.organization_id = $1 AND csa.teacher_user_id = $2
         AND p.name || ' - ' || sec.name = $3 AND sub.name = $4`,
      [orgId, dto.teacherUserId, dto.className, dto.subjectName],
    );
    if (!assignment)
      throw new BadRequestException(
        "Choose a class and subject assigned to this teacher",
      );
    const scores = [
      dto.planningScore,
      dto.pedagogyScore,
      dto.engagementScore,
      dto.differentiationScore,
      dto.assessmentScore,
    ];
    if (scores.some((score) => score == null) || !dto.overallRating)
      throw new BadRequestException(
        "All observation scores and the rating are required",
      );
    const [inserted] = await this.drizzle.query(
      `INSERT INTO principal_teacher_observations (
         organization_id, teacher_user_id, observer_user_id, observer_name, observation_date,
         class_name, subject_name, lesson_topic, observation_type, planning_score, pedagogy_score,
         engagement_score, differentiation_score, assessment_score, overall_rating, strengths,
         areas_for_improvement, action_items, follow_up_date, status
       ) VALUES ($1,$2,$3,$4,(NOW() AT TIME ZONE (SELECT time_zone FROM organizations WHERE id = $1))::date,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'Completed') RETURNING id`,
      [
        orgId,
        dto.teacherUserId,
        actor.id,
        actor.name || "",
        dto.className,
        dto.subjectName,
        dto.lessonTopic,
        dto.observationType || "Classroom Observation",
        ...scores,
        dto.overallRating,
        dto.strengths || "",
        dto.areasForImprovement || "",
        dto.actionItems || "",
        dto.followUpDate || null,
      ],
    );
    return inserted;
  }

  async assignDevelopment(
    orgId: string,
    actor: User,
    dto: AssignTeacherDevelopmentDto,
  ) {
    await this.activeTeacher(orgId, dto.teacherUserId);
    if (!dto.trainingHours)
      throw new BadRequestException("Training hours are required");
    const [inserted] = await this.drizzle.query(
      `INSERT INTO principal_teacher_developments (
         organization_id, teacher_user_id, title, category, provider, training_hours, status, assigned_by_user_id, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,'Assigned',$7,$8) RETURNING id`,
      [
        orgId,
        dto.teacherUserId,
        dto.title,
        dto.category || "",
        dto.provider || "",
        dto.trainingHours,
        actor.id,
        dto.notes || "",
      ],
    );
    return inserted;
  }

  async completeDevelopment(orgId: string, id: string) {
    const [row] = await this.drizzle.query(
      `UPDATE principal_teacher_developments SET status = 'Completed', completed_at = (NOW() AT TIME ZONE
         (SELECT time_zone FROM organizations WHERE id = $1))::date
       WHERE organization_id = $1 AND id = $2 AND status <> 'Completed' RETURNING id`,
      [orgId, id],
    );
    if (!row)
      throw new NotFoundException(
        "Open training assignment not found in this school",
      );
    return row;
  }

  async createDepartment(orgId: string, name: string, code: string) {
    const [row] = await this.drizzle.query(
      `INSERT INTO school_departments (organization_id, name, code, head_teacher_name)
       VALUES ($1,$2,$3,'') ON CONFLICT (organization_id, code) DO NOTHING RETURNING id`,
      [orgId, name, code],
    );
    if (!row) throw new ConflictException("Department code already exists");
    return row;
  }

  async assignDepartmentHead(
    orgId: string,
    departmentId: string,
    teacherId: string,
  ) {
    await this.activeTeacher(orgId, teacherId);
    const [row] = await this.drizzle.query(
      `UPDATE school_departments d SET head_teacher_id = $3, head_teacher_name = COALESCE(NULLIF(u.name, ''), u.email)
       FROM users u WHERE d.organization_id = $1 AND d.id = $2 AND u.id = $3 RETURNING d.id`,
      [orgId, departmentId, teacherId],
    );
    if (!row)
      throw new NotFoundException("Department not found in this school");
    return row;
  }

  async assignCoordinator(
    orgId: string,
    actor: User,
    departmentId: string,
    teacherId: string,
  ) {
    await this.activeTeacher(orgId, teacherId);
    const [department] = await this.drizzle.query(
      "SELECT id FROM school_departments WHERE organization_id = $1 AND id = $2",
      [orgId, departmentId],
    );
    if (!department)
      throw new NotFoundException("Department not found in this school");
    const [row] = await this.drizzle.query(
      `INSERT INTO principal_academic_coordinators (organization_id, teacher_user_id, department_id, assigned_by)
       VALUES ($1,$2,$3,$4) ON CONFLICT (organization_id, teacher_user_id, department_id) DO NOTHING RETURNING id`,
      [orgId, teacherId, departmentId, actor.id],
    );
    if (!row)
      throw new ConflictException(
        "Teacher is already a coordinator for this department",
      );
    return row;
  }

  async assignTeacher(
    orgId: string,
    sectionId: string,
    subjectId: string,
    teacherId: string,
  ) {
    await this.activeTeacher(orgId, teacherId);
    const [section] = await this.drizzle.query(
      "SELECT id FROM sections WHERE organization_id = $1 AND id = $2",
      [orgId, sectionId],
    );
    const [subject] = await this.drizzle.query(
      "SELECT id FROM subjects WHERE organization_id = $1 AND id = $2",
      [orgId, subjectId],
    );
    if (!section || !subject)
      throw new NotFoundException("Class or subject not found in this school");
    const [row] = await this.drizzle.query(
      `INSERT INTO class_subject_assignments (organization_id, section_id, subject_id, teacher_user_id)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (organization_id, section_id, subject_id)
       DO UPDATE SET teacher_user_id = EXCLUDED.teacher_user_id RETURNING id`,
      [orgId, sectionId, subjectId, teacherId],
    );
    return row;
  }
}
