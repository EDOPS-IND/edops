import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export abstract class AcademicRecord {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
}

export class AcademicYear extends AcademicRecord {
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'date' }) startDate!: string;
  @ApiProperty({ format: 'date' }) endDate!: string;
  @ApiProperty() isCurrent!: boolean;
}

export class Program extends AcademicRecord {
  @ApiProperty() name!: string;
  @ApiProperty() sequenceOrder!: number;
}

export class Subject extends AcademicRecord {
  @ApiProperty() name!: string;
  @ApiProperty() code!: string;
}

export class Section extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) academicYearId!: string;
  @ApiProperty({ format: 'uuid' }) programId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() capacity!: number;
  @ApiPropertyOptional({ format: 'uuid' }) classTeacherUserId?: string | null;
}

export class ClassSubjectAssignment extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) sectionId!: string;
  @ApiProperty({ format: 'uuid' }) subjectId!: string;
  @ApiProperty({ format: 'uuid' }) teacherUserId!: string;
}

export class Enrollment extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) studentUserId!: string;
  @ApiProperty({ format: 'uuid' }) sectionId!: string;
  @ApiProperty({ format: 'uuid' }) academicYearId!: string;
  @ApiProperty() rollNumber!: string;
  @ApiProperty({ enum: ['active', 'transferred', 'withdrawn'] }) status!: 'active' | 'transferred' | 'withdrawn';
}
