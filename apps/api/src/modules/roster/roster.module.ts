import { Module } from '@nestjs/common';

import { OlympiadModule } from '../olympiad/olympiad.module';
import { PaymentsModule } from '../payments/payments.module';

import { RosterController } from './roster.controller';
import { RosterService } from './roster.service';

@Module({
  imports: [OlympiadModule, PaymentsModule],
  controllers: [RosterController],
  providers: [RosterService],
  exports: [RosterService],
})
export class RosterModule {}
