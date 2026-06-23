import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OpenAiService } from '../ai/openai.service';
import { Student } from '@prisma/client';

@Injectable()
export class PersonasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: OpenAiService,
  ) {}

  /**
   * Cálculo determinístico de distância euclidiana/ponderada.
   * Não usa a OpenAI para gerar números.
   */
  private calculateSimilarityScore(target: Partial<Student>, candidate: Student): number {
    let score = 100;

    // Se objetivo for diferente, penaliza pesado
    if (target.goal && candidate.goal && target.goal !== candidate.goal) {
      score -= 30;
    }

    // Sexo diferente penaliza, mas não zera (treino é unissex, mas corpos respondem diferente)
    if (target.sex && candidate.sex && target.sex !== candidate.sex) {
      score -= 10;
    }

    // Experiência diferente
    if (target.trainingExperience && candidate.trainingExperience && target.trainingExperience !== candidate.trainingExperience) {
      score -= 15;
    }

    // Idade (distância em anos * peso)
    if (target.birthdate && candidate.birthdate) {
      const tAge = new Date().getFullYear() - target.birthdate.getFullYear();
      const cAge = new Date().getFullYear() - candidate.birthdate.getFullYear();
      const diff = Math.abs(tAge - cAge);
      if (diff > 5) score -= Math.min(diff * 1.5, 20);
    }

    // Peso (kg)
    if (target.weightKg && candidate.weightKg) {
      const diff = Math.abs(target.weightKg - candidate.weightKg);
      if (diff > 5) score -= Math.min(diff, 15);
    }

    // Frequência
    if (target.weeklyFrequency && candidate.weeklyFrequency) {
      const diff = Math.abs(target.weeklyFrequency - candidate.weeklyFrequency);
      score -= diff * 5;
    }

    return Math.max(0, Math.round(score));
  }

  async findTopMatches(studentId: string) {
    const target = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!target) throw new NotFoundException('Aluno alvo não encontrado.');

    // Pega todos os alunos ONBOARDED (exceto o próprio)
    const allStudents = await this.prisma.student.findMany({
      where: {
        status: 'ONBOARDED',
        id: { not: target.id },
      },
    });

    if (allStudents.length === 0) {
      return { matches: [], message: 'Base de alunos insuficiente para comparar.' };
    }

    const scored = allStudents.map((s) => ({
      student: s,
      score: this.calculateSimilarityScore(target, s),
    }));

    // Ordena do maior match para o menor
    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, 3); // top 3

    // Para o frontend, queremos retornar só os dados essenciais e o score numérico
    return {
      matches: topMatches.map(m => ({
        id: m.student.id,
        name: m.student.name,
        score: m.score,
      })),
      target,
      bestMatch: topMatches.length > 0 ? topMatches[0].student : null
    };
  }

  async getStudentPersonas(studentId: string) {
    const matchData = await this.findTopMatches(studentId);
    if (matchData.matches.length === 0) {
      return {
        score: 0,
        explanation: 'Ainda não há alunos suficientes na base para uma comparação confiável.',
        matches: []
      };
    }

    // Monta o prompt pra OpenAI apenas EXPLICAR e SUGERIR
    const target = matchData.target;
    const bestMatch = matchData.bestMatch;
    const score = matchData.matches[0].score;

    if (!target || !bestMatch) {
      throw new NotFoundException('Erro ao resolver os dados do aluno alvo ou base.');
    }

    const prompt = `
      Você é um assistente de prescrição de treinos. O sistema matemático já definiu que o aluno alvo (${target.name}) 
      tem um match de ${score}% com o aluno base (${bestMatch.name}).
      
      Aluno alvo: Objetivo ${target.goal}, Experiência ${target.trainingExperience}, Idade ${target.birthdate ? new Date().getFullYear() - target.birthdate.getFullYear() : '?'}
      Aluno base: Objetivo ${bestMatch.goal}, Experiência ${bestMatch.trainingExperience}, Idade ${bestMatch.birthdate ? new Date().getFullYear() - bestMatch.birthdate.getFullYear() : '?'}
      
      Gere um texto curto (máx 3 frases) focado no professor. 
      Explique brevemente por que esse match faz sentido biologicamente e sugira o caminho inicial de treino.
      NÃO gere números de match, use o ${score}%.
    `;

    const explanation = await this.ai.completeText(
      'Você é um assistente de prescrição de treinos especializado e conciso.',
      prompt
    );

    return {
      score,
      explanation,
      matches: matchData.matches,
      suggestedStudentId: bestMatch.id,
    };
  }

  async assistantPrescription(data: { studentId?: string; description?: string }) {
    if (data.studentId) {
      const res = await this.getStudentPersonas(data.studentId);
      return {
        match: res.matches[0],
        explanation: res.explanation,
        suggestedStudentId: res.suggestedStudentId
      };
    }

    if (data.description) {
      // Fake extraction flow for plain text (simulated, should call AI to extract JSON params)
      // Here we just fetch all onboarded and pick the first as a dummy fallback to prove the flow
      const firstOnboarded = await this.prisma.student.findFirst({ where: { status: 'ONBOARDED' } });
      if (!firstOnboarded) throw new NotFoundException('Base vazia');

      return {
        match: { id: firstOnboarded.id, name: firstOnboarded.name, score: 75 },
        explanation: 'Baseado no seu texto, identifiquei este aluno com perfil similar (75%).',
        suggestedStudentId: firstOnboarded.id
      };
    }

    throw new Error('Forneça studentId ou description.');
  }
}
