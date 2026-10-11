import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class LoginDto {
  @ApiProperty({
    example: "admin@school.example",
    format: "email",
    maxLength: 254,
    description:
      "Existing account email; trimmed and lowercased before lookup.",
  })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    format: "password",
    writeOnly: true,
    minLength: 1,
    maxLength: 128,
    description:
      "Existing password, not trimmed. New accounts use 12-128 characters; login accepts 1-128 for credential verification.",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ required: false, description: "Refresh token string" })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class LogoutDto {
  @ApiProperty({ required: false, description: "Refresh token string to revoke" })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class SwitchSchoolDto {
  @ApiProperty({ description: "School ID" })
  @IsString()
  schoolId!: string;
}

