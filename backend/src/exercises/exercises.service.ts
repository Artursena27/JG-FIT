import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(muscleGroup?: string) {
    return this.prisma.exercise.findMany({
      where: muscleGroup ? { muscleGroup } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });
    if (!exercise) throw new NotFoundException('Exercício não encontrado');
    return exercise;
  }

  async create(data: CreateExerciseDto) {
    return this.prisma.exercise.create({
      data,
    });
  }

  async update(id: string, data: UpdateExerciseDto) {
    // Garante que o exercício existe (lança 404 caso contrário)
    await this.findOne(id);

    return this.prisma.exercise.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    // Garante que o exercício existe (lança 404 caso contrário)
    await this.findOne(id);

    try {
      return await this.prisma.exercise.delete({
        where: { id },
      });
    } catch (error) {
      // A relação WorkoutExercise usa onDelete: Restrict, entao se o exercício
      // estiver em uso o Prisma lança uma violação de chave estrangeira (P2003).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Este exercício está sendo usado em um ou mais treinos e não pode ser excluído.',
        );
      }
      throw error;
    }
  }
}
