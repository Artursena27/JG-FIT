import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Goal, Sex, TrainingExperience } from '@prisma/client';

export class OnboardingDto {
  // Bloco 1: Biometria
  @IsDateString()
  @IsOptional()
  birthdate?: string;

  @IsEnum(Sex)
  @IsOptional()
  sex?: Sex;

  @IsNumber()
  @Min(50)
  @Max(250)
  @IsOptional()
  heightCm?: number;

  @IsNumber()
  @Min(30)
  @Max(300)
  @IsOptional()
  weightKg?: number;

  @IsNumber()
  @IsOptional()
  bodyFatPct?: number;

  // Bloco 2: Objetivos e Experiência
  @IsEnum(Goal)
  @IsOptional()
  goal?: Goal;

  @IsString()
  @IsOptional()
  goalDeadline?: string;

  @IsEnum(TrainingExperience)
  @IsOptional()
  trainingExperience?: TrainingExperience;

  @IsString()
  @IsOptional()
  trainingTime?: string;

  // Bloco 3: Disponibilidade
  @IsNumber()
  @Min(1)
  @Max(7)
  @IsOptional()
  weeklyFrequency?: number;

  @IsNumber()
  @Min(10)
  @Max(180)
  @IsOptional()
  sessionMinutes?: number;

  @IsString()
  @IsOptional()
  preferredTime?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableDays?: string[];

  // Bloco 4: Local e Equipamentos
  @IsString()
  @IsOptional()
  trainingLocation?: string;

  @IsString()
  @IsOptional()
  equipment?: string;

  // Bloco 5: Saúde e Estilo de vida
  @IsString()
  @IsOptional()
  injuries?: string;

  @IsString()
  @IsOptional()
  healthConditions?: string;

  @IsString()
  @IsOptional()
  profession?: string;

  @IsNumber()
  @Min(0)
  @Max(24)
  @IsOptional()
  sleepHours?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferences?: string[];
}
