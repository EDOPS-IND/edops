import { ApiProperty } from '@nestjs/swagger';
import { AcademicRecord } from '../academics/academic.entity';

export class Assignment extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) sectionId!: string;
  @ApiProperty({ format: 'uuid' }) subjectId!: string;
  @ApiProperty({ format: 'uuid' }) createdBy!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ format: 'date-time' }) dueAt!: Date;
  @ApiProperty() maxScore!: number;
  @ApiProperty({ enum: ['draft', 'published'] }) status!: 'draft' | 'published';
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) publishedAt!: Date | null;
}

export class Submission extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) assignmentId!: string;
  @ApiProperty({ format: 'uuid' }) studentId!: string;
  @ApiProperty({ type: String, nullable: true }) content!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) submittedAt!: Date | null;
  @ApiProperty({ type: Number, nullable: true }) score!: number | null;
  @ApiProperty({ type: String, nullable: true }) feedback!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) gradedBy!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) gradedAt!: Date | null;
  @ApiProperty({ enum: ['pending', 'submitted', 'late', 'graded'] }) status!: 'pending' | 'submitted' | 'late' | 'graded';
}

export class AttendanceSession extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) sectionId!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) subjectId!: string | null;
  @ApiProperty({ format: 'date' }) date!: string;
  @ApiProperty() period!: number;
  @ApiProperty({ format: 'uuid' }) takenBy!: string;
  @ApiProperty({ enum: ['draft', 'finalized'] }) status!: 'draft' | 'finalized';
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) finalizedAt!: Date | null;
}

export class ExamEvaluation extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) sectionId!: string;
  @ApiProperty({ format: 'uuid' }) subjectId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() maxMarks!: number;
  @ApiProperty() weightage!: number;
  @ApiProperty() studentScores!: Record<string, number>;
}

