import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class UpsertSubscriptionDto {
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsString()
  @IsOptional()
  planName?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
