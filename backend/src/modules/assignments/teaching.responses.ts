import { ApiProperty } from '@nestjs/swagger';

export class TeachingClass {
  @ApiProperty({ format: 'uuid' }) sectionId!: string;
  @ApiProperty() sectionName!: string;
  @ApiProperty({ format: 'uuid' }) academicYearId!: string;
  @ApiProperty({ format: 'uuid' }) subjectId!: string;
  @ApiProperty() subjectName!: string;
  @ApiProperty({ format: 'uuid' }) teacherUserId!: string;
}
export class RosterStudent {
  @ApiProperty({ format: 'uuid' }) studentId!: string;
  @ApiProperty() rollNumber!: string;
  @ApiProperty({ format: 'email' }) email!: string;
}
export class AttendanceRecord {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) attendanceSessionId!: string;
  @ApiProperty({ format: 'uuid' }) studentId!: string;
  @ApiProperty({ type: String, enum: ['present', 'absent', 'late', 'excused'], nullable: true, description: 'Null means not yet marked in a draft session.' }) status!: string | null;
}
export class Scorecard {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) studentId!: string;
  @ApiProperty({ format: 'uuid' }) sectionId!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) subjectId!: string | null;
  @ApiProperty({ enum: ['academic_year'] }) term!: string;
  @ApiProperty() assignmentCount!: number;
  @ApiProperty() submittedCount!: number;
  @ApiProperty() gradedCount!: number;
  @ApiProperty({ type: Number, nullable: true, description: 'Mean graded-assignment percentage, not raw points. Null before grading.' }) avgScore!: number | null;
  @ApiProperty({ type: Number, nullable: true }) completionPct!: number | null;
  @ApiProperty({ description: 'Finalized records excluding excused.' }) attendanceCount!: number;
  @ApiProperty({ description: 'Present plus late.' }) attendedCount!: number;
  @ApiProperty({ type: Number, nullable: true }) attendancePct!: number | null;
  @ApiProperty() arenaAttemptCount!: number;
  @ApiProperty({ description: 'Distinct attempted questions, including archived questions.' }) arenaQuestionCount!: number;
  @ApiProperty({ type: Number, nullable: true, description: 'Mean best-attempt percentage per attempted question, not an exam grade. Null before practice.' }) arenaScore!: number | null;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
}
