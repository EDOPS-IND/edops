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

  @ApiPropertyOptional({ enum: ["in_app", "whatsapp", "sms", "email"] })
  @IsOptional()
  @IsEnum(["in_app", "whatsapp", "sms", "email"])
  channel?: "in_app" | "whatsapp" | "sms" | "email";
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

export class RecordOfflinePaymentDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  dueId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BatchFeeReminderDto {
  @ApiPropertyOptional({ enum: ["in_app", "whatsapp", "sms", "email"] })
  @IsOptional()
  @IsEnum(["in_app", "whatsapp", "sms", "email"])
  channel?: "in_app" | "whatsapp" | "sms" | "email";
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

  @ApiPropertyOptional({ type: [String], description: "List of subject UUIDs mapped to this department" })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  subjectIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateParentChildrenDto {
  @ApiProperty({ type: [String], description: "List of student user UUIDs mapped to this parent" })
  @IsArray()
  @IsUUID("4", { each: true })
  studentUserIds!: string[];
}

export class UpdateTeacherEmploymentDto {
  @ApiPropertyOptional({ example: "EMP-1042" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeId?: string;

  @ApiPropertyOptional({ example: "Regular Faculty" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employmentType?: string;
}

export class CreateCurriculumNodeDto {
  @ApiProperty({ example: "Class 10" })
  @IsString()
  @IsNotEmpty()
  grade!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiProperty({ example: "Mathematics" })
  @IsString()
  @IsNotEmpty()
  subjectName!: string;

  @ApiProperty({ example: "Algebra" })
  @IsString()
  @IsNotEmpty()
  unitName!: string;

  @ApiProperty({ example: "Quadratic Equations" })
  @IsString()
  @IsNotEmpty()
  chapterName!: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedCompletionWeek?: number;

  @ApiPropertyOptional({ type: [String], example: ["Solve quadratic equations"] })
  @IsOptional()
  @IsArray()
  learningOutcomes?: string[];
}

export class CreateCourseworkDto {
  @ApiProperty()
  @IsUUID()
  sectionId!: string;

  @ApiProperty()
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ example: "Quadratic Equations Homework" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: "2026-11-01" })
  @IsDateString()
  dueAt!: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxScore?: number;
}

export class ScheduleExamDto {
  @ApiProperty()
  @IsUUID()
  sectionId!: string;

  @ApiProperty()
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ example: "Periodic Assessment 2" })
  @IsString()
  @IsNotEmpty()
  examName!: string;

  @ApiProperty({ example: "Term 1" })
  @IsString()
  @IsNotEmpty()
  term!: string;

  @ApiProperty({ example: "2026-11-15" })
  @IsDateString()
  examDate!: string;

  @ApiProperty({ example: "09:00" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @ApiProperty({ example: "12:00" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  maxMarks!: number;
}

