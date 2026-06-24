import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateAssessmentDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @IsNumber()
  @IsOptional()
  bodyFatPct?: number;

  @IsObject()
  @IsOptional()
  circumferences?: Record<string, any>;

  @IsString()
  @IsOptional()
  notes?: string;
}
