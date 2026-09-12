import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';
import { AcademicRecord } from '../academics/academic.entity';
import { ArenaContent } from './arena.dto';

@Entity('arena_questions')
export class ArenaQuestion extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'section_id', type: 'uuid' }) sectionId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'subject_id', type: 'uuid' }) subjectId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @ApiProperty() @Column({ type: 'varchar' }) topic!: string;
  @ApiProperty({ enum: ['easy','medium','hard'] }) @Column({ type: 'varchar' }) difficulty!: string;
  @ApiProperty({ enum: ['single_choice','multiple_choice'] }) @Column({ name: 'question_type', type: 'varchar' }) questionType!: string;
  @ApiProperty({ type: ArenaContent }) @Column({ type: 'jsonb' }) content!: ArenaContent;
  @ApiHideProperty() @Column({ name: 'answer_key', type: 'jsonb', select: false }) answerKey!: string[];
  @ApiProperty({ type: [String] }) @Column({ type: 'text', array: true }) tags!: string[];
  @ApiProperty() @Column({ name: 'max_score', type: 'integer' }) maxScore!: number;
  @ApiProperty({ enum: ['draft','published','archived'] }) @Column({ type: 'varchar', default: 'draft' }) status!: string;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) @Column({ name: 'published_at', type: 'timestamptz', nullable: true }) publishedAt!: Date | null;
}
export function questionView(row: ArenaQuestion) {
  const { answerKey: _secret, ...view } = row;
  return view;
}
@Entity('arena_attempts')
export class ArenaAttempt extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'question_id', type: 'uuid' }) questionId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'student_id', type: 'uuid' }) studentId!: string;
  @ApiProperty({ type: [String] }) @Column({ name: 'submitted_answer', type: 'jsonb' }) submittedAnswer!: string[];
  @ApiProperty() @Column({ name: 'is_correct', type: 'boolean' }) isCorrect!: boolean;
  @ApiProperty() @Column({ type: 'integer' }) score!: number;
  @ApiProperty() @Column({ name: 'max_score', type: 'integer' }) maxScore!: number;
}
