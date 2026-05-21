import { Module } from '@nestjs/common';

import { OlympiadController } from './olympiad.controller';
import { OlympiadService } from './olympiad.service';
import { RegistrationService } from './registration.service';

@Module({
  controllers: [OlympiadController],
  providers: [OlympiadService, RegistrationService],
  exports: [OlympiadService, RegistrationService],
})
export class OlympiadModule {}
