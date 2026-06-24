import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfessorDashboard() {
    // Janela dos ultimos 30 dias para o calculo de adesao (adherence).
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      activeStudents,
      onboardedStudents,
      pendingStudents,
      totalStudents,
      totalLogs,
      completedLogs,
      workoutsCount,
      recentAssessmentsRaw,
      pendingApprovalsRaw,
    ] = await Promise.all([
      // Alunos ativos: APPROVED ou ONBOARDED
      this.prisma.student.count({
        where: { status: { in: ['APPROVED', 'ONBOARDED'] } },
      }),
      // Alunos ONBOARDED
      this.prisma.student.count({ where: { status: 'ONBOARDED' } }),
      // Alunos PENDING
      this.prisma.student.count({ where: { status: 'PENDING' } }),
      // Total de alunos
      this.prisma.student.count(),
      // Total de logs nos ultimos 30 dias
      this.prisma.workoutLog.count({
        where: { date: { gte: thirtyDaysAgo } },
      }),
      // Logs concluidos nos ultimos 30 dias
      this.prisma.workoutLog.count({
        where: { date: { gte: thirtyDaysAgo }, completed: true },
      }),
      // Total de treinos cadastrados
      this.prisma.workout.count(),
      // 5 avaliacoes mais recentes, com o nome do aluno
      this.prisma.assessment.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          weightKg: true,
          bodyFatPct: true,
          studentId: true,
          student: { select: { name: true } },
        },
      }),
      // Lista compacta dos alunos PENDING
      this.prisma.student.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true },
      }),
    ]);

    // Adesao: percentual de logs concluidos no periodo; null se nao houver logs.
    const adherencePct =
      totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : null;

    // Achata o nome do aluno para o formato pedido.
    const recentAssessments = recentAssessmentsRaw.map((a) => ({
      id: a.id,
      date: a.date,
      weightKg: a.weightKg,
      bodyFatPct: a.bodyFatPct,
      studentId: a.studentId,
      studentName: a.student.name,
    }));

    return {
      activeStudents,
      onboardedStudents,
      pendingStudents,
      totalStudents,
      adherencePct,
      workoutsCount,
      recentAssessments,
      pendingApprovals: pendingApprovalsRaw,
    };
  }
}
