import { IsNumber, IsObject, IsOptional, IsDateString } from 'class-validator';

export class CreateMeasurementDto {
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
  extra?: Record<string, any>;
}
