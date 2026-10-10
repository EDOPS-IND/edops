import { ApiProperty, PartialType, PickType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { trim } from "../academics/academic.dto";

export class CreateRecordingDto {
  @ApiProperty({ format: "uuid" }) @IsUUID() sectionId!: string;
  @ApiProperty({ format: "uuid" }) @IsUUID() subjectId!: string;
  @ApiProperty({ example: "Quadratic equations", maxLength: 200 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;
  @ApiProperty({ format: "date-time" })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  @IsDateString({ strict: true })
  recordedAt!: string;
  @ApiProperty({ minimum: 1, maximum: 28800 })
  @IsInt()
  @Min(1)
  @Max(28800)
  durationSeconds!: number;
  @ApiProperty({ enum: ["video/mp4", "video/webm"] })
  @IsIn(["video/mp4", "video/webm"])
  contentType!: string;
  @ApiProperty({ minimum: 1, maximum: 536870912 })
  @IsInt()
  @Min(1)
  @Max(536870912)
  sizeBytes!: number;
  @ApiProperty({
    description:
      "Base64 SHA-256 of the complete file; standard canonical encoding.",
  })
  @IsString()
  @Matches(/^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/)
  checksumSha256!: string;
}
export class UpdateRecordingDto extends PartialType(
  PickType(CreateRecordingDto, ["title", "recordedAt", "durationSeconds"]),
  { skipNullProperties: false },
) {}
export class CompleteRecordingDto {
  @ApiProperty({
    description:
      "x-amz-version-id returned by the successful upload. Private bucket versioning is required.",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  versionId!: string;
}
