import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
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
  ValidateNested,
} from "class-validator";

export class DirectAdmitStudentDto {
  @ApiProperty({ description: "Student full name" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: "Student email address" })
  @IsNotEmpty()
  @IsString()
  email!: string;

  @ApiPropertyOptional({ description: "Contact phone number" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "Assigned academic section UUID" })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ description: "Custom admission number" })
  @IsOptional()
  @IsString()
  admissionNo?: string;

  @ApiPropertyOptional({ description: "Custom roll number within section" })
  @IsOptional()
  @IsString()
  rollNo?: string;

  @ApiPropertyOptional({ description: "Gender of the student" })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ description: "Date of Birth (YYYY-MM-DD)" })
  @IsOptional()
  @IsString()
  dob?: string;
}

export class CreateSchoolDocumentDto {
  @ApiProperty({ example: "Fire Safety Certificate" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: "Safety & Compliance" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(60)
  category!: string;

  @ApiProperty({ example: "fire-safety.pdf" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ example: "application/pdf" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  contentType!: string;

  @ApiProperty({ example: 245760 })
  @IsInt()
  @Min(1)
  @Max(26214400)
  sizeBytes!: number;

  @ApiProperty({ description: "Base64 SHA-256 checksum" })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z0-9+/]{43}=$/)
  checksumSha256!: string;
}

export class CompleteSchoolDocumentDto {
  @ApiProperty({ description: "Version ID returned by storage after upload" })
  @IsNotEmpty()
  @IsString()
  versionId!: string;
}

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

  @ApiPropertyOptional({
    type: [String],
    description: "List of subject UUIDs mapped to this department",
  })
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
  @ApiProperty({
    type: [String],
    description: "List of student user UUIDs mapped to this parent",
  })
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

  @ApiPropertyOptional({
    type: [String],
    example: ["Solve quadratic equations"],
  })
  @IsOptional()
  @IsArray()
  learningOutcomes?: string[];
}

export class BulkCurriculumChapterItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ example: "Unit 1: Algebra" })
  @IsOptional()
  @IsString()
  unitName?: string;

  @ApiProperty({ example: "Quadratic Equations" })
  @IsString()
  @IsNotEmpty()
  chapterName!: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedCompletionWeek?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ["Solve quadratic equations"],
  })
  @IsOptional()
  @IsArray()
  learningOutcomes?: string[];
}

export class BulkCreateCurriculumDto {
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

  @ApiProperty({ type: [BulkCurriculumChapterItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCurriculumChapterItemDto)
  chapters!: BulkCurriculumChapterItemDto[];
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

export class SchedulePtmDto {
  @ApiProperty({ example: "Term 1 Parent Teacher Meeting" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: "2026-10-25" })
  @IsDateString()
  eventDate!: string;

  @ApiProperty({ example: "09:00" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @ApiProperty({ example: "13:00" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;

  @ApiPropertyOptional({ example: 15, default: 15 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  slotDurationMinutes?: number;

  @ApiPropertyOptional({ example: ["Grade 9", "Grade 10"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetGrades?: string[];
}

export class CreateTransportVehicleDto {
  @ApiProperty({ example: "BUS-01" })
  @IsString()
  @IsNotEmpty()
  vehicleNumber!: string;

  @ApiProperty({ example: "Route 1 - North Sector" })
  @IsString()
  @IsNotEmpty()
  routeName!: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({ example: "Rajesh Sharma" })
  @IsString()
  @IsNotEmpty()
  driverName!: string;

  @ApiProperty({ example: "+91 98765 43210" })
  @IsString()
  @IsNotEmpty()
  driverPhone!: string;

  @ApiPropertyOptional({ enum: ["on_route", "idle", "maintenance"] })
  @IsOptional()
  @IsEnum(["on_route", "idle", "maintenance"])
  status?: "on_route" | "idle" | "maintenance";
}

export class CreateLibraryBookDto {
  @ApiProperty({ example: "978-0132350884" })
  @IsString()
  @IsNotEmpty()
  isbn!: string;

  @ApiProperty({ example: "Clean Code" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: "Robert C. Martin" })
  @IsString()
  @IsNotEmpty()
  author!: string;

  @ApiPropertyOptional({ example: "Computer Science" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalCopies?: number;

  @ApiPropertyOptional({ example: "Shelf B-3" })
  @IsOptional()
  @IsString()
  shelfLocation?: string;
}

export class CreateSchoolAssetDto {
  @ApiProperty({ example: "AST-2024-001" })
  @IsString()
  @IsNotEmpty()
  assetCode!: string;

  @ApiProperty({ example: 'Interactive Smart Board 75"' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "IT Equipment" })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: "Room 101 - Smart Classroom" })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiPropertyOptional({ example: 55000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  purchaseCost?: number;

  @ApiPropertyOptional({ enum: ["good", "needs_maintenance", "damaged"] })
  @IsOptional()
  @IsEnum(["good", "needs_maintenance", "damaged"])
  condition?: "good" | "needs_maintenance" | "damaged";

  @ApiPropertyOptional({ example: "IT Dept" })
  @IsOptional()
  @IsString()
  custodianName?: string;
}

export class UpdateSchoolConfigDto {
  @ApiPropertyOptional({ example: "Delhi Public Academy, Vasant Vihar" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: "CBSE/AFF/2130842" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  affiliationNumber?: string;

  @ApiPropertyOptional({ example: "CBSE" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  board?: string;

  @ApiPropertyOptional({ example: "admin@dpa-edu.in" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  officialEmail?: string;

  @ApiPropertyOptional({ example: "+91 9876543210" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  officialPhone?: string;

  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  attendanceThreshold?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(80)
  workloadThreshold?: number;
}

export class UpdateSchoolAdminClassTeacherDto {
  @ApiPropertyOptional({
    example: "d3b07384-d113-4944-9c88-c75c87901001",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  teacherUserId?: string | null;
}

export class AssignSchoolAdminTeacherDto {
  @ApiProperty({ example: "d3b07384-d113-4944-9c88-c75c87901001" })
  @IsUUID()
  @IsNotEmpty()
  subjectId!: string;

  @ApiPropertyOptional({ example: "d3b07384-d113-4944-9c88-c75c87901002", nullable: true })
  @IsOptional()
  @IsUUID()
  teacherUserId?: string | null;
}
