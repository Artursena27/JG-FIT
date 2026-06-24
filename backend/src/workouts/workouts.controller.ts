import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RequireStatus } from '../auth/status.decorator';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutExerciseDto, UpdateWorkoutExerciseDto } from './dto/workout-exercise.dto';

@Controller()
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  // ---------------------------------------------------------
  // Rotas do Aluno
  // ---------------------------------------------------------

  @Get('students/me/workouts')
  @RequireStatus('ONBOARDED')
  getMyWorkouts(@CurrentUser() user: User) {
    return this.workoutsService.findForUser(user.id);
  }

  // ---------------------------------------------------------
  // Rotas do Professor
  // ---------------------------------------------------------

  @Post('workouts')
  @Roles(Role.PROFESSOR)
  create(@Body() data: CreateWorkoutDto) {
    return this.workoutsService.create(data);
  }

  @Get('workouts')
  @Roles(Role.PROFESSOR)
  findAll(
    @Query('studentId') studentId?: string,
    @Query('isTemplate') isTemplate?: string,
  ) {
    const isTemplateBool =
      isTemplate === undefined ? undefined : isTemplate === 'true';
    return this.workoutsService.findAll(studentId, isTemplateBool);
  }

  // Professor OU o aluno dono do treino
  @Get('workouts/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workoutsService.findOneForUser(
      id,
      user.id,
      user.role === Role.PROFESSOR,
    );
  }

  @Patch('workouts/:id')
  @Roles(Role.PROFESSOR)
  update(@Param('id') id: string, @Body() data: UpdateWorkoutDto) {
    return this.workoutsService.update(id, data);
  }

  // Substitui a ficha inteira (escalares + exercicios) numa transacao.
  @Put('workouts/:id')
  @Roles(Role.PROFESSOR)
  replace(@Param('id') id: string, @Body() data: CreateWorkoutDto) {
    return this.workoutsService.replace(id, data);
  }

  @Delete('workouts/:id')
  @Roles(Role.PROFESSOR)
  remove(@Param('id') id: string) {
    return this.workoutsService.remove(id);
  }

  // ---------------------------------------------------------
  // Exercícios do Treino (Professor)
  // ---------------------------------------------------------

  @Post('workouts/:id/exercises')
  @Roles(Role.PROFESSOR)
  addExercise(@Param('id') id: string, @Body() data: WorkoutExerciseDto) {
    return this.workoutsService.addExercise(id, data);
  }

  @Patch('workout-exercises/:id')
  @Roles(Role.PROFESSOR)
  updateExercise(
    @Param('id') id: string,
    @Body() data: UpdateWorkoutExerciseDto,
  ) {
    return this.workoutsService.updateExercise(id, data);
  }

  @Delete('workout-exercises/:id')
  @Roles(Role.PROFESSOR)
  removeExercise(@Param('id') id: string) {
    return this.workoutsService.removeExercise(id);
  }
}
