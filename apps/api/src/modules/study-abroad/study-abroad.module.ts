import { Module } from '@nestjs/common';

import { SmsModule } from '../sms/sms.module';

import { ScholarshipWatchDispatcher } from './watch-dispatcher.service';
import { StudyAbroadController } from './study-abroad.controller';
import { StudyAbroadService } from './study-abroad.service';

/**
 * Study Abroad Hub v2 — PRD §4.10a (Destination Blueprints) + §4.10b
 * (Scholarship Aggregator). P1 portions only; §4.10c AI Coach + §4.10d
 * Alumni Network are P2 and explicitly not scaffolded here.
 *
 * The hourly ScholarshipWatchDispatcher fires the deadline-reminder SMS
 * for due watches. @nestjs/schedule's ScheduleModule.forRoot() is wired
 * once in AppModule.
 */
@Module({
  imports: [SmsModule],
  controllers: [StudyAbroadController],
  providers: [StudyAbroadService, ScholarshipWatchDispatcher],
  exports: [StudyAbroadService],
})
export class StudyAbroadModule {}
