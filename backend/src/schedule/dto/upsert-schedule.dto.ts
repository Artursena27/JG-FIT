import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek, ScheduleType } from '@prisma/client';

export class ScheduleItemDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsEnum(ScheduleType)
  type: ScheduleType;

  @IsString()
  @IsOptional()
  workoutId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpsertScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  items: ScheduleItemDto[];
}
