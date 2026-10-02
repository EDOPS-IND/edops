import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsInt, IsObject, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { trim } from '../academics/academic.dto';
import { AssignmentQuery } from '../assignments/teaching.dto';

export class ArenaOption {
  @ApiProperty({ example: 'a' }) @Matches(/^[a-z0-9_-]{1,16}$/) id!: string;
  @ApiProperty({ maxLength: 500 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(500) text!: string;
}
export class ArenaContent {
  @ApiProperty({ maxLength: 4000, description: 'Plain text. Render as text, never trusted HTML.' }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(4000) prompt!: string;
  @ApiPropertyOptional({ type: [ArenaOption], minItems: 2, maxItems: 8 })
  @ValidateIf((o) => o?.options !== undefined && o?.options !== null)
  @IsArray() @ArrayMaxSize(8) @ArrayUnique((o: ArenaOption | null) => o?.id)
  @ValidateNested({ each: true }) @Type(() => ArenaOption) options?: ArenaOption[];
  @ApiPropertyOptional({ maxLength: 4000 })
  @ValidateIf((_o, v) => v !== undefined) @Transform(trim) @IsString() @MaxLength(4000) modelAnswer?: string;
  @ApiPropertyOptional({ maxLength: 2000 })
  @ValidateIf((_o, v) => v !== undefined) @Transform(trim) @IsString() @MaxLength(2000) rubric?: string;
}
export class ArenaQuestionDto {
  @ApiPropertyOptional({ format: 'uuid' }) @ValidateIf((_o, v) => v !== undefined) @IsUUID() programId?: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() sectionId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string;
  @ApiPropertyOptional({ maxLength: 100 }) @ValidateIf((_o, v) => v !== undefined) @Transform(trim) @IsString() @MaxLength(100) chapter?: string;
  @ApiProperty({ maxLength: 100 }) @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) topic!: string;
  @ApiProperty({ enum: ['easy','medium','hard'] }) @IsIn(['easy','medium','hard']) difficulty!: string;
  @ApiProperty({ enum: ['single_choice','multiple_choice','subjective'] }) @IsIn(['single_choice','multiple_choice','subjective']) questionType!: string;
  @ApiProperty({ type: ArenaContent }) @IsObject() @ValidateNested() @Type(() => ArenaContent) content!: ArenaContent;
  @ApiProperty({ type: [String], description: 'Correct option IDs; exactly one for single_choice. Never returned in student question responses.' })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(8) answerKey!: string[];
  @ApiProperty({ type: [String], maxItems: 10 }) @IsArray() @ArrayMaxSize(10) @ArrayUnique()
  @IsString({ each: true }) @MinLength(1, { each: true }) @MaxLength(32, { each: true }) tags!: string[];
  @ApiProperty({ minimum: 1, maximum: 100 }) @IsInt() @Min(1) @Max(100) maxScore!: number;
}
export class UpdateArenaQuestionDto extends PartialType(PickType(ArenaQuestionDto, ['chapter','topic','difficulty','questionType','content','answerKey','tags','maxScore']), { skipNullProperties: false }) {}
export class ArenaAttemptDto {
  @ApiProperty({ type: [String], minItems: 1, maxItems: 8, description: 'Selected option IDs or written response string. Score and student identity are server-controlled.' })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(8) selectedOptionIds!: string[];
}
export class ArenaQuery extends AssignmentQuery {
  @ApiPropertyOptional({ format: 'uuid' }) @ValidateIf((_o, v) => v !== undefined) @IsUUID() programId?: string;
  @ApiPropertyOptional({ enum: ['draft','published','archived'] }) @ValidateIf((_o,v) => v !== undefined) @IsIn(['draft','published','archived']) status?: string;
  @ApiPropertyOptional({ enum: ['easy','medium','hard'] }) @ValidateIf((_o,v) => v !== undefined) @IsIn(['easy','medium','hard']) difficulty?: string;
  @ApiPropertyOptional() @ValidateIf((_o,v) => v !== undefined) @IsString() @MinLength(1) @MaxLength(100) chapter?: string;
  @ApiPropertyOptional() @ValidateIf((_o,v) => v !== undefined) @IsString() @MinLength(1) @MaxLength(100) topic?: string;
  @ApiPropertyOptional() @ValidateIf((_o,v) => v !== undefined) @IsString() @MinLength(1) @MaxLength(32) tag?: string;
}
