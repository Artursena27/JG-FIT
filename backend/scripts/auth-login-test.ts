/**
 * Script de teste do login (Supabase Auth).
 * 1. Cria (idempotente) o usuario professor no Supabase Auth.
 * 2. Faz login e imprime o access_token (o "cracha digital").
 *
 * Uso: npm run auth:test-user
 * Depois: curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/auth/me
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const email = process.env.PROFESSOR_EMAIL || 'professor@jgfit.com';
const password = process.env.TEST_USER_PASSWORD || 'JgFit@12345';

async function main() {
  if (!url || !serviceKey || !anonKey) {
    throw new Error('Faltam SUPABASE_URL / SERVICE_ROLE_KEY / ANON_KEY no .env');
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. cria o usuario (ja confirmado). Se ja existir, ignora.
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr && !/already|exist|registered/i.test(createErr.message)) {
    throw createErr;
  }
  console.log(
    createErr ? `Usuario ${email} ja existia.` : `Usuario ${email} criado.`,
  );

  // 2. faz login com a chave publica (como o frontend faria)
  const pub = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error: signErr } = await pub.auth.signInWithPassword({
    email,
    password,
  });
  if (signErr) throw signErr;

  const token = data.session?.access_token;
  console.log('\n=== LOGIN OK ===');
  console.log('email:', email);
  console.log('senha:', password);
  console.log('\nACCESS TOKEN (cracha digital):\n');
  console.log(token);
  const port = process.env.PORT || '3333';
  console.log('\nTeste a rota protegida:');
  console.log(
    `curl -H "Authorization: Bearer ${token}" http://localhost:${port}/api/auth/me`,
  );
}

main().catch((e) => {
  console.error('Falhou:', e.message ?? e);
  process.exit(1);
});
