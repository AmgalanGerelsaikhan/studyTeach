import { Module } from '@nestjs/common';

import { ENV } from '../../lib/config/config.module';
import type { Env } from '../../lib/config/env';
import { EbarimtModule } from '../ebarimt/ebarimt.module';
import { TicketModule } from '../ticket/ticket.module';

import { InvoiceService } from './invoice.service';
import { PaymentsController } from './payments.controller';
import { QpayVendor } from './qpay.vendor';

@Module({
  imports: [TicketModule, EbarimtModule],
  controllers: [PaymentsController],
  providers: [
    InvoiceService,
    {
      provide: QpayVendor,
      inject: [ENV],
      useFactory: (env: Env) => new QpayVendor(env),
    },
  ],
  exports: [InvoiceService],
})
export class PaymentsModule {}
