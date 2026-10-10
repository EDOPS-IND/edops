import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { AcademicRecord } from '../academics/academic.entity';
import { ArenaContent } from './arena.dto';

export class ArenaQuestion extends AcademicRecord {
  @ApiProperty({ format: 'uuid', nullable: true }) programId!: string | null;
  @ApiProperty({ format: 'uuid' }) sectionId!: string;
  @ApiProperty({ format: 'uuid' }) subjectId!: string;
  @ApiProperty({ format: 'uuid' }) createdBy!: string;
  @ApiProperty() chapter!: string;
  @ApiProperty() topic!: string;
  @ApiProperty({ enum: ['easy','medium','hard'] }) difficulty!: string;
  @ApiProperty({ enum: ['single_choice','multiple_choice','subjective'] }) questionType!: string;
  @ApiProperty({ type: ArenaContent }) content!: ArenaContent;
  @ApiHideProperty() answerKey!: string[];
  @ApiProperty({ type: [String] }) tags!: string[];
  @ApiProperty() maxScore!: number;
  @ApiProperty({ enum: ['draft','published','archived'] }) status!: string;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) publishedAt!: Date | null;
}
export function questionView(row: ArenaQuestion) {
  const { answerKey: _secret, ...view } = row;
  return view;
}

export class ArenaAttempt extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) questionId!: string;
  @ApiProperty({ format: 'uuid' }) studentId!: string;
  @ApiProperty({ type: [String] }) submittedAnswer!: string[];
  @ApiProperty() isCorrect!: boolean;
  @ApiProperty() score!: number;
  @ApiProperty() maxScore!: number;
}
