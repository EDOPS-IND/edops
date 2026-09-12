import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsInt, IsObject, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { trim } from '../academics/academic.dto';

export class PlanFeatures {
  @ApiProperty() @IsBoolean() arena!: boolean;
  @ApiProperty() @IsBoolean() recordings!: boolean;
  @ApiProperty() @IsBoolean() communication!: boolean;
}
export class CreatePlanDto {
  @ApiProperty({format:'uuid',description:'Client-generated stable ID; reuse the identical body to recover a lost response.'}) @IsUUID() id!: string;
  @ApiProperty() @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @ApiProperty({description:'Flat monthly school price in INR paise, not per seat.',minimum:0,maximum:1000000000}) @IsInt() @Min(0) @Max(1000000000) amountMinor!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(100000) maxStudents!: number;
  @ApiProperty() @IsInt() @Min(1) @Max(10000) maxTeachers!: number;
  @ApiProperty({type:PlanFeatures}) @IsObject() @ValidateNested() @Type(()=>PlanFeatures) features!: PlanFeatures;
}
export class PlanStatusDto { @ApiProperty() @IsBoolean() active!: boolean; }
export class SubscriptionDto {
  @ApiProperty({format:'uuid'}) @IsUUID() planId!: string;
  @ApiProperty({enum:['trialing','active','past_due','canceled']}) @IsIn(['trialing','active','past_due','canceled']) status!: string;
  @ApiProperty({format:'date-time'}) @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/) @IsDateString({strict:true}) periodStart!: string;
  @ApiProperty({format:'date-time'}) @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/) @IsDateString({strict:true}) periodEnd!: string;
}
export class FeatureOverrideDto {
  @ApiProperty({enum:['arena','recordings','communication']}) @IsIn(['arena','recordings','communication']) feature!: 'arena'|'recordings'|'communication';
  @ApiProperty({description:'Use inherit to remove the override.',enum:['enabled','disabled','inherit']}) @IsIn(['enabled','disabled','inherit']) mode!: string;
}
export class PayInvoiceDto {
  @ApiProperty({description:'Unique offline payment receipt/reference. Never card or bank account details.'}) @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) paymentReference!: string;
}
