import { Global, Module } from '@nestjs/common';

import { Db } from './pool';

@Global()
@Module({
  providers: [Db],
  exports: [Db],
})
export class DbModule {}
