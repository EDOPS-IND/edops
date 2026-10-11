import { ApiProperty } from "@nestjs/swagger";
import { CreatePlanDto, SubscriptionDto } from "./billing.dto";

export class PlanView extends CreatePlanDto {
  @ApiProperty({ enum: ["INR"] }) currency!: string;
  @ApiProperty({ enum: ["monthly"] }) billingCycle!: string;
  @ApiProperty() active!: boolean;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
}
export class SubscriptionView extends SubscriptionDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) organizationId!: string;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
}
export class SeatUsage {
  @ApiProperty() students!: number;
  @ApiProperty() teachers!: number;
  @ApiProperty() pendingStudents!: number;
  @ApiProperty() pendingTeachers!: number;
}
export class EntitlementView {
  @ApiProperty({ enum: ["trialing", "active", "past_due", "canceled"] })
  status!: string;
  @ApiProperty({ format: "date-time" }) periodStart!: string;
  @ApiProperty({ format: "date-time" }) periodEnd!: string;
  @ApiProperty() implicitTrial!: boolean;
  @ApiProperty({
    description:
      "False for expiration, future periods, past_due, canceled or school suspension.",
  })
  entitled!: boolean;
  @ApiProperty() maxStudents!: number;
  @ApiProperty() maxTeachers!: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'boolean' } }) features!: Record<string, boolean>;
}
class OverrideView {
  @ApiProperty({ enum: ["arena", "recordings", "communication"] })
  feature!: string;
  @ApiProperty() enabled!: boolean;
}
export class BillingOverview {
  @ApiProperty({ type: SubscriptionView, nullable: true })
  subscription!: SubscriptionView | null;
  @ApiProperty({ type: EntitlementView }) entitlements!: EntitlementView;
  @ApiProperty({ type: SeatUsage }) usage!: SeatUsage;
  @ApiProperty({ type: [OverrideView] }) overrides!: OverrideView[];
}
export class InvoiceView {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) organizationId!: string;
  @ApiProperty({ format: "uuid" }) subscriptionId!: string;
  @ApiProperty({ format: "uuid" }) planId!: string;
  @ApiProperty({
    description: "INR paise. Internal ledger record, not a tax invoice.",
  })
  amountMinor!: number;
  @ApiProperty({ enum: ["INR"] }) currency!: string;
  @ApiProperty({ format: "date-time" }) periodStart!: string;
  @ApiProperty({ format: "date-time" }) periodEnd!: string;
  @ApiProperty({ enum: ["open", "paid", "void"] }) status!: string;
  @ApiProperty({ type: String, nullable: true }) paymentReference!:
    | string
    | null;
  @ApiProperty({ type: String, format: "date-time", nullable: true }) paidAt!:
    | string
    | null;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
}
export class SchoolSummary {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: ["active", "suspended"] }) status!: string;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
}
export class SchoolStatistics {
  @ApiProperty({ format: "uuid" }) organizationId!: string;
  @ApiProperty({ enum: ["INR"] }) currency!: string;
  @ApiProperty() sections!: number;
  @ApiProperty() publishedAssignments!: number;
  @ApiProperty() arenaAttempts!: number;
  @ApiProperty() publishedRecordings!: number;
  @ApiProperty({
    description:
      "Decimal integer string from verified metadata, not provider-metered usage.",
  })
  verifiedRecordingBytes!: string;
  @ApiProperty() failedEvents!: number;
  @ApiProperty({
    description:
      "Decimal integer string in INR paise, all manually marked paid invoices. Not MRR.",
  })
  paidAmountMinor!: string;
  @ApiProperty({
    description: "Decimal integer string in INR paise for open invoices.",
  })
  openAmountMinor!: string;
  @ApiProperty({ type: SeatUsage }) usage!: SeatUsage;
}
