import { IsOptional, IsString } from 'class-validator';

// PartialType de @nestjs/mapped-types nao esta instalado no projeto,
// entao declaramos os campos manualmente (todos opcionais).
export class UpdateExerciseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  muscleGroup?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}
