import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutExerciseDto, UpdateWorkoutExerciseDto } from './dto/workout-exercise.dto';

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  // Include padrao: exercicios do treino com seus dados de catalogo, ordenados.
  private readonly exercisesInclude = {
    exercises: {
      include: { exercise: true },
      orderBy: { order: 'asc' as const },
    },
  };

  async create(data: CreateWorkoutDto) {
    const { exercises, ...scalars } = data;

    return this.prisma.workout.create({
      data: {
        ...scalars,
        ...(exercises && exercises.length > 0
          ? {
              exercises: {
                create: exercises.map((ex: WorkoutExerciseDto) => ({
                  exerciseId: ex.exerciseId,
                  order: ex.order,
                  sets: ex.sets,
                  reps: ex.reps,
                  loadKg: ex.loadKg,
                  restSec: ex.restSec,
                  notes: ex.notes,
                })),
              },
            }
          : {}),
      },
      include: this.exercisesInclude,
    });
  }

  async findAll(studentId?: string, isTemplate?: boolean) {
    const where: any = {};
    if (studentId !== undefined) where.studentId = studentId;
    if (isTemplate !== undefined) where.isTemplate = isTemplate;

    return this.prisma.workout.findMany({
      where,
      include: this.exercisesInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const workout = await this.prisma.workout.findUnique({
      where: { id },
      include: this.exercisesInclude,
    });
    if (!workout) throw new NotFoundException('Treino não encontrado');
    return workout;
  }

  // Professor acessa qualquer treino; aluno so acessa o proprio.
  async findOneForUser(id: string, userId: string, isProfessor: boolean) {
    const workout = await this.findOne(id);

    if (isProfessor) return workout;

    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student || workout.studentId !== student.id) {
      throw new ForbiddenException('Você não tem acesso a este treino.');
    }
    return workout;
  }

  async update(id: string, data: UpdateWorkoutDto) {
    await this.findOne(id);
    return this.prisma.workout.update({
      where: { id },
      data,
      include: this.exercisesInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.workout.delete({ where: { id } });
  }

  // Substitui a ficha inteira: atualiza escalares e recria os exercicios.
  async replace(id: string, data: CreateWorkoutDto) {
    await this.findOne(id);
    const { exercises, ...scalars } = data;

    return this.prisma.$transaction(async (tx) => {
      await tx.workoutExercise.deleteMany({ where: { workoutId: id } });
      return tx.workout.update({
        where: { id },
        data: {
          ...scalars,
          ...(exercises && exercises.length > 0
            ? {
                exercises: {
                  create: exercises.map((ex: WorkoutExerciseDto) => ({
                    exerciseId: ex.exerciseId,
                    order: ex.order,
                    sets: ex.sets,
                    reps: ex.reps,
                    loadKg: ex.loadKg,
                    restSec: ex.restSec,
                    notes: ex.notes,
                  })),
                },
              }
            : {}),
        },
        include: this.exercisesInclude,
      });
    });
  }

  async findForUser(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.workout.findMany({
      where: { studentId: student.id },
      include: this.exercisesInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async addExercise(workoutId: string, data: WorkoutExerciseDto) {
    await this.findOne(workoutId);
    return this.prisma.workoutExercise.create({
      data: {
        workoutId,
        exerciseId: data.exerciseId,
        order: data.order,
        sets: data.sets,
        reps: data.reps,
        loadKg: data.loadKg,
        restSec: data.restSec,
        notes: data.notes,
      },
      include: { exercise: true },
    });
  }

  async updateExercise(id: string, data: UpdateWorkoutExerciseDto) {
    const exercise = await this.prisma.workoutExercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercício do treino não encontrado');

    return this.prisma.workoutExercise.update({
      where: { id },
      data,
      include: { exercise: true },
    });
  }

  async removeExercise(id: string) {
    const exercise = await this.prisma.workoutExercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercício do treino não encontrado');

    return this.prisma.workoutExercise.delete({ where: { id } });
  }
}
