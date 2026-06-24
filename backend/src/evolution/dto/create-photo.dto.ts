import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { PhotoAngle } from '@prisma/client';

export class CreatePhotoDto {
  @IsString()
  storagePath: string;

  @IsEnum(PhotoAngle)
  @IsOptional()
  angle?: PhotoAngle;

  @IsDateString()
  @IsOptional()
  date?: string;
}
