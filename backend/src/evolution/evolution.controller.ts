import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EvolutionService } from './evolution.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RequireStatus } from '../auth/status.decorator';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Controller()
export class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {}

  // ---------------------------------------------------------
  // Avaliações (Assessments)
  // ---------------------------------------------------------

  @Get('students/me/assessments')
  @RequireStatus('ONBOARDED')
  getMyAssessments(@CurrentUser() user: User) {
    return this.evolutionService.listMyAssessments(user.id);
  }

  @Get('students/:id/assessments')
  @Roles(Role.PROFESSOR)
  getAssessments(@Param('id') id: string) {
    return this.evolutionService.listAssessments(id);
  }

  @Post('students/:id/assessments')
  @Roles(Role.PROFESSOR)
  createAssessment(@Param('id') id: string, @Body() data: CreateAssessmentDto) {
    return this.evolutionService.createAssessment(id, data);
  }

  // ---------------------------------------------------------
  // Medidas (Measurements)
  // ---------------------------------------------------------

  @Get('students/me/measurements')
  @RequireStatus('ONBOARDED')
  getMyMeasurements(@CurrentUser() user: User) {
    return this.evolutionService.listMyMeasurements(user.id);
  }

  @Get('students/:id/measurements')
  @Roles(Role.PROFESSOR)
  getMeasurements(@Param('id') id: string) {
    return this.evolutionService.listMeasurements(id);
  }

  @Post('students/:id/measurements')
  @Roles(Role.PROFESSOR)
  createMeasurement(
    @Param('id') id: string,
    @Body() data: CreateMeasurementDto,
  ) {
    return this.evolutionService.createMeasurement(id, data);
  }

  // ---------------------------------------------------------
  // Fotos de progresso (Progress Photos)
  // ---------------------------------------------------------

  @Get('students/me/photos')
  @RequireStatus('ONBOARDED')
  getMyPhotos(@CurrentUser() user: User) {
    return this.evolutionService.listMyPhotos(user.id);
  }

  @Get('students/:id/photos')
  @Roles(Role.PROFESSOR)
  getPhotos(@Param('id') id: string) {
    return this.evolutionService.listPhotos(id);
  }

  @Post('students/:id/photos')
  @Roles(Role.PROFESSOR)
  createPhoto(@Param('id') id: string, @Body() data: CreatePhotoDto) {
    return this.evolutionService.createPhoto(id, data);
  }
}
