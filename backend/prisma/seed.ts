import 'dotenv/config';
import { PrismaClient, Goal, Sex, Role } from '@prisma/client';

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
