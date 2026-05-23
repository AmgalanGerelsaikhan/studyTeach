import { Module } from '@nestjs/common';

import { StudyAbroadController } from './study-abroad.controller';
import { StudyAbroadService } from './study-abroad.service';

/**
 * Study Abroad Hub v2 — PRD §4.10a (Destination Blueprints) + §4.10b
 * (Scholarship Aggregator). P1 portions only; §4.10c AI Coach + §4.10d
 * Alumni Network are P2 and explicitly not scaffolded here.
 */
@Module({
  controllers: [StudyAbroadController],
  providers: [StudyAbroadService],
  exports: [StudyAbroadService],
})
export class StudyAbroadModule {}
