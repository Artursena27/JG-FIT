import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient, Role } from '@prisma/client';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Key is missing in .env');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

async function main() {
  const email = 'jgpersonaltrainer01@gmail.com';
  const password = '123456'; // senha padrao

  console.log(`Buscando usuario no Supabase: ${email}`);
  
  // Tenta criar o usuario no Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId: string;

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('User already registered')) {
        console.log('Usuario ja existe no Supabase Auth. Buscando ID...');
        // Busca o ID na lista de usuarios
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existing = users.users.find(u => u.email === email);
        if (!existing) {
             throw new Error('Falha ao encontrar usuario existente.');
        }
        userId = existing.id;
        console.log(`ID encontrado: ${userId}. Atualizando senha...`);
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    } else {
        throw new Error(`Erro Supabase: ${authError.message}`);
    }
  } else {
    userId = authData.user.id;
    console.log(`Usuario criado no Supabase Auth com ID: ${userId}`);
  }

  // Cria ou atualiza no Prisma
  const professor = await prisma.user.upsert({
    where: { email },
    update: { role: Role.PROFESSOR, id: userId }, // Atualiza o ID caso ja exista mas com ID errado
    create: {
      id: userId,
      email,
      name: 'JG (Personal)',
      role: Role.PROFESSOR,
    },
  });

  console.log('Professor cadastrado com sucesso no banco de dados!');
  console.log('Email:', professor.email);
  console.log('Role:', professor.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
