// Copia o site exportado (frontend/out) para dentro do backend (backend/client),
// de onde o NestJS serve os arquivos no mesmo link da API.
const { cpSync, existsSync, rmSync } = require('fs');

const src = 'frontend/out';
const dest = 'backend/client';

if (!existsSync(src)) {
  console.error(`[copy-client] ${src} nao encontrado. Rode o build do frontend antes.`);
  process.exit(1);
}

if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`[copy-client] ${src} -> ${dest} OK`);
