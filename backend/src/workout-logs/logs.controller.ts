import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LogsService } from './logs.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { CreateLogDto } from './dto/create-log.dto';
import { Roles } from '../auth/roles.decorator';
import { RequireStatus } from '../auth/status.decorator';

@Controller()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  // ---------------------------------------------------------
  // Rotas do Aluno
  // ---------------------------------------------------------

  @Post('students/me/logs')
  @RequireStatus('ONBOARDED')
  createMyLog(@CurrentUser() user: User, @Body() data: CreateLogDto) {
    return this.logsService.createMyLog(user.id, data);
  }

  @Get('students/me/logs')
  @RequireStatus('ONBOARDED')
  getMyLogs(@CurrentUser() user: User) {
    return this.logsService.getMyLogs(user.id);
  }

  // ---------------------------------------------------------
  // Rotas do Professor
  // ---------------------------------------------------------

  @Get('students/:id/logs')
  @Roles(Role.PROFESSOR)
  getLogsByStudentId(@Param('id') id: string) {
    return this.logsService.getLogsByStudentId(id);
  }
}
