import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';
import { AcademicRecord } from '../academics/academic.entity';

@Entity('recorded_sessions')
export class Recording extends AcademicRecord {
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'section_id', type: 'uuid' }) sectionId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'subject_id', type: 'uuid' }) subjectId!: string;
  @ApiProperty({ format: 'uuid' }) @Column({ name: 'uploaded_by', type: 'uuid' }) uploadedBy!: string;
  @ApiProperty() @Column({ type: 'varchar', length: 200 }) title!: string;
  @ApiProperty({ format: 'date-time' }) @Column({ name: 'recorded_at', type: 'timestamptz' }) recordedAt!: Date;
  @ApiProperty() @Column({ name: 'duration_seconds', type: 'integer' }) durationSeconds!: number;
  @ApiProperty({ enum: ['video/mp4','video/webm'] }) @Column({ name: 'content_type', type: 'varchar', length: 32 }) contentType!: string;
  @ApiProperty() @Column({ name: 'size_bytes', type: 'integer' }) sizeBytes!: number;
  @ApiHideProperty() @Column({ name: 'checksum_sha256', type: 'varchar', length: 44, select: false }) checksumSha256!: string;
  @ApiHideProperty() @Column({ name: 'object_key', type: 'text', select: false }) objectKey!: string;
  @ApiHideProperty() @Column({ name: 'object_version', type: 'text', nullable: true, select: false }) objectVersion!: string | null;
  @ApiProperty({ enum: ['uploading','ready','published','archived'] }) @Column({ type: 'varchar', length: 16, default: 'uploading' }) status!: string;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) @Column({ name: 'published_at', type: 'timestamptz', nullable: true }) publishedAt!: Date | null;
}

export function recordingView(row: Recording) {
  const { objectKey: _key, objectVersion: _version, checksumSha256: _checksum, ...view } = row;
  return view;
}
