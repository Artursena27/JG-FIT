import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';
import { UpsertSubscriptionDto } from './dto/upsert-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // Professor
  // ---------------------------------------------------------

  async findAll(status?: SubscriptionStatus) {
    return this.prisma.subscription.findMany({
      where: status ? { status } : undefined,
      include: {
        student: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByStudentId(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.subscription.findUnique({
      where: { studentId },
    });
  }

  async upsert(studentId: string, data: UpsertSubscriptionDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;

    return this.prisma.subscription.upsert({
      where: { studentId },
      create: {
        studentId,
        status: data.status,
        planName: data.planName,
        dueDate,
      },
      update: {
        status: data.status,
        planName: data.planName,
        dueDate,
      },
    });
  }

  // ---------------------------------------------------------
  // Aluno
  // ---------------------------------------------------------

  async findMine(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.subscription.findUnique({
      where: { studentId: student.id },
    });
  }
}
