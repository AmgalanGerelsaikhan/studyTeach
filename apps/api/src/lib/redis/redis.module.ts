import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (env: Env): Redis => new Redis(env.REDIS_URL, { lazyConnect: false }),
      inject: [ENV],
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
