import { SetMetadata } from '@nestjs/common';
import { StudentStatus } from '@prisma/client';

export const STATUS_KEY = 'statuses';
export const RequireStatus = (...statuses: StudentStatus[]) => SetMetadata(STATUS_KEY, statuses);
