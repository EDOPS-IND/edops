import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export abstract class AcademicRecord {
  @ApiProperty({ format: 'uuid' }) @PrimaryGeneratedColumn('uuid') id!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'organization_id', type: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'date-time' }) @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

@Entity('academic_years')
export class AcademicYear extends AcademicRecord {
  @ApiProperty() @Column({ type: 'varchar', length: 120 }) name!: string;
  @ApiProperty({ format: 'date' }) @Column({ name: 'start_date', type: 'date' }) startDate!: string;
  @ApiProperty({ format: 'date' }) @Column({ name: 'end_date', type: 'date' }) endDate!: string;
  @ApiProperty() @Column({ name: 'is_current', type: 'boolean', default: false }) isCurrent!: boolean;
}

@Entity('programs')
export class Program extends AcademicRecord {
  @ApiProperty() @Column({ type: 'varchar', length: 120 }) name!: string;
  @ApiProperty() @Column({ name: 'sequence_order', type: 'integer', default: 0 }) sequenceOrder!: number;
}

@Entity('subjects')
export class Subject extends AcademicRecord {
  @ApiProperty() @Column({ type: 'varchar', length: 120 }) name!: string;
  @ApiProperty() @Column({ type: 'varchar', length: 32 }) code!: string;
}

@Entity('sections')
export class Section extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'academic_year_id', type: 'uuid' }) academicYearId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'program_id', type: 'uuid' }) programId!: string;
  @ApiProperty() @Column({ type: 'varchar', length: 120 }) name!: string;
  @ApiProperty() @Column({ type: 'integer' }) capacity!: number;
}

@Entity('class_subject_assignments')
export class ClassSubjectAssignment extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'section_id', type: 'uuid' }) sectionId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'subject_id', type: 'uuid' }) subjectId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'teacher_user_id', type: 'uuid' }) teacherUserId!: string;
}

@Entity('enrollments')
export class Enrollment extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'student_user_id', type: 'uuid' }) studentUserId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'section_id', type: 'uuid' }) sectionId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'academic_year_id', type: 'uuid' }) academicYearId!: string;
  @ApiProperty() @Column({ name: 'roll_number', type: 'varchar', length: 32 }) rollNumber!: string;
  @ApiProperty({ enum: ['active', 'transferred', 'withdrawn'] }) @Column({ type: 'varchar', length: 16, default: 'active' }) status!: 'active' | 'transferred' | 'withdrawn';
}
