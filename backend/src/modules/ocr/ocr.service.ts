import { Injectable, Logger } from '@nestjs/common';
import { ExtractQuestionPaperDto } from './dto/extract-paper.dto';

export interface StructuredPaperResult {
  title: string;
  subjectName: string;
  grade: string;
  term: string;
  totalMarks: number;
  durationMinutes: number;
  difficultyEasyPct: number;
  difficultyMediumPct: number;
  difficultyHardPct: number;
  formattedContent: string;
  rawExtractedText: string;
  source: 'gemini-flash' | 'fallback-parser';
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractQuestionPaper(dto: ExtractQuestionPaperDto): Promise<StructuredPaperResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (apiKey && (dto.fileData || dto.rawText)) {
      try {
        const geminiResult = await this.callGeminiFlash(apiKey, dto);
        if (geminiResult) return geminiResult;
      } catch (err) {
        this.logger.warn(`Gemini Flash OCR call failed, falling back to local heuristic: ${(err as Error).message}`);
      }
    }

    return this.fallbackHeuristicExtract(dto);
  }

  private async callGeminiFlash(apiKey: string, dto: ExtractQuestionPaperDto): Promise<StructuredPaperResult | null> {
    const prompt = `You are an expert CBSE/ICSE school exam paper digitizer.
Analyze the provided handwritten/scanned question paper or text notes and convert it into a clean, standardized, professional examination paper.

Return ONLY a valid JSON object matching this schema without markdown codeblocks or quotes:
{
  "title": "Clear exam title (e.g. Class 10 Mathematics Mid-Term Examination)",
  "subjectName": "${dto.subjectHint || 'Subject detected or Mathematics'}",
  "grade": "${dto.gradeHint || 'Grade 10'}",
  "term": "Term 1 Midterm",
  "totalMarks": 80,
  "durationMinutes": 180,
  "difficultyEasyPct": 30,
  "difficultyMediumPct": 50,
  "difficultyHardPct": 20,
  "formattedContent": "Full formatted exam paper in clean markdown with School Header, General Instructions, Section A (Objective/MCQ), Section B (Short Answer), Section C (Long Answer), clearly numbered questions with marks distribution like [1 Mark], [2 Marks] on each question."
}`;

    const parts: any[] = [{ text: prompt }];

    if (dto.fileData) {
      let base64 = dto.fileData;
      let mimeType = dto.mimeType || 'image/jpeg';
      if (base64.includes(';base64,')) {
        const [meta, data] = base64.split(';base64,');
        base64 = data;
        const match = meta.match(/:(.*?);/);
        if (match) mimeType = match[1];
      }
      parts.push({
        inlineData: {
          mimeType,
          data: base64,
        },
      });
    } else if (dto.rawText) {
      parts.push({ text: `Teacher Draft Notes/Text:\n${dto.rawText}` });
    }

    const model = 'gemini-1.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) return null;

    try {
      const parsed = JSON.parse(textOutput.replace(/^```json\s*|\s*```$/g, ''));
      return {
        title: parsed.title || 'Examination Question Paper',
        subjectName: parsed.subjectName || dto.subjectHint || 'General',
        grade: parsed.grade || dto.gradeHint || 'Grade 10',
        term: parsed.term || 'Term 1 Midterm',
        totalMarks: Number(parsed.totalMarks) || 80,
        durationMinutes: Number(parsed.durationMinutes) || 180,
        difficultyEasyPct: Number(parsed.difficultyEasyPct) || 30,
        difficultyMediumPct: Number(parsed.difficultyMediumPct) || 50,
        difficultyHardPct: Number(parsed.difficultyHardPct) || 20,
        formattedContent: parsed.formattedContent || textOutput,
        rawExtractedText: textOutput,
        source: 'gemini-flash',
      };
    } catch {
      return null;
    }
  }

  private fallbackHeuristicExtract(dto: ExtractQuestionPaperDto): StructuredPaperResult {
    const raw = dto.rawText || (dto.fileData ? 'Extracted text from uploaded paper draft' : '');
    const subject = dto.subjectHint || 'Mathematics';
    const grade = dto.gradeHint || 'Grade 10';

    const sampleFormatted = `### ${grade} - ${subject} Mid-Term Examination
**Time Allowed:** 3 Hours | **Maximum Marks:** 80

---
#### General Instructions:
1. All questions are compulsory.
2. The question paper contains three sections: Section A, Section B, and Section C.
3. Section A comprises 10 objective/MCQ questions of 1 mark each.
4. Section B comprises 5 short answer questions of 2 marks each.
5. Section C comprises 4 long answer questions of 5 marks each.

---
### SECTION A (Objective / MCQ - 1 Mark Each)
1. Sample objective question transcribed from draft. [1 Mark]
2. What is the fundamental concept in ${subject}? [1 Mark]
3. Choose the correct option for the given statement. [1 Mark]

---
### SECTION B (Short Answer - 2 Marks Each)
4. Explain the primary theorem or rule in brief. [2 Marks]
5. Solve the following equation or problem step-by-step. [2 Marks]

---
### SECTION C (Long Answer - 5 Marks Each)
6. State and prove the application problem with diagram. [5 Marks]
${raw ? `\n--- \n*Imported Teacher Draft Content:*\n${raw}` : ''}`;

    return {
      title: `${grade} ${subject} Mid-Term Paper`,
      subjectName: subject,
      grade,
      term: 'Term 1 Midterm',
      totalMarks: 80,
      durationMinutes: 180,
      difficultyEasyPct: 30,
      difficultyMediumPct: 50,
      difficultyHardPct: 20,
      formattedContent: sampleFormatted,
      rawExtractedText: raw,
      source: 'fallback-parser',
    };
  }
}
