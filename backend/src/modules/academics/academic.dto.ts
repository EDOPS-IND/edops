import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

export const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class AcademicYearDto {
  @ApiProperty({ example: '2026-27', maxLength: 120 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiProperty({ example: '2026-06-01', format: 'date' }) @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) startDate!: string;
  @ApiProperty({ example: '2027-04-30', format: 'date' }) @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) endDate!: string;
  @ApiPropertyOptional({ default: false }) @ValidateIf((_object, value) => value !== undefined) @IsBoolean() isCurrent?: boolean;
}
export class UpdateAcademicYearDto extends PartialType(AcademicYearDto, { skipNullProperties: false }) {}

export class ProgramDto {
  @ApiProperty({ example: 'Grade 10' }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiPropertyOptional({ default: 0 }) @ValidateIf((_object, value) => value !== undefined) @IsInt() @Min(0) @Max(10000) sequenceOrder?: number;
}
export class UpdateProgramDto extends PartialType(ProgramDto, { skipNullProperties: false }) {}

export class SubjectDto {
  @ApiProperty({ example: 'Mathematics' }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiProperty({ example: 'MATH', maxLength: 32 }) @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @IsString() @Matches(/^[A-Z0-9][A-Z0-9_-]*$/) @MaxLength(32) code!: string;
}
export class UpdateSubjectDto extends PartialType(SubjectDto, { skipNullProperties: false }) {}

export class SectionDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() academicYearId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() programId!: string;
  @ApiProperty({ example: '10-A' }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiProperty({ example: 40, minimum: 1, maximum: 5000 }) @IsInt() @Min(1) @Max(5000) capacity!: number;
}
export class UpdateSectionDto extends PartialType(PickType(SectionDto, ['name', 'capacity']), { skipNullProperties: false }) {}

export class TeacherAssignmentDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() sectionId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() teacherUserId!: string;
}
export class UpdateTeacherAssignmentDto extends PickType(TeacherAssignmentDto, ['teacherUserId']) {}

export class EnrollmentDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() studentUserId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() sectionId!: string;
  @ApiProperty({ example: '01', maxLength: 32 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(32) rollNumber!: string;
}
export class TransferEnrollmentDto extends PickType(EnrollmentDto, ['sectionId', 'rollNumber']) {}
export class UpdateEnrollmentDto extends PickType(EnrollmentDto, ['rollNumber']) {}

export class AcademicListDto {
  @ApiPropertyOptional({ default: 50, maximum: 100 }) @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 50;
  @ApiPropertyOptional({ default: 0 }) @Type(() => Number) @IsInt() @Min(0) @Max(100000) offset: number = 0;
}
export class SectionListDto extends AcademicListDto {
  @ApiPropertyOptional({ format: 'uuid' }) @ValidateIf((_object, value) => value !== undefined) @IsUUID() academicYearId?: string;
}
export class SectionResourceListDto extends AcademicListDto {
  @ApiPropertyOptional({ format: 'uuid' }) @ValidateIf((_object, value) => value !== undefined) @IsUUID() sectionId?: string;
}
