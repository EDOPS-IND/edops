import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

export const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class AcademicYearDto {
  @ApiProperty({ maxLength: 120 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiProperty({ format: 'date' }) @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) startDate!: string;
  @ApiProperty({ format: 'date' }) @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) endDate!: string;
  @ApiPropertyOptional({ default: false }) @ValidateIf((_object, value) => value !== undefined) @IsBoolean() isCurrent?: boolean;
}
export class UpdateAcademicYearDto extends PartialType(AcademicYearDto, { skipNullProperties: false }) {}

export class ProgramDto {
  @ApiProperty({ maxLength: 120 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiPropertyOptional({ default: 0 }) @ValidateIf((_object, value) => value !== undefined) @IsInt() @Min(0) @Max(10000) sequenceOrder?: number;
}
export class UpdateProgramDto extends PartialType(ProgramDto, { skipNullProperties: false }) {}

export class SubjectDto {
  @ApiProperty({ maxLength: 120 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiProperty({ maxLength: 32 }) @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @IsString() @Matches(/^[A-Z0-9][A-Z0-9_-]*$/) @MaxLength(32) code!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isElective?: boolean;
}
export class UpdateSubjectDto extends PartialType(SubjectDto, { skipNullProperties: false }) {}

export class SectionDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() academicYearId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() programId!: string;
  @ApiProperty({ maxLength: 120 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiProperty({ minimum: 1, maximum: 5000 }) @IsInt() @Min(1) @Max(5000) capacity!: number;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() classTeacherUserId?: string;
}
export class UpdateSectionDto extends PartialType(PickType(SectionDto, ['name', 'capacity', 'classTeacherUserId']), { skipNullProperties: false }) {}

export class TeacherAssignmentDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() sectionId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() teacherUserId!: string;
}
export class UpdateTeacherAssignmentDto extends PickType(TeacherAssignmentDto, ['teacherUserId']) {}

export class EnrollmentDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() studentUserId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() sectionId!: string;
  @ApiProperty({ maxLength: 32 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(32) rollNumber!: string;
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

export class BatchPromotionDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() sourceSectionId!: string;
  @ApiPropertyOptional({ format: 'uuid' }) @ValidateIf((_object, value) => value !== undefined) @IsUUID() targetSectionId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @ValidateIf((_object, value) => value !== undefined) @IsUUID() targetAcademicYearId?: string;
  @ApiProperty({ enum: ['promote', 'graduate'] }) @IsString() action!: 'promote' | 'graduate';
  @ApiProperty({ type: [String] }) @IsString({ each: true }) studentUserIds!: string[];
}
