import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsIn, IsInt, IsNumber, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { AcademicListDto, trim } from '../academics/academic.dto';

export class ClassQuery extends AcademicListDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() sectionId!: string;
  @ApiPropertyOptional({ format: 'uuid', description: 'Omit for whole-class attendance; teachers must specify an assigned subject.' })
  @ValidateIf((_object, value) => value !== undefined) @IsUUID() subjectId?: string;
}
export class AssignmentQuery extends AcademicListDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() sectionId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string;
}
export class AssignmentDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() sectionId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string;
  @ApiProperty({ example: 'Linear equations', maxLength: 200 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(200) title!: string;
  @ApiPropertyOptional({ default: '', maxLength: 8000 }) @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(8000) description?: string;
  @ApiProperty({ example: '2026-10-01T12:00:00+05:30', format: 'date-time' })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/) @IsDateString({ strict: true }) dueAt!: string;
  @ApiProperty({ example: 100, minimum: 0.01, maximum: 10000 }) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(10000) maxScore!: number;
}
export class UpdateAssignmentDto extends PartialType(PickType(AssignmentDto, ['title', 'description', 'dueAt', 'maxScore']), { skipNullProperties: false }) {}
export class SubmitDto {
  @ApiProperty({ example: 'My solution...', maxLength: 8000, description: 'Plain text only; no attachment upload or URL fetching.' })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(8000) content!: string;
}
export class GradeDto {
  @ApiProperty({ example: 85, minimum: 0, maximum: 10000 }) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(10000) score!: number;
  @ApiPropertyOptional({ maxLength: 4000 }) @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(4000) feedback?: string;
}
export class AttendanceDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() sectionId!: string;
  @ApiPropertyOptional({ format: 'uuid', description: 'Omit for school-admin-only whole-class attendance.' })
  @ValidateIf((_object, value) => value !== undefined) @IsUUID() subjectId?: string;
  @ApiProperty({ example: '2026-09-10', format: 'date' }) @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) date!: string;
  @ApiProperty({ example: 1, minimum: 1, maximum: 20 }) @IsInt() @Min(1) @Max(20) period!: number;
}
export class AttendanceMarkDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() studentId!: string;
  @ApiProperty({ enum: ['present', 'absent', 'late', 'excused'] }) @IsIn(['present', 'absent', 'late', 'excused']) status!: 'present' | 'absent' | 'late' | 'excused';
}
export class AttendanceMarksDto {
  @ApiProperty({ type: [AttendanceMarkDto], minItems: 1, maxItems: 100 })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100)
  @ArrayUnique((row: AttendanceMarkDto | null) => typeof row?.studentId === 'string' ? row.studentId.toLowerCase() : undefined)
  @ValidateNested({ each: true }) @Type(() => AttendanceMarkDto) records!: AttendanceMarkDto[];
}
export class EmptyActionDto {}
