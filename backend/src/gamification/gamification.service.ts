import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

// Resultado de uma badge no retorno da gamificacao.
export interface Badge {
  key: string;
  label: string;
  description: string;
  earned: boolean;
}

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  // Resolve o Student a partir do usuario logado.
  private async getStudentByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    return student;
  }

  async getMyGamification(userId: string) {
    const student = await this.getStudentByUserId(userId);
    return this.buildGamification(student.id);
  }

  async getGamificationByStudentId(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.buildGamification(studentId);
  }

  // ---------------------------------------------------------
  // Calculo da gamificacao a partir dos WorkoutLog concluidos
  // ---------------------------------------------------------

  private async buildGamification(studentId: string) {
    const logs = await this.prisma.workoutLog.findMany({
      where: { studentId, completed: true },
      orderBy: { date: 'asc' },
    });

    const totalWorkouts = logs.length;
    const lastWorkoutDate =
      totalWorkouts > 0 ? logs[totalWorkouts - 1].date : null;

    // Dias-calendario unicos (ignorando horas) com pelo menos 1 treino concluido.
    const uniqueDays = this.toUniqueDays(logs.map((log) => log.date));

    const longestStreak = this.calcLongestStreak(uniqueDays);
    const currentStreak = this.calcCurrentStreak(uniqueDays);

    const badges = this.buildBadges(totalWorkouts, longestStreak);

    return {
      currentStreak,
      longestStreak,
      totalWorkouts,
      lastWorkoutDate,
      badges,
    };
  }

  // Normaliza uma data para o inicio do dia (00:00) em ms, ignorando horas.
  private startOfDay(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  // Converte uma lista de datas em dias-calendario unicos (ms), ordenados crescente.
  private toUniqueDays(dates: Date[]): number[] {
    const set = new Set<number>();
    for (const date of dates) {
      set.add(this.startOfDay(date));
    }
    return Array.from(set).sort((a, b) => a - b);
  }

  // Maior sequencia de dias-calendario consecutivos.
  private calcLongestStreak(days: number[]): number {
    if (days.length === 0) return 0;

    const ONE_DAY = 24 * 60 * 60 * 1000;
    let longest = 1;
    let current = 1;

    for (let i = 1; i < days.length; i++) {
      const diff = days[i] - days[i - 1];
      if (diff === ONE_DAY) {
        current += 1;
      } else {
        current = 1;
      }
      if (current > longest) longest = current;
    }

    return longest;
  }

  // Dias consecutivos terminando hoje ou ontem; senao a streak atual e 0.
  private calcCurrentStreak(days: number[]): number {
    if (days.length === 0) return 0;

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const today = this.startOfDay(new Date());
    const yesterday = today - ONE_DAY;

    const lastDay = days[days.length - 1];

    // A streak so conta se o ultimo treino foi hoje ou ontem.
    if (lastDay !== today && lastDay !== yesterday) {
      return 0;
    }

    let streak = 1;
    for (let i = days.length - 1; i > 0; i--) {
      const diff = days[i] - days[i - 1];
      if (diff === ONE_DAY) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  }

  // Regras deterministicas. Retorna TODAS as badges com earned true/false.
  private buildBadges(totalWorkouts: number, longestStreak: number): Badge[] {
    return [
      {
        key: 'primeiro-treino',
        label: 'Primeiro Treino',
        description: 'Conclua seu primeiro treino.',
        earned: totalWorkouts >= 1,
      },
      {
        key: 'tres-dias-seguidos',
        label: 'Três Dias Seguidos',
        description: 'Treine por 3 dias consecutivos.',
        earned: longestStreak >= 3,
      },
      {
        key: 'sete-dias-seguidos',
        label: 'Sete Dias Seguidos',
        description: 'Treine por 7 dias consecutivos.',
        earned: longestStreak >= 7,
      },
      {
        key: 'dez-treinos',
        label: 'Dez Treinos',
        description: 'Conclua 10 treinos no total.',
        earned: totalWorkouts >= 10,
      },
      {
        key: 'mestre-da-forca',
        label: 'Mestre da Força',
        description: 'Conclua 50 treinos no total.',
        earned: totalWorkouts >= 50,
      },
    ];
  }
}
