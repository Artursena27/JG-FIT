import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ---- Servir o frontend (Next export) no MESMO link, quando existir ----
  // No deploy combinado, o build copia o site para backend/client.
  const clientDir = join(__dirname, '..', 'client');
  if (existsSync(clientDir)) {
    // arquivos estaticos (_next, imagens, etc.)
    app.use(express.static(clientDir, { index: false, redirect: false }));
    // URLs "limpas": /login -> login.html, / -> index.html
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      const candidates = [
        join(clientDir, req.path),
        join(clientDir, `${req.path}.html`),
        join(clientDir, req.path, 'index.html'),
        join(clientDir, 'index.html'),
      ];
      for (const file of candidates) {
        try {
          if (existsSync(file) && statSync(file).isFile()) {
            return res.sendFile(file);
          }
        } catch {
          /* tenta o proximo */
        }
      }
      return next();
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`JG-FIT rodando em http://localhost:${port} (site + /api)`);
}
void bootstrap();
