import { Module } from '@nestjs/common';

import { AuditModule } from '../../lib/audit/audit.module';

import { WellbeingController } from './wellbeing.controller';
import { WellbeingService } from './wellbeing.service';

/**
 * Wellbeing Pulse (PRD §4.7a, P2). Anonymous weekly mental-health pulse
 * for boarding students + counselor-only crisis-flag inbox.
 *
 * CLAUDE.md hard constraint #6: wellbeing data is sacrosanct — never
 * trained on, never logged outside the audit trail, de-anonymised only
 * via the crisis-flag pathway. The crisis classifier is keyword-based v1;
 * PRD §10.2 P2 launch gate requires precision ≥0.85 / recall ≥0.90
 * before this ships to production cohorts.
 */
@Module({
  imports: [AuditModule],
  controllers: [WellbeingController],
  providers: [WellbeingService],
  exports: [WellbeingService],
})
export class WellbeingModule {}
