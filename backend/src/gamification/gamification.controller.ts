import { Controller, Get, Param } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RequireStatus } from '../auth/status.decorator';

@Controller()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ---------------------------------------------------------
  // Rotas do Aluno
  // ---------------------------------------------------------

  @Get('students/me/gamification')
  @RequireStatus('ONBOARDED')
  getMyGamification(@CurrentUser() user: User) {
    return this.gamificationService.getMyGamification(user.id);
  }

  // ---------------------------------------------------------
  // Rotas do Professor
  // ---------------------------------------------------------

  @Get('students/:id/gamification')
  @Roles(Role.PROFESSOR)
  getGamificationByStudentId(@Param('id') id: string) {
    return this.gamificationService.getGamificationByStudentId(id);
  }
}
