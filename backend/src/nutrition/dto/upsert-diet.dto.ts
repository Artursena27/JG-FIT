import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertDietDto {
  @IsInt()
  @IsOptional()
  calories?: number;

  @IsNumber()
  @IsOptional()
  protein?: number;

  @IsNumber()
  @IsOptional()
  carbs?: number;

  @IsNumber()
  @IsOptional()
  fat?: number;

  @IsNumber()
  @IsOptional()
  waterLiters?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
