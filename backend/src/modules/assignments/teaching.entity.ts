import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';
import { AcademicRecord } from '../academics/academic.entity';

@Entity('assignments')
export class Assignment extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'section_id', type: 'uuid' }) sectionId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'subject_id', type: 'uuid' }) subjectId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @ApiProperty() @Column({ type: 'varchar', length: 200 }) title!: string;
  @ApiProperty() @Column({ type: 'varchar', length: 8000, default: '' }) description!: string;
  @ApiProperty({ format: 'date-time' }) @Column({ name: 'due_at', type: 'timestamptz' }) dueAt!: Date;
  @ApiProperty() @Column({ name: 'max_score', type: 'double precision' }) maxScore!: number;
  @ApiProperty({ enum: ['draft', 'published'] }) @Column({ type: 'varchar', length: 16, default: 'draft' }) status!: 'draft' | 'published';
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) @Column({ name: 'published_at', type: 'timestamptz', nullable: true }) publishedAt!: Date | null;
}

@Entity('submissions')
export class Submission extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'assignment_id', type: 'uuid' }) assignmentId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'student_id', type: 'uuid' }) studentId!: string;
  @ApiProperty({ type: String, nullable: true }) @Column({ type: 'varchar', length: 8000, nullable: true }) content!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true }) submittedAt!: Date | null;
  @ApiProperty({ type: Number, nullable: true }) @Column({ type: 'double precision', nullable: true }) score!: number | null;
  @ApiProperty({ type: String, nullable: true }) @Column({ type: 'varchar', length: 4000, nullable: true }) feedback!: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) @Column({ name: 'graded_by', type: 'uuid', nullable: true }) gradedBy!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) @Column({ name: 'graded_at', type: 'timestamptz', nullable: true }) gradedAt!: Date | null;
  @ApiProperty({ enum: ['pending', 'submitted', 'late', 'graded'] }) @Column({ type: 'varchar', length: 16, default: 'pending' }) status!: 'pending' | 'submitted' | 'late' | 'graded';
}

@Entity('attendance_sessions')
export class AttendanceSession extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'section_id', type: 'uuid' }) sectionId!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) @Column({ name: 'subject_id', type: 'uuid', nullable: true }) subjectId!: string | null;
  @ApiProperty({ format: 'date' }) @Column({ type: 'date' }) date!: string;
  @ApiProperty() @Column({ type: 'smallint' }) period!: number;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'taken_by', type: 'uuid' }) takenBy!: string;
  @ApiProperty({ enum: ['draft', 'finalized'] }) @Column({ type: 'varchar', length: 16, default: 'draft' }) status!: 'draft' | 'finalized';
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) @Column({ name: 'finalized_at', type: 'timestamptz', nullable: true }) finalizedAt!: Date | null;
}
