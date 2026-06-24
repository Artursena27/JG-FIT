import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpsertDietDto } from './dto/upsert-diet.dto';

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  // Plano alimentar do aluno autenticado (resolve o Student pelo userId).
  async getMyDiet(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.dietPlan.findUnique({
      where: { studentId: student.id },
    });
  }

  // Plano alimentar de um aluno especifico (acesso do professor).
  async getDietForStudent(studentId: string) {
    return this.prisma.dietPlan.findUnique({ where: { studentId } });
  }

  // Cria ou atualiza o plano alimentar do aluno (acesso do professor).
  async upsertDiet(studentId: string, data: UpsertDietDto) {
    return this.prisma.dietPlan.upsert({
      where: { studentId },
      update: { ...data },
      create: { studentId, ...data },
    });
  }
}
