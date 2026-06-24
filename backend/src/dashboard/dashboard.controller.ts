import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ---------------------------------------------------------
  // Rotas do Professor
  // ---------------------------------------------------------

  @Get('professor/dashboard')
  @Roles(Role.PROFESSOR)
  getProfessorDashboard() {
    return this.dashboardService.getProfessorDashboard();
  }
}
