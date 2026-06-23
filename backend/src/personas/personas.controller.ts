import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PersonasService } from './personas.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Get('students/:id/personas')
  @Roles(Role.PROFESSOR)
  getPersonas(@Param('id') id: string) {
    return this.personasService.getStudentPersonas(id);
  }

  @Post('assistant/prescription')
  @Roles(Role.PROFESSOR)
  assistantPrescription(@Body() data: { studentId?: string; description?: string }) {
    return this.personasService.assistantPrescription(data);
  }
}
