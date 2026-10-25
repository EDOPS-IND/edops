import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  Matches,
  ValidateNested,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

// 1. Academic Planning DTOs
export class CreateAcademicPlanDto {
  @ApiProperty({ example: "Annual Pedagogical Plan 2026-27" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: "CBSE" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  board!: string;

  @ApiPropertyOptional({
    example: "Achieve 95% pass rate with competency-based mastery",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  academicObjectives?: string;

  @ApiPropertyOptional({
    example: "Continuous formative assessment and experiential learning",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  teachingPedagogyStrategy?: string;

  @ApiPropertyOptional({
    example:
      "Two periodic tests, midterm, pre-board and holistic progress card",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  assessmentStrategy?: string;

  @ApiPropertyOptional({ example: "Draft" })
  @IsOptional()
  @IsIn(["Draft", "Review", "Approved", "In Progress", "Completed"])
  status?: string;
}

export class CreateAcademicTargetDto {
  @IsOptional()
  @IsIn(["Learning", "School"])
  category?: "Learning" | "School";

  @ApiProperty({ example: "Class 10 Mathematics average >= 80%" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: "Mathematics Department" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  ownerName!: string;

  @ApiProperty({ example: "72%" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  baselineValue!: string;

  @ApiProperty({ example: "82%" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  targetValue!: string;

  @ApiProperty({ example: "2027-03-31" })
  @IsDateString()
  deadline!: string;
}

export class UpdateAcademicTargetDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  currentValue!: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(100) progressPercentage!: number;
}

export class AssignTimetableSubstituteDto {
  @IsUUID() timetableEntryId!: string;
  @IsDateString() eventDate!: string;
  @IsUUID() substituteTeacherUserId!: string;
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  impactNote?: string;
}

export class CreateActionPlanDto {
  @ApiProperty({
    example: "Class 10-A Mathematics dropped by 11% in Periodic Test 2",
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  issue!: string;

  @ApiPropertyOptional({ example: "PT2 score fell by 11%" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  evidence?: string;

  @ApiPropertyOptional({
    example: "Low mastery on Quadratic Equations and Real Numbers",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiProperty({
    example: "Conduct remedial classes and re-test affected students",
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  action!: string;

  @ApiProperty({ example: "Rahul Sharma (HOD Math)" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  ownerName!: string;

  @ApiProperty({ example: "2026-11-15" })
  @IsDateString()
  deadline!: string;

  @ApiProperty({ example: "2026-10-30" })
  @IsDateString()
  reviewDate!: string;

  @ApiPropertyOptional({ example: "Average score improvement to 80%+" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  expectedResult?: string;
}

export class RecordAcademicMeetingDto {
  @ApiProperty({ example: "Monthly Academic Review" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  meetingType!: string;

  @ApiProperty({ example: "2026-10-15" })
  @IsDateString()
  meetingDate!: string;

  @ApiProperty({
    example: ["Principal", "HOD Science", "HOD Math", "Academic Coordinator"],
  })
  @IsArray()
  participants!: string[];

  @ApiProperty({
    example: "Review Syllabus Progress and Term 1 Exam Readiness",
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  agenda!: string;

  @ApiPropertyOptional({
    example: "Class 9 Science 2 weeks ahead; Class 10 Math needs remedial",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiPropertyOptional({
    example: "Approved 4 weekend remedial sessions for Class 10",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  decisions?: string;
}

// 2. Teacher Academic Management DTOs
export class PrincipalDepartmentDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100) name!: string;
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code!: string;
}

export class PrincipalTeacherLinkDto {
  @IsUUID() teacherUserId!: string;
  @IsUUID() departmentId!: string;
}

export class PrincipalTeacherAssignmentDto {
  @IsUUID() teacherUserId!: string;
  @IsUUID() sectionId!: string;
  @IsUUID() subjectId!: string;
}

export class RecordTeacherObservationDto {
  @ApiProperty({ example: "00000000-0000-0000-0000-000000000000" })
  @IsUUID()
  teacherUserId!: string;

  @ApiProperty({ example: "Class 10-A" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  className!: string;

  @ApiProperty({ example: "Mathematics" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  subjectName!: string;

  @ApiProperty({
    example: "Quadratic Equations - Derivation of Quadratic Formula",
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  lessonTopic!: string;

  @ApiPropertyOptional({ example: "Formal Classroom Walkthrough" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  observationType?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  planningScore?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  pedagogyScore?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  engagementScore?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  differentiationScore?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  assessmentScore?: number;

  @ApiPropertyOptional({ example: "Good" })
  @IsOptional()
  @IsIn(["Needs Support", "Satisfactory", "Good", "Exemplary"])
  overallRating?: string;

  @ApiPropertyOptional({
    example: "Excellent conceptual explanation using graphical visualizer",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional({
    example: "More interactive questioning for back-bench learners",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  areasForImprovement?: string;

  @ApiPropertyOptional({ example: "Introduce think-pair-share in next lesson" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  actionItems?: string;

  @ApiPropertyOptional({ example: "2026-11-10" })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}

export class AssignTeacherDevelopmentDto {
  @ApiProperty({ example: "00000000-0000-0000-0000-000000000000" })
  @IsUUID()
  teacherUserId!: string;

  @ApiProperty({ example: "CBSE Competency-Based Education & Item Writing" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: "Pedagogy" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ example: "CBSE COE New Delhi" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  provider?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  trainingHours?: number;

  @ApiPropertyOptional({ example: "Assigned" })
  @IsOptional()
  @IsIn(["Recommended", "Assigned", "In Progress", "Completed"])
  status?: string;

  @ApiPropertyOptional({
    example: "Focus on higher-order thinking question generation",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  notes?: string;
}

// 3. Academics, Curriculum & Lesson Plan DTOs
export class UpdateCurriculumProgressDto {
  @ApiProperty({ example: "00000000-0000-0000-0000-000000000000" })
  @IsUUID()
  nodeId!: string;

  @ApiProperty({ example: 85 })
  @IsInt()
  @Min(0)
  @Max(100)
  actualCompletionPercentage!: number;

  @ApiPropertyOptional({ example: "On Track" })
  @IsOptional()
  @IsIn(["On Track", "Needs Attention", "Behind Schedule", "Completed"])
  status?: string;
}

export class ReviewLessonPlanDto {
  @ApiProperty({ example: "Approved" })
  @IsIn(["Approved", "Needs Revision", "Completed"])
  status!: string;

  @ApiPropertyOptional({
    example:
      "Well-structured activity. Please incorporate 5 minutes for formative exit quiz.",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  principalFeedback?: string;
}

// 4. Assessment & Exam Publishing DTOs
export class CreateQuestionPaperDto {
  @ApiProperty({ example: "Class 10 Mathematics Term 1 Summative Examination" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: "Mathematics" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subjectName!: string;

  @ApiProperty({ example: "Class 10" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  grade!: string;

  @ApiPropertyOptional({ example: "Term 1 Midterm" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  term?: string;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(200)
  totalMarks?: number;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(360)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  difficultyEasyPct?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  difficultyMediumPct?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  difficultyHardPct?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  competencyMapped?: boolean;

  @ApiPropertyOptional({ example: "Rahul Sharma" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  submittedByName?: string;

  @ApiPropertyOptional({ example: "00000000-0000-0000-0000-000000000000" })
  @IsOptional()
  @IsUUID()
  submittedByUserId?: string;

  @ApiPropertyOptional({ example: "Under Review" })
  @IsOptional()
  @IsIn(["Draft", "Submitted", "Under Review", "Approved", "Published"])
  status?: string;

  @ApiPropertyOptional({ example: "" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  reviewComments?: string;
}

export class ReviewQuestionPaperDto {
  @ApiProperty({ example: "Approved" })
  @IsIn(["Draft", "Submitted", "Under Review", "Approved", "Published"])
  status!: string;

  @ApiPropertyOptional({
    example:
      "Blueprint conforms to CBSE 2026-27 guidelines with 30% HOTS questions.",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  reviewComments?: string;
}

export class PublishExamResultsDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  term!: string;

  @ApiProperty({ example: "Term 1 Mid-Term Examination" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  examName!: string;

  @ApiProperty({ example: "Grade 10" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  className!: string;

  @ApiProperty({ example: "10-A" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sectionName!: string;
}

export class CreateExamPlanDto {
  @IsUUID() sectionId!: string;
  @IsUUID() subjectId!: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150) examName!: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(60) term!: string;
  @IsDateString() examDate!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime!: string;
  @Type(() => Number) @IsNumber() @Min(0.01) @Max(999.99) maxMarks!: number;
  @Type(() => Number) @IsNumber() @Min(0.01) @Max(999.99) passingMarks!: number;
  @IsIn(["draft", "scheduled"]) status!: "draft" | "scheduled";
}

export class CreateExamPlanSubjectDto {
  @IsUUID() sectionId!: string;
  @IsUUID() subjectId!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime!: string;
  @Type(() => Number) @IsNumber() @Min(0.01) @Max(999.99) maxMarks!: number;
  @Type(() => Number) @IsNumber() @Min(0.01) @Max(999.99) passingMarks!: number;
}

export class CreateExamPlansDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(150) examName!: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(60) term!: string;
  @IsDateString() examDate!: string;
  @IsIn(["draft", "scheduled"]) status!: "draft" | "scheduled";
  @IsArray() @ArrayNotEmpty() @Type(() => CreateExamPlanSubjectDto)
  @ValidateNested({ each: true })
  plans!: CreateExamPlanSubjectDto[];
}

export class UpdateExamPlanDto extends PartialType(CreateExamPlanDto) {}

export class ReviewExamResultDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) marksObtained?: number;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(10) grade?: string;
  @IsOptional() @IsIn(["Verified", "Approved"]) status?:
    | "Verified"
    | "Approved";
}

// 5. Students & Intervention DTOs
export class CreateStudentInterventionDto {
  @ApiProperty({ example: "00000000-0000-0000-0000-000000000000" })
  @IsUUID()
  studentUserId!: string;

  @ApiProperty({ example: "Vikas Kumar" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  studentName!: string;

  @ApiProperty({ example: "10-A" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  classSection!: string;

  @ApiProperty({ example: "Algebra and Quadratic Equations" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  problemArea!: string;

  @ApiPropertyOptional({
    example: "Periodic Test 2 score: 42%, Homework submission 54%",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  evidence?: string;

  @ApiProperty({
    example:
      "Achieve 70%+ mastery on Real Numbers and Quadratics in next assessment",
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  goal!: string;

  @ApiProperty({
    example:
      "Daily 30-min zero period remedial practice + peer mentor assigned",
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  interventionStrategy!: string;

  @ApiProperty({ example: "Rahul Sharma" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  responsibleTeacherName!: string;

  @ApiPropertyOptional({ example: "00000000-0000-0000-0000-000000000000" })
  @IsOptional()
  @IsUUID()
  responsibleTeacherId?: string;

  @ApiProperty({ example: "2026-11-20" })
  @IsDateString()
  reviewDate!: string;

  @ApiPropertyOptional({ example: "Algebra fluency restoration" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  expectedOutcome?: string;

  @ApiPropertyOptional({ example: "Active" })
  @IsOptional()
  @IsIn(["Planned", "Active", "Monitoring", "Improved", "Closed"])
  status?: string;
}

export class CreateRemedialProgramDto {
  @ApiProperty({ example: "Class 10 Mathematics Booster Camp" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiProperty({ example: "Mathematics" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subjectName!: string;

  @ApiProperty({ example: "Class 10" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  className!: string;

  @ApiProperty({ example: "Rahul Sharma" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  assignedTeacherName!: string;

  @ApiProperty({ example: "Mon, Wed, Fri 07:30 - 08:15 AM" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  schedule!: string;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  @Min(1)
  enrolledStudentCount?: number;

  @ApiPropertyOptional({ example: "Algebra, Coordinate Geometry" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  targetCompetency?: string;
}

export class CreateEnrichmentProgramDto {
  @ApiProperty({ example: "Science Olympiad & Research Scholars" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({ example: "Science Olympiad" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiProperty({ example: "Dr. Anita Desai" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  assignedMentorName!: string;

  @ApiProperty({ example: "Tue, Thu 03:30 - 04:45 PM" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  schedule!: string;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsInt()
  @Min(1)
  enrolledStudentCount?: number;
}

// 6. Communication & Alerts DTOs
export class ResolveParentQueryDto {
  @ApiProperty({ example: "investigating" })
  @IsIn(["open", "investigating", "assigned", "resolved", "closed"])
  status!: string;

  @ApiPropertyOptional({
    example: "HOD Science scheduled one-on-one session with parent on Friday.",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class CreateAcademicAnnouncementDto {
  @ApiProperty({ example: "Term 1 Question Paper Review Cycle Guidelines" })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example:
      "All department heads must submit finalized question blueprints by October 25.",
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ example: "teachers" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional({ example: "high" })
  @IsOptional()
  @IsIn(["low", "normal", "high", "urgent"])
  priority?: string;
}

export class ResolveAcademicAlertDto {
  @ApiProperty({ example: "resolved" })
  @IsIn(["open", "investigating", "action_assigned", "resolved"])
  status!: string;

  @ApiPropertyOptional({
    example: "Action plan created and remedial sessions allocated.",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class UpdateClassTeacherDto {
  @ApiPropertyOptional({
    example: "d3b07384-d113-4944-9c88-c75c87901001",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  teacherUserId?: string | null;
}

export class AllocateSectionSubjectDto {
  @ApiPropertyOptional({
    example: "d3b07384-d113-4944-9c88-c75c87901001",
    description: "Existing subject ID to map to this section",
  })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({
    example: "d3b07384-d113-4944-9c88-c75c87901002",
    description: "Faculty teacher user ID assigned to teach this subject",
  })
  @IsOptional()
  @IsUUID()
  teacherUserId?: string | null;

  @ApiPropertyOptional({
    example: "Robotics & AI",
    description: "New subject name if creating inline",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  newSubjectName?: string;

  @ApiPropertyOptional({
    example: "ROB",
    description: "New subject code if creating inline",
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(32)
  newSubjectCode?: string;
}

export class PrincipalReviewLeaveDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'Approved' })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
