import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class WorkoutExerciseDto {
  @IsString()
  exerciseId: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sets?: number;

  @IsString()
  @IsOptional()
  reps?: string;

  @IsNumber()
  @IsOptional()
  loadKg?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  restSec?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

// Usado no PATCH /workout-exercises/:id (todos os campos opcionais, exerciseId nao editavel)
export class UpdateWorkoutExerciseDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sets?: number;

  @IsString()
  @IsOptional()
  reps?: string;

  @IsNumber()
  @IsOptional()
  loadKg?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  restSec?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
