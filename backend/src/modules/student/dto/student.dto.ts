import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class SubmitAssignmentDto {
  @ApiPropertyOptional({ description: "Assignment ID if submitted in request body" })
  @IsOptional()
  @IsString()
  assignmentId?: string;

  @ApiProperty({ description: "Text content or description of submission" })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: "Optional notes for the submission" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Attached file URL or document links" })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class SubmitArenaAttemptDto {
  @ApiProperty({
    description: "Selected option indexes or values",
    type: [Number],
  })
  @IsArray()
  @IsNotEmpty()
  submittedAnswer!: any[];

  @ApiPropertyOptional({ description: "Time taken in seconds" })
  @IsOptional()
  @IsInt()
  timeSpentSeconds?: number;
}

export class UpdateLectureProgressDto {
  @ApiProperty({ description: "Playback position in seconds" })
  @IsInt()
  @Min(0)
  lastPositionSeconds!: number;

  @ApiProperty({ description: "Watched percentage 0-100" })
  @IsInt()
  @Min(0)
  @Max(100)
  watchedPct!: number;

  @ApiProperty({ description: "Mark as completed" })
  @IsBoolean()
  isCompleted!: boolean;
}

export class ToggleBookmarkDto {
  @ApiProperty({ description: "Resource identifier" })
  @IsString()
  @IsNotEmpty()
  resourceId!: string;

  @ApiProperty({
    enum: [
      "study_material",
      "recorded_lecture",
      "assignment",
      "arena_question",
    ],
  })
  @IsIn(["study_material", "recorded_lecture", "assignment", "arena_question"])
  resourceType!:
    | "study_material"
    | "recorded_lecture"
    | "assignment"
    | "arena_question";

  @ApiProperty({ description: "Title of the saved item" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: "Subject name" })
  @IsOptional()
  @IsString()
  subjectName?: string;

  @ApiProperty({ description: "Link or resource URL" })
  @IsString()
  @IsNotEmpty()
  url!: string;
}

export class SendStudentMessageDto {
  @ApiProperty({
    description: "Recipient user ID (Teacher, Class Teacher, or Admin)",
  })
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  @ApiProperty({ description: "Subject header" })
  @IsString()
  @IsNotEmpty()
  subjectLine!: string;

  @ApiProperty({ description: "Message body" })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ enum: ["normal", "urgent"], default: "normal" })
  @IsOptional()
  @IsIn(["normal", "urgent"])
  priority?: "normal" | "urgent";
}

export class CreateStudentGoalDto {
  @ApiProperty({
    description: "Goal title e.g. Score 90% in Quadratic Equations",
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: "Subject ID" })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ description: "Target score percentage (1-100)" })
  @IsInt()
  @Min(1)
  @Max(100)
  targetScore!: number;

  @ApiProperty({ description: "Target completion date YYYY-MM-DD" })
  @IsString()
  @IsNotEmpty()
  deadline!: string;
}

export class CreateStudentSupportRequestDto {
  @ApiProperty({ enum: ["academic", "doubt", "counselling", "subject_help"] })
  @IsIn(["academic", "doubt", "counselling", "subject_help"])
  category!: "academic" | "doubt" | "counselling" | "subject_help";

  @ApiPropertyOptional({ description: "Subject ID if subject related" })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: "Preferred teacher ID" })
  @IsOptional()
  @IsString()
  preferredTeacherId?: string;

  @ApiProperty({ description: "Description of help or doubt needed" })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ enum: ["low", "normal", "urgent"], default: "normal" })
  @IsOptional()
  @IsIn(["low", "normal", "urgent"])
  urgency?: "low" | "normal" | "urgent";
}

export class StudentReflectionDto {
  @IsInt() @Min(1) @Max(5) cognitive!:number;
  @IsInt() @Min(1) @Max(5) socioEmotional!:number;
  @IsInt() @Min(1) @Max(5) psychomotor!:number;
  @IsInt() @Min(1) @Max(5) creative!:number;
  @IsString() reflectionText!:string;
  @IsString() improvementText!:string;
}
