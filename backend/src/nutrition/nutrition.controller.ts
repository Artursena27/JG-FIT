import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RequireStatus } from '../auth/status.decorator';
import { UpsertDietDto } from './dto/upsert-diet.dto';

@Controller()
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  // ---------------------------------------------------------
  // Rotas do Aluno
  // ---------------------------------------------------------

  @Get('students/me/diet')
  @RequireStatus('ONBOARDED')
  getMyDiet(@CurrentUser() user: User) {
    return this.nutritionService.getMyDiet(user.id);
  }

  // ---------------------------------------------------------
  // Rotas do Professor
  // ---------------------------------------------------------

  @Get('students/:id/diet')
  @Roles(Role.PROFESSOR)
  getDietForStudent(@Param('id') id: string) {
    return this.nutritionService.getDietForStudent(id);
  }

  @Put('students/:id/diet')
  @Roles(Role.PROFESSOR)
  upsertDiet(@Param('id') id: string, @Body() data: UpsertDietDto) {
    return this.nutritionService.upsertDiet(id, data);
  }
}
