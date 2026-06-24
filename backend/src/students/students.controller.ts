import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { OnboardingDto } from './dto/onboarding.dto';
import { Roles } from '../auth/roles.decorator';
import { RequireStatus } from '../auth/status.decorator';

@Controller()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // ---------------------------------------------------------
  // Rotas do Aluno
  // ---------------------------------------------------------
  
  @Get('students/me')
  getMe(@CurrentUser() user: User) {
    return this.studentsService.getMe(user.id);
  }

  @Post('students/me/onboarding')
  @RequireStatus('APPROVED', 'ONBOARDED')
  saveOnboarding(@CurrentUser() user: User, @Body() data: OnboardingDto) {
    return this.studentsService.saveOnboarding(user.id, data);
  }

  // Exemplo de rota bloqueada apenas para ONBOARDED
  @Get('students/me/workouts-example')
  @RequireStatus('ONBOARDED')
  getWorkouts() {
    return { message: 'Você tem acesso aos treinos pois é ONBOARDED.' };
  }

  // ---------------------------------------------------------
  // Rotas do Professor
  // ---------------------------------------------------------

  @Get('professor/students')
  @Roles(Role.PROFESSOR)
  getApproved() {
    return this.studentsService.getApproved();
  }

  @Get('professor/students/pending')
  @Roles(Role.PROFESSOR)
  getPending() {
    return this.studentsService.getPending();
  }

  // IMPORTANTE: declarar depois de /pending para o literal nao cair no :id
  @Get('professor/students/:id')
  @Roles(Role.PROFESSOR)
  getById(@Param('id') id: string) {
    return this.studentsService.getById(id);
  }

  @Post('professor/students/:id/approve')
  @Roles(Role.PROFESSOR)
  approve(@Param('id') id: string) {
    return this.studentsService.approve(id);
  }

  @Post('professor/students/:id/reject')
  @Roles(Role.PROFESSOR)
  reject(@Param('id') id: string) {
    return this.studentsService.reject(id);
  }
}
