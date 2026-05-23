import { Module } from '@nestjs/common';

import { AuditModule } from '../../lib/audit/audit.module';
import { SmsModule } from '../sms/sms.module';

import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';

/**
 * Parent Portal — PRD §4.8 (web subset, USSD deferred). Links a PARENT to
 * STUDENT users by national-ID hash + school code + SMS OTP, then serves
 * aggregated views (upcoming olympiads, mock trajectory, payment history).
 */
@Module({
  imports: [AuditModule, SmsModule],
  controllers: [ParentController],
  providers: [ParentService],
  exports: [ParentService],
})
export class ParentModule {}
