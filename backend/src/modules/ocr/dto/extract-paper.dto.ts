import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExtractQuestionPaperDto {
  @ApiPropertyOptional({ description: 'Base64 data or data URL of the image/PDF' })
  @IsOptional()
  @IsString()
  fileData?: string;

  @ApiPropertyOptional({ description: 'MIME type of file (image/png, image/jpeg, application/pdf)' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Raw typed or pasted text of the question paper' })
  @IsOptional()
  @IsString()
  rawText?: string;

  @ApiPropertyOptional({ description: 'Target subject if known' })
  @IsOptional()
  @IsString()
  subjectHint?: string;

  @ApiPropertyOptional({ description: 'Target grade/class if known' })
  @IsOptional()
  @IsString()
  gradeHint?: string;
}
