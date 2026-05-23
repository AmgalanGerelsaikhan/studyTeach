import { Module } from '@nestjs/common';

import { AppCoachController } from './app-coach.controller';
import { AppCoachService } from './app-coach.service';

/**
 * AI Application Coach — PRD §4.10c (P2).
 *
 * LlmModule + AuditModule are both @Global (see lib/llm/llm.module.ts +
 * lib/audit/audit.module.ts), so they don't need to be imported here.
 * Listing them in `imports` would be a no-op.
 */
@Module({
  controllers: [AppCoachController],
  providers: [AppCoachService],
  exports: [AppCoachService],
})
export class AppCoachModule {}
