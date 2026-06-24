import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { UpsertScheduleDto } from './dto/upsert-schedule.dto';
import { Roles } from '../auth/roles.decorator';
import { RequireStatus } from '../auth/status.decorator';

@Controller()
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // ---------------------------------------------------------
  // Rotas do Aluno
  // ---------------------------------------------------------

  @Get('students/me/schedule')
  @RequireStatus('ONBOARDED')
  getMySchedule(@CurrentUser() user: User) {
    return this.scheduleService.getMySchedule(user.id);
  }

  // ---------------------------------------------------------
  // Rotas do Professor
  // ---------------------------------------------------------

  @Get('students/:id/schedule')
  @Roles(Role.PROFESSOR)
  getSchedule(@Param('id') id: string) {
    return this.scheduleService.getScheduleByStudentId(id);
  }

  @Put('students/:id/schedule')
  @Roles(Role.PROFESSOR)
  upsertSchedule(@Param('id') id: string, @Body() data: UpsertScheduleDto) {
    return this.scheduleService.upsertSchedule(id, data);
  }
}
