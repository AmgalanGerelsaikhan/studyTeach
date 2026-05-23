/**
 * One-shot manual trigger for the scholarship watch dispatcher.
 *
 *   pnpm --filter @studyteach/api exec tsx scripts/run-watch-dispatcher.ts
 *
 * Bootstraps a minimal NestApplicationContext so the cron service can fire
 * outside its hourly schedule. Useful for verifying the dispatch path in
 * dev without waiting for the next top-of-hour, and for the eventual
 * end-of-quarter "did the SMS reminder pipeline actually work" audit.
 */
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { ScholarshipWatchDispatcher } from '../src/modules/study-abroad/watch-dispatcher.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const dispatcher = app.get(ScholarshipWatchDispatcher);
  await dispatcher.dispatch();
  await app.close();
}

main().catch((err: unknown) => {
  console.error('[run-watch-dispatcher] failed:', err);
  process.exit(1);
});
