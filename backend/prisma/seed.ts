import 'dotenv/config';
import {
  PrismaClient,
  Goal,
  Sex,
  Role,
  DayOfWeek,
  ScheduleType,
  SubscriptionStatus,
  NotificationType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- Professor (dono da plataforma) ---
  // E-mail vem do .env (PROFESSOR_EMAIL) para bater com o login real.
  const professorEmail = process.env.PROFESSOR_EMAIL ?? 'professor@jgfit.com';
  const professor = await prisma.user.upsert({
    where: { email: professorEmail },
    update: { role: Role.PROFESSOR },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: professorEmail,
      name: 'JG (Personal)',
      role: Role.PROFESSOR,
    },
  });

  // --- Exercicios base ---
  const exercisesData = [
    { name: 'Supino reto', muscleGroup: 'Peito' },
    { name: 'Agachamento livre', muscleGroup: 'Pernas' },
    { name: 'Levantamento terra', muscleGroup: 'Costas' },
    { name: 'Desenvolvimento militar', muscleGroup: 'Ombros' },
    { name: 'Rosca direta', muscleGroup: 'Biceps' },
    { name: 'Triceps testa', muscleGroup: 'Triceps' },
    { name: 'Remada curvada', muscleGroup: 'Costas' },
    { name: 'Leg press', muscleGroup: 'Pernas' },
  ];
  for (const ex of exercisesData) {
    const exists = await prisma.exercise.findFirst({ where: { name: ex.name } });
    if (!exists) await prisma.exercise.create({ data: ex });
  }

  // --- Alunos variados (alimentam o motor de personas) ---
  const studentsData = [
    { name: 'Pedro',   birthYear: 2007, sex: Sex.MASCULINO, goal: Goal.HIPERTROFIA,    weeklyFrequency: 5, weightKg: 72, heightCm: 178, bodyFatPct: 14 },
    { name: 'Gabriel', birthYear: 2005, sex: Sex.MASCULINO, goal: Goal.HIPERTROFIA,    weeklyFrequency: 5, weightKg: 70, heightCm: 180, bodyFatPct: 12 },
    { name: 'Matheus', birthYear: 2003, sex: Sex.MASCULINO, goal: Goal.HIPERTROFIA,    weeklyFrequency: 4, weightKg: 75, heightCm: 175, bodyFatPct: 16 },
    { name: 'Ana',     birthYear: 1997, sex: Sex.FEMININO,  goal: Goal.EMAGRECIMENTO,  weeklyFrequency: 3, weightKg: 65, heightCm: 165, bodyFatPct: 28 },
    { name: 'Carla',   birthYear: 1990, sex: Sex.FEMININO,  goal: Goal.SAUDE,          weeklyFrequency: 2, weightKg: 70, heightCm: 160, bodyFatPct: 30 },
    { name: 'Rafael',  birthYear: 2001, sex: Sex.MASCULINO, goal: Goal.FORCA,          weeklyFrequency: 4, weightKg: 88, heightCm: 182, bodyFatPct: 18 },
  ];

  for (const s of studentsData) {
    const exists = await prisma.student.findFirst({ where: { name: s.name } });
    if (exists) continue;
    await prisma.student.create({
      data: {
        name: s.name,
        birthdate: new Date(`${s.birthYear}-01-01`),
        sex: s.sex,
        goal: s.goal,
        weeklyFrequency: s.weeklyFrequency,
        weightKg: s.weightKg,
        heightCm: s.heightCm,
        bodyFatPct: s.bodyFatPct,
        status: 'ONBOARDED',
        trainingExperience: 'INTERMEDIARIO',
        trainingTime: '2 anos',
        trainingLocation: 'Academia',
        equipment: 'Maquinas e pesos livres',
        availableDays: ['SEG', 'TER', 'QUA', 'QUI', 'SEX'],
      },
    });
  }

  // --- Garante status ONBOARDED nos alunos de base ---
  // O loop acima usa "if (exists) continue", entao alunos ja criados em rodadas
  // anteriores NAO sao atualizados. Forcamos aqui (idempotente) para que o motor
  // de personas tenha sempre uma base de perfis com status ONBOARDED.
  const baseStudentNames = studentsData.map((s) => s.name);
  await prisma.student.updateMany({
    where: { name: { in: baseStudentNames } },
    data: { status: 'ONBOARDED' },
  });

  // --- Aluno de teste real (com login): dados completos pra destravar telas ---
  // Procuramos por name 'aluno.teste'. Se nao existir, nao criamos um Student do
  // zero (ele nasce do fluxo de cadastro/onboarding com userId real); apenas
  // enriquecemos quando ja existir.
  const tester = await prisma.student.findFirst({
    where: { name: 'aluno.teste' },
  });

  if (tester) {
    const studentId = tester.id;

    // Garante status ONBOARDED e biometria minima para as telas nao quebrarem.
    await prisma.student.update({
      where: { id: studentId },
      data: {
        status: 'ONBOARDED',
        sex: tester.sex ?? Sex.MASCULINO,
        goal: tester.goal ?? Goal.HIPERTROFIA,
        birthdate: tester.birthdate ?? new Date('1998-01-01'),
        heightCm: tester.heightCm ?? 176,
        weightKg: tester.weightKg ?? 80,
        bodyFatPct: tester.bodyFatPct ?? 20,
        weeklyFrequency: tester.weeklyFrequency ?? 4,
        sessionMinutes: tester.sessionMinutes ?? 60,
        trainingExperience: tester.trainingExperience ?? 'INTERMEDIARIO',
        trainingTime: tester.trainingTime ?? '2 anos',
        trainingLocation: tester.trainingLocation ?? 'Academia',
        equipment: tester.equipment ?? 'Maquinas e pesos livres',
        availableDays:
          (tester.availableDays as unknown) ??
          (['SEG', 'TER', 'QUA', 'QUI', 'SEX'] as unknown as object),
      },
    });

    // Helper: resolve um exercicio do catalogo por nome (precisa ja existir).
    const findExercise = (name: string) =>
      prisma.exercise.findFirst({ where: { name } });

    // 2 treinos (A e B) com 3-4 WorkoutExercise cada. Idempotente via findFirst.
    const workoutA = await prisma.workout.findFirst({
      where: { studentId, label: 'A' },
    });
    if (!workoutA) {
      const supino = await findExercise('Supino reto');
      const desenvolvimento = await findExercise('Desenvolvimento militar');
      const triceps = await findExercise('Triceps testa');
      const remada = await findExercise('Remada curvada');
      const exercisesA = [
        { ex: supino, order: 0, sets: 4, reps: '8-12', loadKg: 60, restSec: 90 },
        {
          ex: desenvolvimento,
          order: 1,
          sets: 3,
          reps: '10-12',
          loadKg: 30,
          restSec: 75,
        },
        { ex: triceps, order: 2, sets: 3, reps: '12-15', loadKg: 20, restSec: 60 },
        { ex: remada, order: 3, sets: 4, reps: '10', loadKg: 50, restSec: 90 },
      ].filter((e) => e.ex);
      await prisma.workout.create({
        data: {
          name: 'Treino A — Superiores',
          label: 'A',
          studentId,
          exercises: {
            create: exercisesA.map((e) => ({
              exerciseId: e.ex!.id,
              order: e.order,
              sets: e.sets,
              reps: e.reps,
              loadKg: e.loadKg,
              restSec: e.restSec,
            })),
          },
        },
      });
    }

    const workoutB = await prisma.workout.findFirst({
      where: { studentId, label: 'B' },
    });
    if (!workoutB) {
      const agachamento = await findExercise('Agachamento livre');
      const legPress = await findExercise('Leg press');
      const terra = await findExercise('Levantamento terra');
      const rosca = await findExercise('Rosca direta');
      const exercisesB = [
        {
          ex: agachamento,
          order: 0,
          sets: 4,
          reps: '8-10',
          loadKg: 80,
          restSec: 120,
        },
        { ex: legPress, order: 1, sets: 4, reps: '12', loadKg: 150, restSec: 90 },
        { ex: terra, order: 2, sets: 3, reps: '6-8', loadKg: 90, restSec: 120 },
        { ex: rosca, order: 3, sets: 3, reps: '12-15', loadKg: 15, restSec: 60 },
      ].filter((e) => e.ex);
      await prisma.workout.create({
        data: {
          name: 'Treino B — Inferiores',
          label: 'B',
          studentId,
          exercises: {
            create: exercisesB.map((e) => ({
              exerciseId: e.ex!.id,
              order: e.order,
              sets: e.sets,
              reps: e.reps,
              loadKg: e.loadKg,
              restSec: e.restSec,
            })),
          },
        },
      });
    }

    // Agenda semanal: SEG/QUI = Treino A, TER/SEX = Treino B, QUA = CARDIO,
    // SAB/DOM = DESCANSO. Idempotente via upsert por studentId_dayOfWeek.
    const treinoA = await prisma.workout.findFirst({
      where: { studentId, label: 'A' },
    });
    const treinoB = await prisma.workout.findFirst({
      where: { studentId, label: 'B' },
    });
    const scheduleItems: Array<{
      dayOfWeek: DayOfWeek;
      type: ScheduleType;
      workoutId: string | null;
    }> = [
      { dayOfWeek: DayOfWeek.SEGUNDA, type: ScheduleType.TREINO, workoutId: treinoA?.id ?? null },
      { dayOfWeek: DayOfWeek.TERCA, type: ScheduleType.TREINO, workoutId: treinoB?.id ?? null },
      { dayOfWeek: DayOfWeek.QUARTA, type: ScheduleType.CARDIO, workoutId: null },
      { dayOfWeek: DayOfWeek.QUINTA, type: ScheduleType.TREINO, workoutId: treinoA?.id ?? null },
      { dayOfWeek: DayOfWeek.SEXTA, type: ScheduleType.TREINO, workoutId: treinoB?.id ?? null },
      { dayOfWeek: DayOfWeek.SABADO, type: ScheduleType.DESCANSO, workoutId: null },
      { dayOfWeek: DayOfWeek.DOMINGO, type: ScheduleType.DESCANSO, workoutId: null },
    ];
    for (const item of scheduleItems) {
      await prisma.weeklyScheduleItem.upsert({
        where: {
          studentId_dayOfWeek: { studentId, dayOfWeek: item.dayOfWeek },
        },
        update: { type: item.type, workoutId: item.workoutId },
        create: {
          studentId,
          dayOfWeek: item.dayOfWeek,
          type: item.type,
          workoutId: item.workoutId,
        },
      });
    }

    // 3 Assessment em datas diferentes (peso decrescente -> evolucao visivel).
    const hasAssessments = await prisma.assessment.findFirst({
      where: { studentId },
    });
    if (!hasAssessments) {
      await prisma.assessment.createMany({
        data: [
          {
            studentId,
            date: new Date('2026-04-01'),
            weightKg: 84,
            bodyFatPct: 22,
            circumferences: { braco: 36, cintura: 88, coxa: 58 },
            notes: 'Avaliacao inicial',
          },
          {
            studentId,
            date: new Date('2026-05-01'),
            weightKg: 82,
            bodyFatPct: 20.5,
            circumferences: { braco: 37, cintura: 85, coxa: 59 },
            notes: 'Boa adesao no primeiro mes',
          },
          {
            studentId,
            date: new Date('2026-06-01'),
            weightKg: 80,
            bodyFatPct: 19,
            circumferences: { braco: 38, cintura: 82, coxa: 60 },
            notes: 'Evolucao consistente',
          },
        ],
      });
    }

    // 2 Measurement (acompanhamento rapido de peso/gordura).
    const hasMeasurements = await prisma.measurement.findFirst({
      where: { studentId },
    });
    if (!hasMeasurements) {
      await prisma.measurement.createMany({
        data: [
          {
            studentId,
            date: new Date('2026-05-15'),
            weightKg: 81,
            bodyFatPct: 19.8,
            extra: { fonte: 'balanca bioimpedancia' },
          },
          {
            studentId,
            date: new Date('2026-06-15'),
            weightKg: 79.5,
            bodyFatPct: 18.6,
            extra: { fonte: 'balanca bioimpedancia' },
          },
        ],
      });
    }

    // WorkoutLog completados (alimentam adesao no dashboard). Idempotente.
    const hasLogs = await prisma.workoutLog.findFirst({ where: { studentId } });
    if (!hasLogs) {
      const logTarget = treinoA ?? treinoB;
      await prisma.workoutLog.createMany({
        data: [
          {
            studentId,
            workoutId: logTarget?.id ?? null,
            date: new Date('2026-06-15'),
            completed: true,
            notes: 'Treino concluido',
          },
          {
            studentId,
            workoutId: treinoB?.id ?? logTarget?.id ?? null,
            date: new Date('2026-06-17'),
            completed: true,
            notes: 'Treino concluido',
          },
        ],
      });
    }

    // Plano alimentar (1 por aluno). Idempotente via upsert por studentId unico.
    await prisma.dietPlan.upsert({
      where: { studentId },
      update: {},
      create: {
        studentId,
        calories: 2200,
        protein: 160,
        carbs: 220,
        fat: 70,
        waterLiters: 3,
        notes: 'Plano inicial',
      },
    });

    // Assinatura ATIVA com vencimento ~30 dias a frente. Idempotente via upsert.
    const dueInThirtyDays = new Date();
    dueInThirtyDays.setDate(dueInThirtyDays.getDate() + 30);
    await prisma.subscription.upsert({
      where: { studentId },
      update: {},
      create: {
        studentId,
        status: SubscriptionStatus.ACTIVE,
        planName: 'Mensal',
        dueDate: dueInThirtyDays,
      },
    });

    // Notificacoes do aluno (sem unique no schema): cria so se ainda nao houver
    // nenhuma para este studentId, evitando duplicar a cada rodada do seed.
    const hasNotifications = await prisma.notification.findFirst({
      where: { studentId },
    });
    if (!hasNotifications) {
      await prisma.notification.createMany({
        data: [
          {
            studentId,
            userId: tester.userId,
            type: NotificationType.TREINO,
            title: 'Novo treino disponível',
            message: 'Seu novo treino já está disponível no app.',
            isRead: false,
          },
          {
            studentId,
            userId: tester.userId,
            type: NotificationType.PAGAMENTO,
            title: 'Mensalidade em dia',
            message: 'Recebemos o pagamento da sua mensalidade. Obrigado!',
            isRead: false,
          },
          {
            studentId,
            userId: tester.userId,
            type: NotificationType.GERAL,
            title: 'Bem-vindo!',
            message: 'Bem-vindo ao JG-FIT. Bons treinos!',
            isRead: true,
          },
        ],
      });
    }
  }

  // --- Aluno inadimplente (alimenta a lista de inadimplentes do professor) ---
  // Marca um aluno de base (Rafael) com assinatura OVERDUE e vencimento no
  // passado. Idempotente via upsert por studentId unico.
  const rafael = await prisma.student.findFirst({ where: { name: 'Rafael' } });
  if (rafael) {
    const dueTenDaysAgo = new Date();
    dueTenDaysAgo.setDate(dueTenDaysAgo.getDate() - 10);
    await prisma.subscription.upsert({
      where: { studentId: rafael.id },
      update: {},
      create: {
        studentId: rafael.id,
        status: SubscriptionStatus.OVERDUE,
        planName: 'Mensal',
        dueDate: dueTenDaysAgo,
      },
    });
  }

  const totalStudents = await prisma.student.count();
  const totalExercises = await prisma.exercise.count();
  console.log(
    `Seed OK — professor: ${professor.email} | alunos: ${totalStudents} | exercicios: ${totalExercises}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
