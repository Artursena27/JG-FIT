import {
  IsBoolean,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLogDto {
  @IsString()
  @IsOptional()
  workoutId?: string;

  // Data como string ISO; convertida para Date no service.
  @IsDateString()
  @IsOptional()
  date?: string;

  // Json livre (ex: { exerciseId: loadKg, ... }); gravado como Prisma.InputJsonValue.
  @IsObject()
  @IsOptional()
  loadsUsed?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
