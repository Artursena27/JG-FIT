import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkoutExerciseDto } from './workout-exercise.dto';

export class CreateWorkoutDto {
  @IsString()
  name: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseDto)
  @IsOptional()
  exercises?: WorkoutExerciseDto[];
}
