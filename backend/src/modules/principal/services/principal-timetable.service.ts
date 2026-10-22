import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DrizzleService } from "../../../database/drizzle.service";
import { User } from "../../auth/user.entity";
import { SchoolAdminService } from "../../school-admin/school-admin.service";
import {
  CreateTimetableEntryDto,
  UpdateTimetableEntryDto,
} from "../../school-admin/school-admin.dto";
import { AssignTimetableSubstituteDto } from "../dto/principal.dto";

@Injectable()
export class PrincipalTimetableService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly admin: SchoolAdminService,
  ) {}

  async overview(orgId: string, actor: User) {
    const timetable = await this.admin.getTimetable(orgId, actor);
    const substitutions = await this.drizzle.query(
      `SELECT ps.id, ps.timetable_entry_id AS "timetableEntryId",
      ps.event_date AS "eventDate", ps.impact_note AS "impactNote",
      t.day_of_week AS "dayOfWeek", t.period_number AS "periodNumber",
      sec.name AS "sectionName", prog.name AS "programName", sub.name AS "subjectName",
      COALESCE(original.name, original.email) AS "originalTeacher",
      COALESCE(replacement.name, replacement.email) AS "substituteTeacher",
      replacement.id AS "substituteTeacherUserId",
      absence.leave_type AS "absenceType"
      FROM principal_timetable_substitutions ps
      JOIN timetable_entries t ON t.id = ps.timetable_entry_id AND t.organization_id = ps.organization_id
      JOIN sections sec ON sec.id = t.section_id AND sec.organization_id = ps.organization_id
      JOIN programs prog ON prog.id = sec.program_id AND prog.organization_id = ps.organization_id
      JOIN subjects sub ON sub.id = t.subject_id AND sub.organization_id = ps.organization_id
      JOIN users original ON original.id = t.teacher_user_id
      JOIN users replacement ON replacement.id = ps.substitute_teacher_user_id
      LEFT JOIN LATERAL (SELECT leave_type FROM leave_requests l WHERE l.organization_id = ps.organization_id
        AND l.user_id = t.teacher_user_id AND l.status = 'approved'
        AND ps.event_date BETWEEN l.start_date AND l.end_date ORDER BY l.created_at DESC LIMIT 1) absence ON true
      WHERE ps.organization_id = $1 ORDER BY ps.event_date DESC, t.period_number LIMIT 100`,
      [orgId],
    );
    const uncovered = await this.drizzle.query(
      `SELECT DISTINCT t.id AS "timetableEntryId",
      absent.event_date AS "eventDate", t.period_number AS "periodNumber",
      sec.name AS "sectionName", prog.name AS "programName", sub.name AS "subjectName",
      COALESCE(u.name, u.email) AS "originalTeacher", absent.leave_type AS "absenceType"
      FROM leave_requests l
      JOIN users u ON u.id = l.user_id
      CROSS JOIN LATERAL (SELECT day::date AS event_date, l.leave_type
        FROM generate_series(GREATEST(l.start_date, CURRENT_DATE - 30),
          LEAST(l.end_date, CURRENT_DATE + 60), interval '1 day') day) absent
      JOIN timetable_entries t ON t.organization_id = l.organization_id AND t.teacher_user_id = l.user_id
        AND t.day_of_week = EXTRACT(ISODOW FROM absent.event_date)
      JOIN academic_years y ON y.id = t.academic_year_id AND y.organization_id = l.organization_id AND y.is_current = true
      JOIN sections sec ON sec.id = t.section_id AND sec.organization_id = l.organization_id
      JOIN programs prog ON prog.id = sec.program_id AND prog.organization_id = l.organization_id
      JOIN subjects sub ON sub.id = t.subject_id AND sub.organization_id = l.organization_id
      LEFT JOIN principal_timetable_substitutions ps ON ps.organization_id = l.organization_id
        AND ps.timetable_entry_id = t.id AND ps.event_date = absent.event_date
      WHERE l.organization_id = $1 AND l.applicant_role = 'teacher' AND l.status = 'approved'
        AND l.end_date >= CURRENT_DATE - 30 AND l.start_date <= CURRENT_DATE + 60
        AND ps.id IS NULL ORDER BY absent.event_date, "periodNumber" LIMIT 100`,
      [orgId],
    );
    return { ...timetable, substitutions, uncovered };
  }

  create(orgId: string, actor: User, dto: CreateTimetableEntryDto) {
    return this.admin.createTimetableEntry(orgId, actor, dto);
  }
  update(orgId: string, actor: User, id: string, dto: UpdateTimetableEntryDto) {
    return this.admin.updateTimetableEntry(orgId, actor, id, dto);
  }
  delete(orgId: string, actor: User, id: string) {
    return this.admin.deleteTimetableEntry(orgId, actor, id);
  }

  async suggestions(orgId: string, entryId: string, eventDate: string) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(eventDate || "") ||
      Number.isNaN(new Date(`${eventDate}T12:00:00Z`).getTime())
    )
      throw new BadRequestException("Valid date required");
    const [entry] = await this.drizzle.query(
      `SELECT day_of_week AS "dayOfWeek", period_number AS "periodNumber",
      start_time AS "startTime", end_time AS "endTime", teacher_user_id AS "teacherUserId"
      FROM timetable_entries t JOIN academic_years y ON y.id = t.academic_year_id
        AND y.organization_id = t.organization_id AND y.is_current = true
      WHERE t.organization_id = $1 AND t.id = $2 AND $3::date BETWEEN y.start_date AND y.end_date`,
      [orgId, entryId, eventDate],
    );
    if (!entry) throw new NotFoundException("Timetable entry not found");
    this.checkDate(eventDate, Number(entry.dayOfWeek));
    return this.drizzle.query(
      `SELECT u.id, COALESCE(u.name, u.email) AS name, u.email
      FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.organization_id = $1 AND m.role = 'teacher' AND m.status = 'active'
      AND u.is_active = true
      AND m.user_id <> $4 AND NOT EXISTS (SELECT 1 FROM timetable_entries t
        JOIN academic_years y ON y.id = t.academic_year_id AND y.organization_id = t.organization_id AND y.is_current = true
        WHERE t.organization_id = $1 AND t.teacher_user_id = m.user_id
        AND t.day_of_week = $2 AND (t.period_number = $3 OR (t.start_time < $6 AND t.end_time > $7)))
      AND NOT EXISTS (SELECT 1 FROM principal_timetable_substitutions ps
        JOIN timetable_entries t ON t.id = ps.timetable_entry_id AND t.organization_id = ps.organization_id
        WHERE ps.organization_id = $1 AND ps.substitute_teacher_user_id = m.user_id
        AND ps.event_date = $5::date AND (t.period_number = $3 OR (t.start_time < $6 AND t.end_time > $7)))
      AND NOT EXISTS (SELECT 1 FROM leave_requests l WHERE l.organization_id = $1
        AND l.user_id = m.user_id AND l.status = 'approved'
        AND $5::date BETWEEN l.start_date AND l.end_date)
      ORDER BY name`,
      [
        orgId,
        entry.dayOfWeek,
        entry.periodNumber,
        entry.teacherUserId,
        eventDate,
        entry.endTime,
        entry.startTime,
      ],
    );
  }

  async assignSubstitute(
    orgId: string,
    actor: User,
    dto: AssignTimetableSubstituteDto,
  ) {
    return this.drizzle.transaction(async (manager) => {
      // ponytail: one school-wide lock keeps the availability check and assignment atomic; split by period if contention grows.
      await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        orgId,
      ]);
      const [entry] = await manager.query(
        `SELECT day_of_week AS "dayOfWeek", period_number AS "periodNumber",
        start_time AS "startTime", end_time AS "endTime", teacher_user_id AS "teacherUserId"
        FROM timetable_entries t JOIN academic_years y ON y.id = t.academic_year_id
          AND y.organization_id = t.organization_id AND y.is_current = true
        WHERE t.organization_id = $1 AND t.id = $2 AND $3::date BETWEEN y.start_date AND y.end_date`,
        [orgId, dto.timetableEntryId, dto.eventDate],
      );
      if (!entry) throw new NotFoundException("Timetable entry not found");
      this.checkDate(dto.eventDate, Number(entry.dayOfWeek));
      if (entry.teacherUserId === dto.substituteTeacherUserId)
        throw new BadRequestException("Choose a different teacher");
      const [available] = await manager.query(
        `SELECT 1 FROM memberships m WHERE m.organization_id = $1
        AND m.user_id = $2 AND m.role = 'teacher' AND m.status = 'active'
        AND EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id AND u.is_active = true)
        AND NOT EXISTS (SELECT 1 FROM timetable_entries t
          JOIN academic_years y ON y.id = t.academic_year_id AND y.organization_id = t.organization_id AND y.is_current = true
          WHERE t.organization_id = $1
          AND t.teacher_user_id = $2 AND t.day_of_week = $3
          AND (t.period_number = $4 OR (t.start_time < $7 AND t.end_time > $8)))
        AND NOT EXISTS (SELECT 1 FROM principal_timetable_substitutions ps
          JOIN timetable_entries t ON t.id = ps.timetable_entry_id AND t.organization_id = ps.organization_id
          WHERE ps.organization_id = $1 AND ps.substitute_teacher_user_id = $2
          AND ps.event_date = $5::date AND (t.period_number = $4 OR (t.start_time < $7 AND t.end_time > $8))
          AND ps.timetable_entry_id <> $6)
        AND NOT EXISTS (SELECT 1 FROM leave_requests l WHERE l.organization_id = $1
          AND l.user_id = $2 AND l.status = 'approved' AND $5::date BETWEEN l.start_date AND l.end_date)`,
        [
          orgId,
          dto.substituteTeacherUserId,
          entry.dayOfWeek,
          entry.periodNumber,
          dto.eventDate,
          dto.timetableEntryId,
          entry.endTime,
          entry.startTime,
        ],
      );
      if (!available)
        throw new ConflictException("Teacher is unavailable for this period");
      const [saved] = await manager.query(
        `INSERT INTO principal_timetable_substitutions
        (organization_id, timetable_entry_id, event_date, substitute_teacher_user_id, impact_note, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (organization_id, timetable_entry_id, event_date)
        DO UPDATE SET substitute_teacher_user_id = EXCLUDED.substitute_teacher_user_id,
          impact_note = EXCLUDED.impact_note RETURNING id`,
        [
          orgId,
          dto.timetableEntryId,
          dto.eventDate,
          dto.substituteTeacherUserId,
          dto.impactNote || "",
          actor.id,
        ],
      );
      return saved;
    });
  }

  private checkDate(eventDate: string, dayOfWeek: number) {
    const date = new Date(`${eventDate}T12:00:00Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== eventDate ||
      (date.getUTCDay() || 7) !== dayOfWeek
    ) {
      throw new BadRequestException("Date must match the timetable day");
    }
  }
}
