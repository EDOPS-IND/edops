import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsString, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { normalizeEmail } from '../auth/auth.dto';
import { AcademicListDto } from '../academics/academic.dto';

export class MemberInvitationDto {
  @ApiProperty({ format: 'email', example: 'principal@school.example', maxLength: 254 }) @Transform(normalizeEmail) @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty({ enum: ['principal', 'teacher', 'student', 'staff', 'parent'] }) @IsIn(['principal', 'teacher', 'student', 'staff', 'parent']) role!: 'principal' | 'teacher' | 'student' | 'staff' | 'parent';
  @ApiPropertyOptional({ example: 'Rahul Sharma', maxLength: 120 }) @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(120) name?: string;
  @ApiPropertyOptional({ example: '+91 98765 43210', maxLength: 32 }) @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(32) phone?: string;
  @ApiPropertyOptional({ example: 'Mathematics', maxLength: 100 }) @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(100) specialty?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @ValidateIf((_object, value) => value !== undefined) @IsString() sectionId?: string;
  @ApiPropertyOptional({ type: [String] }) @ValidateIf((_object, value) => value !== undefined) @IsArray() childStudentIds?: string[];
  @ApiPropertyOptional({ example: 'EMP-1042', maxLength: 50 }) @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(50) employeeId?: string;
  @ApiPropertyOptional({ example: 'Regular Faculty', maxLength: 50 }) @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(50) employmentType?: string;
}

export class BulkInvitationsDto {
  @ApiProperty({ type: [MemberInvitationDto], minItems: 1, maxItems: 100 })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => MemberInvitationDto)
  records!: MemberInvitationDto[];
}

export class CsvInvitationsDto {
  @ApiProperty({ example: 'email,role\nteacher@school.example,teacher\nstudent@school.example,student', maxLength: 12000,
    description: 'UTF-8 CSV text inside JSON, exact email,role headers; 1-100 rows. Not multipart upload.' })
  @IsString() @MinLength(1) @MaxLength(12000) csv!: string;
}

export class MembershipStatusDto {
  @ApiProperty({ enum: ['active', 'inactive'] }) @IsIn(['active', 'inactive']) status!: 'active' | 'inactive';
}

export class MemberListDto extends AcademicListDto {
  @ApiPropertyOptional({ enum: ['principal', 'teacher', 'student'] }) @ValidateIf((_object, value) => value !== undefined)
  @IsIn(['principal', 'teacher', 'student']) role?: 'principal' | 'teacher' | 'student';
}

export class InvitationResult {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ enum: ['teacher', 'student'] }) role!: string;
  @ApiProperty({ description: 'Secret for private delivery; available again only through the same idempotent creation replay.' }) token!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
}
export class InvitationBatchResult {
  @ApiProperty({ format: 'uuid' }) batchId!: string;
  @ApiProperty({ type: [InvitationResult] }) invitations!: InvitationResult[];
}
export class BatchSummary {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty() count!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}
export class InvitationStatus {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ enum: ['teacher', 'student'] }) role!: string;
  @ApiProperty({ enum: ['pending', 'accepted', 'revoked', 'expired'] }) status!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) acceptedAt!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) revokedAt!: string | null;
}
export class BatchStatus {
  @ApiProperty({ format: 'uuid' }) batchId!: string;
  @ApiProperty({ type: [InvitationStatus] }) invitations!: InvitationStatus[];
}
export class RevokedInvitation {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['revoked'] }) status!: string;
}
export class MemberStatus {
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ enum: ['teacher', 'student'] }) role!: string;
  @ApiProperty({ enum: ['active', 'inactive'] }) status!: string;
}
export class MemberSummary extends MemberStatus {
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty() accountActive!: boolean;
}
