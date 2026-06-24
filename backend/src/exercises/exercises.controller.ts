import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ExercisesService } from './exercises.service';
import { Roles } from '../auth/roles.decorator';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Controller()
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  // ---------------------------------------------------------
  // Rotas de leitura (qualquer usuário autenticado)
  // ---------------------------------------------------------

  @Get('exercises')
  findAll(@Query('muscleGroup') muscleGroup?: string) {
    return this.exercisesService.findAll(muscleGroup);
  }

  @Get('exercises/:id')
  findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
  }

  // ---------------------------------------------------------
  // Rotas do Professor (gerência do catálogo)
  // ---------------------------------------------------------

  @Post('exercises')
  @Roles(Role.PROFESSOR)
  create(@Body() data: CreateExerciseDto) {
    return this.exercisesService.create(data);
  }

  @Patch('exercises/:id')
  @Roles(Role.PROFESSOR)
  update(@Param('id') id: string, @Body() data: UpdateExerciseDto) {
    return this.exercisesService.update(id, data);
  }

  @Delete('exercises/:id')
  @Roles(Role.PROFESSOR)
  remove(@Param('id') id: string) {
    return this.exercisesService.remove(id);
  }
}
