import { Injectable, NotFoundException } from "@nestjs/common";
import { DrizzleService } from "../../../database/drizzle.service";
import { User } from "../../auth/user.entity";
import {
  CreateAcademicPlanDto,
  CreateAcademicTargetDto,
  CreateActionPlanDto,
  RecordAcademicMeetingDto,
  UpdateAcademicTargetDto,
} from "../dto/principal.dto";

@Injectable()
export class PrincipalPlanningService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getPlanningOverview(orgId: string, _actor: User) {
    const [plans, targets, actionPlans, meetings] = await Promise.all([
      this.drizzle.query(
        `SELECT id, title, board, academic_objectives AS "academicObjectives",
        teaching_pedagogy_strategy AS "teachingPedagogyStrategy", assessment_strategy AS "assessmentStrategy",
        remedial_plan AS "remedialPlan", status, created_at AS "createdAt"
        FROM principal_academic_plans WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT id, title, category, baseline_value AS "baselineValue",
        target_value AS "targetValue", current_value AS "currentValue",
        progress_percentage AS "progressPercentage", owner_name AS "ownerName", deadline, status
        FROM principal_academic_targets WHERE organization_id = $1 ORDER BY deadline ASC LIMIT 100`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT id, issue, evidence, root_cause AS "rootCause", action,
        owner_name AS "ownerName", deadline, review_date AS "reviewDate",
        expected_result AS "expectedResult", status
        FROM principal_action_plans WHERE organization_id = $1 ORDER BY review_date ASC LIMIT 100`,
        [orgId],
      ),
      this.drizzle.query(
        `SELECT id, meeting_type AS "meetingType", meeting_date AS "meetingDate",
        participants, agenda, findings, decisions, status
        FROM principal_academic_meetings WHERE organization_id = $1 ORDER BY meeting_date DESC LIMIT 100`,
        [orgId],
      ),
    ]);
    return { plans, targets, actionPlans, meetings };
  }

  async createAcademicPlan(
    orgId: string,
    actor: User,
    dto: CreateAcademicPlanDto,
  ) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO principal_academic_plans (
        organization_id, title, board, academic_objectives, teaching_pedagogy_strategy, assessment_strategy, status, approved_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        orgId,
        dto.title,
        dto.board,
        dto.academicObjectives || "",
        dto.teachingPedagogyStrategy || "",
        dto.assessmentStrategy || "",
        dto.status || "Draft",
        dto.status === "Approved" ? actor.id : null,
      ],
    );
    return inserted;
  }

  async createTarget(
    orgId: string,
    _actor: User,
    dto: CreateAcademicTargetDto,
  ) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO principal_academic_targets (
        organization_id, title, category, baseline_value, target_value, owner_name, deadline, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Not Started')
      RETURNING *`,
      [
        orgId,
        dto.title,
        dto.category || "School",
        dto.baselineValue,
        dto.targetValue,
        dto.ownerName,
        dto.deadline,
      ],
    );
    return inserted;
  }

  async updateTarget(
    orgId: string,
    targetId: string,
    dto: UpdateAcademicTargetDto,
  ) {
    const [target] = await this.drizzle.query(
      `UPDATE principal_academic_targets
      SET current_value = $3, progress_percentage = $4,
        status = CASE WHEN $4 = 100 THEN 'Achieved' ELSE 'In Progress' END
      WHERE organization_id = $1 AND id = $2 RETURNING id`,
      [orgId, targetId, dto.currentValue, dto.progressPercentage],
    );
    if (!target) throw new NotFoundException("Target not found");
    return target;
  }

  async createActionPlan(
    orgId: string,
    _actor: User,
    dto: CreateActionPlanDto,
  ) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO principal_action_plans (
        organization_id, issue, evidence, root_cause, action, owner_name, owner_user_id, deadline, review_date, expected_result, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Active')
      RETURNING *`,
      [
        orgId,
        dto.issue,
        dto.evidence || "",
        dto.rootCause || "",
        dto.action,
        dto.ownerName,
        null,
        dto.deadline,
        dto.reviewDate,
        dto.expectedResult || "",
      ],
    );
    return inserted;
  }

  async recordMeeting(
    orgId: string,
    _actor: User,
    dto: RecordAcademicMeetingDto,
  ) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO principal_academic_meetings (
        organization_id, meeting_type, meeting_date, participants, agenda, findings, decisions, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        orgId,
        dto.meetingType,
        dto.meetingDate,
        dto.participants || [],
        dto.agenda,
        dto.findings || "",
        dto.decisions || "",
        dto.meetingDate > new Date().toISOString().slice(0, 10)
          ? "Scheduled"
          : "Completed",
      ],
    );
    return inserted;
  }
}
