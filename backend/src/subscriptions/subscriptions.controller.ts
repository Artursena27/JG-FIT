import { Controller, Get, Put, Body, Param, Query } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@prisma/client';
import { Role, SubscriptionStatus } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RequireStatus } from '../auth/status.decorator';
import { UpsertSubscriptionDto } from './dto/upsert-subscription.dto';

@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ---------------------------------------------------------
  // Rotas do Aluno
  // ---------------------------------------------------------

  @Get('students/me/subscription')
  @RequireStatus('ONBOARDED')
  findMine(@CurrentUser() user: User) {
    return this.subscriptionsService.findMine(user.id);
  }

  // ---------------------------------------------------------
  // Rotas do Professor
  // ---------------------------------------------------------

  @Get('professor/subscriptions')
  @Roles(Role.PROFESSOR)
  findAll(@Query('status') status?: SubscriptionStatus) {
    return this.subscriptionsService.findAll(status);
  }

  @Get('students/:id/subscription')
  @Roles(Role.PROFESSOR)
  findByStudentId(@Param('id') id: string) {
    return this.subscriptionsService.findByStudentId(id);
  }

  @Put('students/:id/subscription')
  @Roles(Role.PROFESSOR)
  upsert(@Param('id') id: string, @Body() data: UpsertSubscriptionDto) {
    return this.subscriptionsService.upsert(id, data);
  }
}
