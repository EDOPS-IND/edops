import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { trim } from "../academics/academic.dto";

export class CreatePlanDto {
  @ApiProperty({
    format: "uuid",
    description:
      "Client-generated stable ID; reuse the identical body to recover a lost response.",
  })
  @IsUUID()
  id!: string;
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
  @ApiProperty({
    description: "Flat monthly school price in INR paise, not per seat.",
    minimum: 0,
    maximum: 1000000000,
  })
  @IsInt()
  @Min(0)
  @Max(1000000000)
  amountMinor!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(100000) maxStudents!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(10000) maxTeachers!: number;
  @ApiPropertyOptional({ type: "object", additionalProperties: { type: "boolean" } })
  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;
}
export class PlanStatusDto {
  @ApiProperty() @IsBoolean() active!: boolean;
}
export class SubscriptionDto {
  @ApiProperty({ format: "uuid" }) @IsUUID() planId!: string;
  @ApiProperty({ enum: ["trialing", "active", "past_due", "canceled"] })
  @IsIn(["trialing", "active", "past_due", "canceled"])
  status!: string;
  @ApiProperty({ format: "date-time" })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  @IsDateString({ strict: true })
  periodStart!: string;
  @ApiProperty({ format: "date-time" })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  @IsDateString({ strict: true })
  periodEnd!: string;
}
export class FeatureOverrideDto {
  @ApiProperty({ enum: ["arena", "recordings", "communication"] })
  @IsIn(["arena", "recordings", "communication"])
  feature!: "arena" | "recordings" | "communication";
  @ApiProperty({
    description: "Use inherit to remove the override.",
    enum: ["enabled", "disabled", "inherit"],
  })
  @IsIn(["enabled", "disabled", "inherit"])
  mode!: string;
}
export class PayInvoiceDto {
  @ApiProperty({
    description:
      "Unique offline payment receipt/reference. Never card or bank account details.",
  })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  paymentReference!: string;
}

export class CreateSupportTicketDto {
  @ApiPropertyOptional({ format: "uuid" })
  @Transform(({ value }) => (typeof value === "string" && value.trim() === "" ? undefined : value))
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  schoolName?: string;
  @ApiProperty({
    enum: [
      "login",
      "billing",
      "technical",
      "academic",
      "feature_request",
      "bug",
      "security",
      "other",
    ],
  })
  @IsIn([
    "login",
    "billing",
    "technical",
    "academic",
    "feature_request",
    "bug",
    "security",
    "other",
  ])
  category!: string;
  @ApiProperty({ enum: ["low", "medium", "high", "urgent"] })
  @IsIn(["low", "medium", "high", "urgent"])
  priority!: string;
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  subject!: string;
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(5)
  description!: string;
}

export class UpdateSupportTicketStatusDto {
  @ApiProperty({
    enum: ["open", "assigned", "in_progress", "waiting", "resolved", "closed"],
  })
  @IsIn(["open", "assigned", "in_progress", "waiting", "resolved", "closed"])
  status!: string;
  @ApiPropertyOptional({ format: "uuid" }) @IsUUID() assignedTo?: string;
}

export class StartSupportSessionDto {
  @ApiProperty({ format: "uuid" }) @IsUUID() organizationId!: string;
  @ApiPropertyOptional({ format: "uuid" }) @IsUUID() targetUserId?: string;
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  reason!: string;
}

export class CreateAnnouncementDto {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;
  @ApiProperty() @Transform(trim) @IsString() @MinLength(5) message!: string;
  @ApiPropertyOptional({
    enum: ["general", "maintenance", "security", "feature_release", "billing"],
  })
  @IsIn(["general", "maintenance", "security", "feature_release", "billing"])
  type: string = "general";
  @ApiPropertyOptional({ enum: ["low", "normal", "high", "critical"] })
  @IsIn(["low", "normal", "high", "critical"])
  priority: string = "normal";
  @ApiPropertyOptional({
    enum: ["all", "active", "trial", "enterprise", "professional", "selected"],
  })
  @IsIn(["all", "active", "trial", "enterprise", "professional", "selected"])
  audience: string = "all";
  @ApiPropertyOptional() targetPlans?: string[];
  @ApiPropertyOptional() channels?: string[];
}

export class RecordPaymentDto {
  @ApiProperty({ format: "uuid" }) @IsUUID() invoiceId!: string;
  @ApiProperty() @IsInt() @Min(1) amountMinor!: number;
  @ApiProperty() @Transform(trim) @IsString() paymentMethod!: string;
  @ApiPropertyOptional() @IsString() transactionId?: string;
}

export class RefundPaymentDto {
  @ApiProperty() @Transform(trim) @IsString() @MinLength(5) reason!: string;
}

export class DetailedFeatureOverrideDto {
  @ApiProperty() @IsString() featureKey!: string;
  @ApiPropertyOptional() @IsString() role?: string;
  @ApiProperty() @IsBoolean() enabled!: boolean;
  @ApiPropertyOptional() @IsInt() customLimit?: number;
  @ApiPropertyOptional() @IsInt() customQuota?: number;
  @ApiPropertyOptional() @IsDateString() expiryDate?: string;
  @ApiProperty() @Transform(trim) @IsString() reason!: string;
}

export class SchoolLifecycleTransitionDto {
  @ApiProperty({ enum: ["active", "suspended", "trial", "archived"] })
  @IsIn(["active", "suspended", "trial", "archived"])
  status!: string;
  @ApiPropertyOptional() @Transform(trim) @IsString() reason?: string;
  @ApiPropertyOptional() @IsInt() @Min(1) @Max(90) extendTrialDays?: number;
}

export class OnboardSchoolFullDto {
  @ApiProperty() @Transform(trim) @IsString() @MinLength(2) name!: string;
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;
  @ApiPropertyOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsString() schoolType?: string;
  @ApiPropertyOptional() @IsString() board?: string;
  @ApiPropertyOptional() @IsString() registrationNumber?: string;
  @ApiPropertyOptional() @IsString() affiliationNumber?: string;
  @ApiPropertyOptional() @IsInt() establishedYear?: number;
  @ApiPropertyOptional() @IsString() addressLine1?: string;
  @ApiPropertyOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsString() pincode?: string;
  @ApiProperty() @Transform(trim) @IsString() officialEmail!: string;
  @ApiPropertyOptional() @IsString() officialPhone?: string;
  @ApiPropertyOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsString() timeZone?: string;
  @ApiPropertyOptional() @IsString() locale?: string;
  // Admin
  @ApiProperty() @Transform(trim) @IsString() adminName!: string;
  @ApiProperty() @Transform(trim) @IsString() adminEmail!: string;
  @ApiPropertyOptional() @IsString() adminPhone?: string;
  @ApiPropertyOptional() @IsString() adminDesignation?: string;
  // Plan
  @ApiProperty({ format: "uuid" }) @IsUUID() planId!: string;
  @ApiPropertyOptional() @IsBoolean() isTrial?: boolean;
  @ApiPropertyOptional() @IsInt() trialDays?: number;
  // Overrides
  @ApiPropertyOptional() overrides?: {
    featureKey: string;
    enabled: boolean;
    reason?: string;
  }[];
}

export class UpdateSchoolDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(63)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  schoolType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  board?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  affiliationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  establishedYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(254)
  officialEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  officialPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(16)
  locale?: string;
}

