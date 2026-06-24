import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpsertScheduleDto } from './dto/upsert-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getScheduleByStudentId(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.weeklyScheduleItem.findMany({
      where: { studentId },
      orderBy: { dayOfWeek: 'asc' },
      include: { workout: true },
    });
  }

  async getMySchedule(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.weeklyScheduleItem.findMany({
      where: { studentId: student.id },
      orderBy: { dayOfWeek: 'asc' },
      include: { workout: true },
    });
  }

  async upsertSchedule(studentId: string, data: UpsertScheduleDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    // Faz upsert de cada item por (studentId, dayOfWeek) dentro de uma transação.
    await this.prisma.$transaction(
      data.items.map((item) =>
        this.prisma.weeklyScheduleItem.upsert({
          where: {
            studentId_dayOfWeek: {
              studentId,
              dayOfWeek: item.dayOfWeek,
            },
          },
          create: {
            studentId,
            dayOfWeek: item.dayOfWeek,
            type: item.type,
            workoutId: item.workoutId,
            notes: item.notes,
          },
          update: {
            type: item.type,
            workoutId: item.workoutId,
            notes: item.notes,
          },
        }),
      ),
    );

    return this.getScheduleByStudentId(studentId);
  }
}
