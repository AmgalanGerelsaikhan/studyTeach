import 'reflect-metadata';
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { loadEnv } from './lib/config/env';

async function bootstrap(): Promise<void> {
  // Load + validate env BEFORE Nest does anything. Crash early on misconfig
  // — per CLAUDE.md hard constraint #11: env vars must be confirmed loaded.
  const env = loadEnv();

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: env.WEB_ORIGIN,
      credentials: true,
    },
  });

  app.use(cookieParser(env.SESSION_SECRET));
  await app.listen(env.API_PORT);

  // eslint-disable-next-line no-console
  console.log(
    `[@studyteach/api] listening on :${env.API_PORT} · env=${env.NODE_ENV} · llm=${env.LLM_VENDOR}`,
  );
}

bootstrap().catch((err: unknown) => {
  console.error('[@studyteach/api] bootstrap failed:', err);
  process.exit(1);
});
