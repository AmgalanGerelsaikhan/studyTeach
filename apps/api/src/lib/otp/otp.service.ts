import { randomBytes, randomInt } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import { REDIS } from '../redis/redis.module';

/**
 * Per PRD §8.1: 2FA via SMS OTP. For dev (LLM_VENDOR=mock equivalent),
 * the code is also logged to stderr so engineers can verify the flow
 * without a real SMS aggregator. Real aggregator implementation lands
 * in a later SMS epic (E-022).
 */
const TTL_SECONDS = 5 * 60;

@Injectable()
export class OtpService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /** Returns the challenge token (caller stores in response; sent back on /verify). */
  async issue(userId: number, phoneNumber: string): Promise<string> {
    const challenge = randomBytes(16).toString('hex');
    const code = String(randomInt(100000, 1000000));
    await this.redis.set(this.key(challenge), JSON.stringify({ userId, code }), 'EX', TTL_SECONDS);

    // Dev surface — replace with SMS aggregator dispatch in E-022.
    console.warn(`[otp] dev OTP for user_id=${userId} phone=${phoneNumber}: code=${code}`);
    return challenge;
  }

  async verify(challenge: string, code: string): Promise<number | null> {
    const raw = await this.redis.get(this.key(challenge));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId: number; code: string };
    if (parsed.code !== code) return null;
    await this.redis.del(this.key(challenge));
    return parsed.userId;
  }

  private key(challenge: string): string {
    return `otp:${challenge}`;
  }
}
