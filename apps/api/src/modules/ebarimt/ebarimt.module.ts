import { Module } from '@nestjs/common';

import { EbarimtController } from './ebarimt.controller';
import { EbarimtService } from './ebarimt.service';
import { EbarimtVendor } from './ebarimt.vendor';

@Module({
  controllers: [EbarimtController],
  providers: [EbarimtService, EbarimtVendor],
  exports: [EbarimtService],
})
export class EbarimtModule {}
