import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, IsTimeZone, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { normalizeEmail } from '../auth/auth.dto';
import { OrganizationStatus } from './tenant.entity';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const supplied = (_object: unknown, value: unknown) => value !== undefined;

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Example School', minLength: 1, maxLength: 120, description: 'School display name; trimmed, cannot be blank.' })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'example-school', maxLength: 63, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', description: 'Unique lowercase slug. No spaces, underscores or leading/trailing hyphen. Cannot be changed through current settings APIs.' })
  @IsString() @MaxLength(63) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @ApiProperty({ example: 'admin@school.example', format: 'email', maxLength: 254, description: 'First school administrator email; trimmed and lowercased. May belong to an existing account.' })
  @Transform(normalizeEmail) @IsEmail() @MaxLength(254)
  adminEmail!: string;

  @ApiPropertyOptional({ default: 'Asia/Kolkata', example: 'Asia/Kolkata', maxLength: 100, description: 'Valid IANA timezone, for example Asia/Kolkata or UTC.' })
  @IsString() @IsTimeZone() @MaxLength(100)
  timeZone: string = 'Asia/Kolkata';

  @ApiPropertyOptional({ enum: ['en-IN', 'hi-IN', 'en-US'], default: 'en-IN' })
  @IsIn(['en-IN', 'hi-IN', 'en-US'])
  locale: string = 'en-IN';
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Updated School Name', minLength: 1, maxLength: 120, description: 'Trimmed display name. Omit to preserve the current value; null is not accepted.' })
  @ValidateIf(supplied) @Transform(trim) @IsString() @MinLength(1) @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata', maxLength: 100, description: 'Valid IANA timezone. Omit to preserve the current value; null is not accepted.' })
  @ValidateIf(supplied) @IsString() @IsTimeZone() @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional({ enum: ['en-IN', 'hi-IN', 'en-US'] })
  @ValidateIf(supplied) @IsIn(['en-IN', 'hi-IN', 'en-US'])
  locale?: string;
}

export class OrganizationStatusDto {
  @ApiProperty({ enum: ['active', 'suspended'] })
  @IsIn(['active', 'suspended'])
  status!: OrganizationStatus;
}

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Single-use invitation token supplied by your platform administrator. The example is not a real invite.', pattern: '^[a-f0-9]{64}$', example: 'a'.repeat(64), writeOnly: true })
  @IsString() @Matches(/^[a-f0-9]{64}$/)
  token!: string;

  @ApiPropertyOptional({ format: 'password', minLength: 12, maxLength: 128, description: 'Required for a new account. Existing users must sign in and omit this field.', writeOnly: true })
  @ValidateIf(supplied) @IsString() @MinLength(12) @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ example: 'Mathematics', maxLength: 100, description: 'Subject specialty when accepting invitation as teacher.' })
  @ValidateIf(supplied) @Transform(trim) @IsString() @MaxLength(100)
  specialty?: string;

  @ApiPropertyOptional({ example: '+919876543210', maxLength: 32, description: 'Phone number when onboarding.' })
  @ValidateIf(supplied) @Transform(trim) @IsString() @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma', maxLength: 120, description: 'Full name when onboarding.' })
  @ValidateIf(supplied) @Transform(trim) @IsString() @MaxLength(120)
  name?: string;
}
