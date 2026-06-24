import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateWorkoutDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  periodizationId?: string;
}
