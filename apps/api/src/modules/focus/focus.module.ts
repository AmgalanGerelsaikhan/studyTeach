import { Module } from '@nestjs/common';

import { AuditModule } from '../../lib/audit/audit.module';

import { FocusController } from './focus.controller';
import { FocusService } from './focus.service';

/**
 * Focus Mode — PRD §4.6 (P1).
 *
 * Teacher mints a 6-char code; students join; the student app restricts itself
 * to the assigned activity until either scheduled_end fires or the teacher
 * closes early. AI Tutor refusal hook (in AiTutorModule) consumes
 * FocusService.meActive() to gate questions during AI_TUTOR-kind sessions.
 */
@Module({
  imports: [AuditModule],
  controllers: [FocusController],
  providers: [FocusService],
  exports: [FocusService],
})
export class FocusModule {}
