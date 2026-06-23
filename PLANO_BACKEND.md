# Plano de Backend — Plataforma do Personal (white-label, IA de Personas)

> Documento portátil. Copiar para a raiz do repositório novo como `PLANO_BACKEND.md`.

## Decisões travadas

| Tema | Decisão |
|---|---|
| Stack backend | **NestJS + TypeScript + Prisma** |
| Persistência / Auth / Storage | **Supabase** (Postgres + Auth + Storage para fotos/vídeos) |
| Tenancy | **Single-tenant por enquanto** (1 personal). Schema desenhado para virar multi-tenant depois sem reescrever. |
| Motor de Personas v1 | **API da OpenAI** (`OPENAI_API_KEY`, modelo `gpt-4o-mini` por default) — mesma chave já usada no projeto IECB |
| Frontend (fora do nosso escopo) | Next.js / React / Tailwind / shadcn |

### Sobre o motor de personas (importante)
Mandar o banco inteiro pro LLM não escala. Para 1 personal (dezenas a centenas de alunos) o v1 faz:
1. **Pré-filtro numérico em SQL** — calcula distância ponderada (idade, peso, altura, objetivo, frequência) e pega os top ~10 candidatos.
2. **OpenAI ranqueia e explica** — manda os perfis compactos dos candidatos + o aluno novo; recebe de volta o % de compatibilidade e as sugestões em texto ("Pedro evoluiu bem com periodização X...").
3. **Cache** — resultado salvo em `PersonaMatch` pra não chamar a API a cada visualização.

Isso mantém custo baixo, é explicável e escala. Quando crescer, migra o pré-filtro pra `pgvector`.

---

## Arquitetura

```
backend/  (NestJS)
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/            guards, interceptors, supabase client, prisma service
│   ├── auth/              valida JWT do Supabase, RolesGuard (PROFESSOR | ALUNO)
│   ├── students/          alunos (CRUD, perfil, persona profile)
│   ├── exercises/         catálogo de exercícios (nome, grupo muscular, vídeo)
│   ├── workouts/          treinos + periodização + template
│   ├── schedule/          painel da semana (dia → treino/cardio/descanso)
│   ├── assessments/       avaliações físicas, medidas, fotos de evolução
│   ├── logs/              sessões de treino, cargas, assiduidade/adesão
│   ├── chat/              aluno ↔ professor
│   ├── personas/          MOTOR DE IA (pré-filtro + OpenAI + cache)
│   └── ai/                OpenAiService compartilhado
└── prisma/schema.prisma
```

- **Auth**: Supabase Auth emite JWT. NestJS valida o JWT (JWKS do Supabase) e injeta `user` + `role`. Backend usa a **service-role key** do Supabase pra falar com o Postgres/Storage.
- **DB**: Prisma conecta na connection string do Postgres do Supabase. RLS pode ficar ligado por segurança, mas o acesso principal é via backend (service role).
- **Storage**: bucket `evolution-photos` (privado) + `exercise-videos`. URLs assinadas.

---

## Modelo de dados (Prisma — esboço)

- **User** — espelha o usuário do Supabase Auth. `role: PROFESSOR | ALUNO`.
- **Student** — perfil do aluno: `name, birthdate, sex, heightCm, weightKg, goal, weeklyFrequency, bodyFatPct, notes`, FK para User.
- **Exercise** — catálogo: `name, muscleGroup, videoUrl, instructions`.
- **Workout** — treino "A/B/C...", pode ser template ou do aluno. `name, label, isTemplate`.
- **WorkoutExercise** — exercício dentro do treino: `sets, reps, loadKg, restSec, order`.
- **Periodization** — programa em semanas, agrupa workouts.
- **WeeklyScheduleItem** — `dayOfWeek → tipo (TREINO/CARDIO/DESCANSO) + workoutId?`.
- **Assessment** — avaliação física: `date, weightKg, bodyFatPct, circumferences (JSON)`.
- **Measurement** — série temporal de peso/medidas.
- **ProgressPhoto** — `date, storagePath, angle (frente/lado/costas)`.
- **WorkoutLog** — sessão registrada: `date, workoutId, loadsUsed (JSON), completed` → alimenta assiduidade/adesão.
- **ChatMessage** — `from, to, body, sentAt`.
- **PersonaMatch** — cache do motor: `studentId, results (JSON: [{matchStudentId, score, reasons}])`, `computedAt`.

Campo `tenantId` (nullable) já incluído em cada entidade-chave para a migração multi-tenant futura — fica `null`/fixo no v1.

---

## Fases de execução (no repo novo)

### Fase 0 — Scaffold
- `nest new` + Prisma + cliente Supabase + `.env` (copiar `OPENAI_API_KEY` do projeto IECB).
- PrismaService, SupabaseService, config validada (Zod/Joi).

### Fase 1 — Modelo de dados
- `schema.prisma` completo + primeira migration no Postgres do Supabase.
- Seed: 1 professor, alguns exercícios, alunos de exemplo (pra testar o motor de personas).

### Fase 2 — Auth & papéis
- Validação do JWT do Supabase + `RolesGuard` (`@Roles(PROFESSOR)` / `@Roles(ALUNO)`).

### Fase 3 — Módulo Professor (MVP)
- CRUD alunos, CRUD exercícios, CRUD treinos/periodização, montar agenda da semana.
- Dashboard: nº de alunos, adesão, avaliações recentes.

### Fase 4 — Módulo Aluno (MVP)
- Painel da semana, histórico de treinos, avaliações, medidas, fotos, chat.

### Fase 5 — Motor de Personas (IA v1)
- Pré-filtro de distância em SQL → top candidatos.
- `OpenAiService` ranqueia + gera % e sugestões em texto → salva em `PersonaMatch`.
- Endpoint `GET /students/:id/personas`.

### Fase 6 — Recomendação de treinos históricos
- "Alunos parecidos responderam melhor a X" usando os matches + WorkoutLogs.

---

## MVP — o que entrega no fim
- **Aluno**: login, treinos da semana, histórico, avaliações.
- **Professor**: cadastro de alunos, cadastro de treinos, dashboard.
- **IA v1**: busca de personas similares, sugestão de alunos parecidos, recomendação de treinos históricos.

---

## Endpoints principais (REST)
```
POST   /auth/...            (delegado ao Supabase Auth no front; backend só valida)
GET    /students            (professor)
POST   /students
GET    /students/:id
GET    /students/:id/personas      ← motor de IA
GET    /exercises  POST /exercises
GET    /workouts   POST /workouts  PATCH /workouts/:id
GET    /students/:id/schedule      ← painel da semana
GET    /students/:id/assessments   POST .../assessments
POST   /students/:id/photos        (Supabase Storage, URL assinada)
GET    /students/:id/logs          POST .../logs
GET    /chat/:studentId            POST /chat
GET    /dashboard                  (professor)
```
