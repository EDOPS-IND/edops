import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { AcademicRecord } from "../academics/academic.entity";

export class Recording extends AcademicRecord {
  @ApiProperty({ format: "uuid" }) sectionId!: string;
  @ApiProperty({ format: "uuid" }) subjectId!: string;
  @ApiProperty({ format: "uuid" }) uploadedBy!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ format: "date-time" }) recordedAt!: Date;
  @ApiProperty() durationSeconds!: number;
  @ApiProperty({ enum: ["video/mp4", "video/webm"] }) contentType!: string;
  @ApiProperty() sizeBytes!: number;
  @ApiHideProperty() checksumSha256!: string;
  @ApiHideProperty() objectKey!: string;
  @ApiHideProperty() objectVersion!: string | null;
  @ApiProperty({ enum: ["uploading", "ready", "published", "archived"] })
  status!: string;
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  publishedAt!: Date | null;
}

export function recordingView(row: Recording) {
  const {
    objectKey: _key,
    objectVersion: _version,
    checksumSha256: _checksum,
    ...view
  } = row;
  return view;
}
