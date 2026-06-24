import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OpenAiService } from '../ai/openai.service';
import { Student, Goal, Sex, TrainingExperience, Prisma } from '@prisma/client';

// Janela de validade do cache de personas (24h). Passado isso, recalcula.
const PERSONA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Parametros estruturados extraidos de uma descricao em texto livre pela IA.
interface ExtractedParams {
  age?: number;
  sex?: Sex;
  goal?: Goal;
  weightKg?: number;
  heightCm?: number;
  weeklyFrequency?: number;
  experience?: TrainingExperience;
}

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
    // 1) Tenta reaproveitar o cache persistido em PersonaMatch (validade de 24h).
    const cached = await this.prisma.personaMatch.findUnique({
      where: { studentId },
    });
    if (cached && Date.now() - cached.computedAt.getTime() < PERSONA_CACHE_TTL_MS) {
      // O cache guarda tanto o resultado completo quanto o "vazio"; devolvemos
      // exatamente o que foi gravado, sem recalcular nem chamar a IA de novo.
      return cached.results as unknown as Awaited<ReturnType<PersonasService['rankAndExplain']>>;
    }

    // 2) Cache ausente ou expirado: recalcula on-the-fly.
    const matchData = await this.findTopMatches(studentId);
    if (matchData.matches.length === 0) {
      const empty = this.buildEmptyResult();
      await this.persistCache(studentId, empty);
      return empty;
    }

    const target = matchData.target;
    const bestMatch = matchData.bestMatch;

    if (!target || !bestMatch) {
      throw new NotFoundException('Erro ao resolver os dados do aluno alvo ou base.');
    }

    const result = await this.rankAndExplain(target, matchData.matches, bestMatch);

    // 3) Grava (ou atualiza) o cache para a proxima chamada.
    await this.persistCache(studentId, result);

    return result;
  }

  /**
   * Resultado padrao quando nao ha base suficiente para comparar.
   */
  private buildEmptyResult() {
    return {
      score: 0,
      explanation: 'Ainda não há alunos suficientes na base para uma comparação confiável.',
      matches: [] as { id: string; name: string; score: number }[],
      suggestedStudentId: null as string | null,
    };
  }

  /**
   * Monta a explicacao textual via IA (a IA NAO gera o score; ela so explica
   * o match ja calculado matematicamente) e devolve o payload final.
   * Reutilizado tanto pela rota por studentId quanto pelo fluxo de texto livre.
   */
  private async rankAndExplain(
    target: Partial<Student>,
    matches: { id: string; name: string; score: number }[],
    bestMatch: Student,
  ) {
    const score = matches[0].score;
    const targetName = target.name ?? 'o perfil informado';
    const targetAge = target.birthdate
      ? new Date().getFullYear() - target.birthdate.getFullYear()
      : '?';
    const bestMatchAge = bestMatch.birthdate
      ? new Date().getFullYear() - bestMatch.birthdate.getFullYear()
      : '?';

    const prompt = `
      Você é um assistente de prescrição de treinos. O sistema matemático já definiu que o aluno alvo (${targetName})
      tem um match de ${score}% com o aluno base (${bestMatch.name}).

      Aluno alvo: Objetivo ${target.goal}, Experiência ${target.trainingExperience}, Idade ${targetAge}
      Aluno base: Objetivo ${bestMatch.goal}, Experiência ${bestMatch.trainingExperience}, Idade ${bestMatchAge}

      Gere um texto curto (máx 3 frases) focado no professor.
      Explique brevemente por que esse match faz sentido biologicamente e sugira o caminho inicial de treino.
      NÃO gere números de match, use o ${score}%.
    `;

    const explanation = await this.ai.completeText(
      'Você é um assistente de prescrição de treinos especializado e conciso.',
      prompt,
    );

    return {
      score,
      explanation,
      matches,
      suggestedStudentId: bestMatch.id,
    };
  }

  /**
   * Persiste o resultado em PersonaMatch (cache por studentId). Upsert
   * idempotente: cria na primeira vez e atualiza nas seguintes, renovando
   * o computedAt para reiniciar a janela de validade.
   */
  private async persistCache(studentId: string, result: object) {
    const results = result as unknown as Prisma.InputJsonValue;
    await this.prisma.personaMatch.upsert({
      where: { studentId },
      create: { studentId, results, computedAt: new Date() },
      update: { results, computedAt: new Date() },
    });
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
      // 1) Usa a IA SO para extrair parametros estruturados do texto livre (PT).
      //    A IA nao pontua nada — quem pontua e o nosso score deterministico.
      const params = await this.extractParams(data.description);

      // 2) Monta um alvo sintetico (Partial<Student>) a partir dos parametros
      //    e roda a MESMA logica de similaridade contra os alunos ONBOARDED.
      const target = this.paramsToTarget(params);

      const candidates = await this.prisma.student.findMany({
        where: { status: 'ONBOARDED' },
      });

      if (candidates.length === 0) {
        return {
          match: null,
          explanation:
            'Ainda não há alunos onboardados na base para comparar com a descrição informada.',
          matches: [] as { id: string; name: string; score: number }[],
          suggestedStudentId: null,
        };
      }

      const scored = candidates
        .map((s) => ({ student: s, score: this.calculateSimilarityScore(target, s) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const matches = scored.map((m) => ({
        id: m.student.id,
        name: m.student.name,
        score: m.score,
      }));
      const bestMatch = scored[0].student;

      const result = await this.rankAndExplain(target, matches, bestMatch);

      return {
        match: result.matches[0],
        explanation: result.explanation,
        matches: result.matches,
        suggestedStudentId: result.suggestedStudentId,
      };
    }

    throw new Error('Forneça studentId ou description.');
  }

  /**
   * Extrai parametros estruturados de uma descricao em texto livre (PT) via IA.
   * A IA devolve apenas JSON; campos ausentes/desconhecidos ficam de fora.
   */
  private async extractParams(description: string): Promise<ExtractedParams> {
    const system =
      'Você é um extrator de dados de fichas de alunos de academia. ' +
      'Receba uma descrição em português e devolva SOMENTE um objeto JSON com os campos que conseguir inferir. ' +
      'Não invente valores: omita o campo se não houver evidência no texto.';

    const user = `
      Extraia os parâmetros do aluno descrito abaixo e responda em JSON com este formato:
      {
        "age": number,                 // idade em anos
        "sex": "MASCULINO" | "FEMININO",
        "goal": "HIPERTROFIA" | "EMAGRECIMENTO" | "CONDICIONAMENTO" | "FORCA" | "SAUDE" | "REABILITACAO",
        "weightKg": number,
        "heightCm": number,
        "weeklyFrequency": number,     // dias de treino por semana
        "experience": "INICIANTE" | "INTERMEDIARIO" | "AVANCADO"
      }
      Use exatamente esses valores de enum (em maiúsculas, sem acento). Omita o que não souber.

      Descrição: "${description}"
    `;

    return this.ai.completeJson<ExtractedParams>(system, user);
  }

  /**
   * Converte os parametros extraidos em um alvo Partial<Student> compativel
   * com calculateSimilarityScore. Idade vira birthdate (1 de janeiro do ano);
   * valores de enum invalidos sao descartados para nao quebrar o score.
   */
  private paramsToTarget(params: ExtractedParams): Partial<Student> {
    const target: Partial<Student> = {};

    if (typeof params.age === 'number' && params.age > 0) {
      const birthYear = new Date().getFullYear() - Math.round(params.age);
      target.birthdate = new Date(`${birthYear}-01-01`);
    }
    if (params.sex && Object.values(Sex).includes(params.sex)) {
      target.sex = params.sex;
    }
    if (params.goal && Object.values(Goal).includes(params.goal)) {
      target.goal = params.goal;
    }
    if (
      params.experience &&
      Object.values(TrainingExperience).includes(params.experience)
    ) {
      target.trainingExperience = params.experience;
    }
    if (typeof params.weightKg === 'number') target.weightKg = params.weightKg;
    if (typeof params.heightCm === 'number') target.heightCm = params.heightCm;
    if (typeof params.weeklyFrequency === 'number') {
      target.weeklyFrequency = params.weeklyFrequency;
    }

    return target;
  }
}
