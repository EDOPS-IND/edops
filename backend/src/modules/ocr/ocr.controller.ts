import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OcrService } from './ocr.service';
import { ExtractQuestionPaperDto } from './dto/extract-paper.dto';

@ApiTags('OCR & Document Digitization')
@Controller('organizations/:organizationId/ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('extract-question-paper')
  @ApiOperation({
    summary: 'Extract and standardize handwritten or draft question paper into exam template using Gemini Flash',
  })
  extractQuestionPaper(
    @Param('organizationId', ParseUUIDPipe) _organizationId: string,
    @Body() dto: ExtractQuestionPaperDto,
  ) {
    return this.ocrService.extractQuestionPaper(dto);
  }
}

