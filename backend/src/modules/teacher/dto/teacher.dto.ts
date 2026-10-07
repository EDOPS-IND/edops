import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuickAttendanceRecordDto {
  @ApiProperty({ description: 'Student ID or UUID' })
  @IsString()
  studentId!: string;

  @ApiProperty({ enum: ['present', 'absent', 'late', 'excused'] })
  @IsIn(['present', 'absent', 'late', 'excused'])
  status!: 'present' | 'absent' | 'late' | 'excused';
}

export class QuickAttendanceDto {
  @ApiProperty({ description: 'Section ID or UUID' })
  @IsString()
  sectionId!: string;

  @ApiPropertyOptional({ description: 'Subject ID or UUID' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ example: '2026-10-06' })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(20)
  period!: number;

  @ApiProperty({ type: [QuickAttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuickAttendanceRecordDto)
  records!: QuickAttendanceRecordDto[];
}

export class CreateTeacherAssignmentDto {
  @ApiProperty({ example: 'Quadratic Equations Homework' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Solve exercises 4.1 to 4.3' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Section UUID or slug (e.g. sec-10a)' })
  @IsString()
  sectionId!: string;

  @ApiProperty({ description: 'Subject UUID or slug (e.g. sub-math)' })
  @IsString()
  subjectId!: string;

  @ApiProperty({ example: '2026-10-15T18:00:00Z' })
  @IsString()
  dueAt!: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxScore!: number;

  @ApiPropertyOptional({ example: 'Quadratic Equations' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ type: [String], description: 'Optional subset of student IDs' })
  @IsOptional()
  @IsArray()
  studentIds?: string[];
}

export class GradeSubmissionDto {
  @ApiProperty({ example: 18.5 })
  @IsNumber()
  @Min(0)
  score!: number;

  @ApiPropertyOptional({ example: 'Well formulated algebraic steps.' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ example: { conceptual: 4, calculation: 5 } })
  @IsOptional()
  rubricScore?: Record<string, number>;
}

export class RecordLessonDeliveryDto {
  @ApiProperty({ description: 'Section UUID or slug (e.g. sec-10a)' })
  @IsString()
  sectionId!: string;

  @ApiProperty({ description: 'Subject UUID or slug (e.g. sub-math)' })
  @IsString()
  subjectId!: string;

  @ApiPropertyOptional({ description: 'Lesson plan UUID or slug' })
  @IsOptional()
  @IsString()
  lessonPlanId?: string;

  @ApiProperty({ example: '2026-10-06' })
  @IsString()
  deliveryDate!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(20)
  periodNumber!: number;

  @ApiProperty({ example: 'Factorization method and completing the square.' })
  @IsString()
  @IsNotEmpty()
  topicsCovered!: string;

  @ApiProperty({ example: 90 })
  @IsInt()
  @Min(0)
  @Max(100)
  participationPct!: number;

  @ApiPropertyOptional({ example: 'Exercise 4.2 Q1 to Q5' })
  @IsOptional()
  @IsString()
  homeworkAssigned?: string;

  @ApiPropertyOptional({ example: 'Students need extra drill on sign changes.' })
  @IsOptional()
  @IsString()
  reflection?: string;
}

export class CreateStudyMaterialDto {
  @ApiProperty({ description: 'Section UUID or slug (e.g. sec-10a)' })
  @IsString()
  sectionId!: string;

  @ApiProperty({ description: 'Subject UUID or slug (e.g. sub-math)' })
  @IsString()
  subjectId!: string;

  @ApiPropertyOptional({ example: 'Unit 2: Algebra' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 'Chapter 4: Quadratic Equations' })
  @IsString()
  @IsNotEmpty()
  chapter!: string;

  @ApiProperty({ example: 'Formula derivation notes' })
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @ApiProperty({ example: 'Comprehensive Formula & Practice Sheet' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Handwritten solution guidelines' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['pdf', 'document', 'video', 'link', 'presentation', 'image'] })
  @IsIn(['pdf', 'document', 'video', 'link', 'presentation', 'image'])
  fileType!: 'pdf' | 'document' | 'video' | 'link' | 'presentation' | 'image';

  @ApiProperty({ example: 'https://cdn.school.edu/materials/quad-formula.pdf' })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}

export class CreateTeacherArenaQuestionDto {
  @ApiProperty({ description: 'Section UUID or slug (e.g. sec-10a)' })
  @IsString()
  sectionId!: string;

  @ApiProperty({ description: 'Subject UUID or slug (e.g. sub-math)' })
  @IsString()
  subjectId!: string;

  @ApiProperty({ example: 'What are the roots of x^2 - 5x + 6 = 0?' })
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @ApiProperty({
    type: 'array',
    example: [
      { id: 'opt_1', text: '2 and 3' },
      { id: 'opt_2', text: '-2 and -3' },
      { id: 'opt_3', text: '1 and 6' },
      { id: 'opt_4', text: '-1 and -6' },
    ],
  })
  @IsArray()
  options!: Array<{ id: string; text: string }>;

  @ApiProperty({ example: ['opt_1'] })
  @IsArray()
  answerKey!: string[];

  @ApiProperty({ example: 'Quadratic Equations' })
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @ApiPropertyOptional({ example: 'medium' })
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @ApiPropertyOptional({ example: 'single_choice' })
  @IsOptional()
  @IsIn(['single_choice', 'multiple_choice', 'true_false'])
  type?: 'single_choice' | 'multiple_choice' | 'true_false';

  @ApiPropertyOptional({ example: 'Roots are found by factoring (x-2)(x-3)=0' })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class SubmitStudentMarksRecordDto {
  @ApiProperty({ description: 'Student UUID or slug (e.g. std-1)' })
  @IsString()
  studentId!: string;

  @ApiProperty({ example: 45 })
  @IsNumber()
  @Min(0)
  score!: number;

  @ApiPropertyOptional({ example: 'Excellent conceptual accuracy' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SubmitAssessmentMarksDto {
  @ApiProperty({ description: 'Section UUID or slug (e.g. sec-10a)' })
  @IsString()
  sectionId!: string;

  @ApiProperty({ description: 'Subject UUID or slug (e.g. sub-math)' })
  @IsString()
  subjectId!: string;

  @ApiProperty({ example: 'Unit Test 2: Algebra' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(1)
  maxMarks!: number;

  @ApiProperty({ type: [SubmitStudentMarksRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitStudentMarksRecordDto)
  scores!: SubmitStudentMarksRecordDto[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  lockMarks?: boolean;
}

export class CreateTeacherInterventionDto {
  @ApiProperty({ description: 'Student UUID or slug (e.g. std-4)' })
  @IsString()
  studentId!: string;

  @ApiProperty({ description: 'Subject UUID or slug (e.g. sub-math)' })
  @IsString()
  subjectId!: string;

  @ApiProperty({ example: 'Quadratic equation factoring and sign rules' })
  @IsString()
  @IsNotEmpty()
  problemArea!: string;

  @ApiProperty({ example: 'Scored 42% on FA-2 with persistent algebraic errors' })
  @IsString()
  @IsNotEmpty()
  evidence!: string;

  @ApiProperty({ example: 'Raise competency mastery to >=75% by mid-term' })
  @IsString()
  @IsNotEmpty()
  goal!: string;

  @ApiProperty({ example: '3-week remedial bridge tutoring with weekly worksheets' })
  @IsString()
  @IsNotEmpty()
  recommendedAction!: string;

  @ApiProperty({
    enum: [
      'Remedial Practice',
      'Extra Class',
      'One-to-One Support',
      'Additional Assignment',
      'Parent Discussion',
      'Peer Support',
      'Revision',
      'Enrichment',
    ],
  })
  @IsIn([
    'Remedial Practice',
    'Extra Class',
    'One-to-One Support',
    'Additional Assignment',
    'Parent Discussion',
    'Peer Support',
    'Revision',
    'Enrichment',
  ])
  interventionType!: string;

  @ApiProperty({ example: '2026-10-25' })
  @IsString()
  @IsNotEmpty()
  reviewDate!: string;
}

export class UpdateTeacherTaskDto {
  @ApiProperty({ enum: ['pending', 'completed', 'snoozed'] })
  @IsIn(['pending', 'completed', 'snoozed'])
  status!: 'pending' | 'completed' | 'snoozed';
}

export class SendTeacherMessageDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  recipientId!: string;

  @ApiProperty({ enum: ['student', 'parent', 'principal', 'school_admin'] })
  @IsIn(['student', 'parent', 'principal', 'school_admin'])
  recipientRole!: 'student' | 'parent' | 'principal' | 'school_admin';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiProperty({ example: 'Regarding Mathematics Formative Assessment' })
  @IsString()
  @IsNotEmpty()
  subjectLine!: string;

  @ApiProperty({ example: 'Vikas has demonstrated commendable progress in trigonometry.' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ example: 'normal' })
  @IsOptional()
  @IsIn(['normal', 'urgent'])
  priority?: 'normal' | 'urgent';
}
