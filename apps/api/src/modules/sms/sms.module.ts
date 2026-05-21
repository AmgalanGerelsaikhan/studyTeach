import { Module } from '@nestjs/common';

import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { SmsVendor } from './sms.vendor';

@Module({
  controllers: [SmsController],
  providers: [SmsService, SmsVendor],
  exports: [SmsService],
})
export class SmsModule {}
