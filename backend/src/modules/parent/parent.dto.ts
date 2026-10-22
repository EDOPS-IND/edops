import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from "class-validator";

export class ParentLeaveDto {
  @IsString() @IsNotEmpty() @MaxLength(50) leaveType!: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsString() @IsNotEmpty() @MaxLength(4000) reason!: string;
}
export class ParentQueryDto {
  @IsString() @IsNotEmpty() @MaxLength(100) subject!: string;
  @IsString() @IsNotEmpty() @MaxLength(8000) queryText!: string;
}
export class ParentBookingDto {
  @IsUUID() scheduleId!: string;
  @IsUUID() teacherId!: string;
  @IsInt() @Min(0) slotIndex!: number;
  @IsString() @MaxLength(4000) notes!: string;
}
