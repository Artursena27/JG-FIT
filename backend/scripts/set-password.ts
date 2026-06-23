/**
 * Define/atualiza a senha de um usuario no Supabase Auth (admin).
 * Uso: ts-node scripts/set-password.ts <email> <senha>
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];
const password = process.argv[3];

async function main() {
  if (!email || !password) {
    throw new Error('Uso: ts-node scripts/set-password.ts <email> <senha>');
  }
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // procura o usuario pelo e-mail
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (user) {
    const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
      password,
    });
    if (upErr) throw upErr;
    console.log(`Senha atualizada para ${email} (id ${user.id}).`);
  } else {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (cErr) throw cErr;
    console.log(`Usuario ${email} criado (id ${created.user?.id}).`);
  }
}

main().catch((e) => {
  console.error('Falhou:', e.message ?? e);
  process.exit(1);
});
