import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateLeaveStatusDto {
  @ApiProperty({ enum: ["approved", "rejected"] })
  @IsEnum(["approved", "rejected"])
  status!: "approved" | "rejected";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

export class CreateLeaveRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  leaveType!: string;

  @ApiProperty({ format: "date" })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ format: "date" })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  daysCount?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ enum: ["student", "teacher", "staff"] })
  @IsOptional()
  @IsEnum(["student", "teacher", "staff"])
  applicantRole?: "student" | "teacher" | "staff";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  applicantName?: string;
}

export class CreateFeeStructureDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  grade!: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  tuitionFee!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  developmentFee!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  labFee!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  libraryFee!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  transportFee!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  installmentsCount?: number;
}

export class SendFeeReminderDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  dueId!: string;

  @ApiPropertyOptional({ enum: ["whatsapp", "sms", "email"] })
  @IsOptional()
  @IsEnum(["whatsapp", "sms", "email"])
  channel?: "whatsapp" | "sms" | "email";
}

export class GrantFeeConcessionDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  dueId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  concessionAmount!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  concessionReason!: string;
}

export class CreateBroadcastDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  channels!: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  targetAudience!: string;

  @ApiPropertyOptional({ enum: ["low", "normal", "high", "urgent"] })
  @IsOptional()
  @IsEnum(["low", "normal", "high", "urgent"])
  priority?: "low" | "normal" | "high" | "urgent";
}

export class CreateDisciplineIncidentDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  studentUserId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  studentName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classSection?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  incidentType!: string;

  @ApiProperty({ enum: ["minor", "moderate", "severe"] })
  @IsEnum(["minor", "moderate", "severe"])
  severity!: "minor" | "moderate" | "severe";

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actionTaken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportedByName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  parentNotified?: boolean;
}

export class CreateTimetableEntryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  sectionId!: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  teacherUserId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(8)
  periodNumber!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  roomNumber?: string;
}

export class UpdateTimetableEntryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  teacherUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  periodNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  roomNumber?: string;
}

export class CreateDepartmentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  headTeacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headTeacherName?: string;
}
