import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  // Resolve o Student a partir do usuario logado.
  private async getStudentByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    return student;
  }

  async createMyLog(userId: string, data: CreateLogDto) {
    const student = await this.getStudentByUserId(userId);

    // Como a data vem como string ISO, convertemos para Date.
    const date = data.date ? new Date(data.date) : undefined;

    return this.prisma.workoutLog.create({
      data: {
        studentId: student.id,
        workoutId: data.workoutId,
        date,
        loadsUsed: data.loadsUsed as Prisma.InputJsonValue,
        completed: data.completed,
        notes: data.notes,
      },
    });
  }

  async getMyLogs(userId: string) {
    const student = await this.getStudentByUserId(userId);

    return this.prisma.workoutLog.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
    });
  }

  async getLogsByStudentId(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.workoutLog.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });
  }
}
