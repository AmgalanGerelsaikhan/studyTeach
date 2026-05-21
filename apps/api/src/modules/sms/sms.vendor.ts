import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { ENV } from '../../lib/config/config.module';
import type { Env } from '../../lib/config/env';

export interface SendInput {
  recipient_phone: string;
  body: string;
  segments_used: number;
}

export interface SendResult {
  aggregator_id: string;
}

/**
 * SMS aggregator wrapper. In dev (no SMS_AGGREGATOR_URL set), drains
 * messages to `apps/api/test/fixtures/sms-outbox/<aggregator_id>.json`
 * so tests + manual demos can verify what would be sent without paying.
 *
 * R-1: configurable; default in dev = mock vendor. Production vendor
 * (Mobicom/Unitel/G-Mobile) implements the same interface; routing is
 * done by ops via SMS_AGGREGATOR_URL.
 */
@Injectable()
export class SmsVendor {
  private readonly log = new Logger('SmsVendor');
  private readonly mock: boolean;
  private counter = 0;

  constructor(@Inject(ENV) env: Env) {
    this.mock = !env.SMS_AGGREGATOR_URL || env.NODE_ENV !== 'production';
    if (this.mock) {
      this.log.warn('SmsVendor running in MOCK mode (no SMS_AGGREGATOR_URL)');
    }
  }

  async send(input: SendInput): Promise<SendResult> {
    const id = `mock_sms_${Date.now()}_${++this.counter}`;
    if (this.mock) {
      try {
        const outDir = join(process.cwd(), 'test', 'fixtures', 'sms-outbox');
        mkdirSync(outDir, { recursive: true });
        writeFileSync(
          join(outDir, `${id}.json`),
          JSON.stringify(
            {
              aggregator_id: id,
              recipient_phone: input.recipient_phone,
              body: input.body,
              segments_used: input.segments_used,
              sent_at: new Date().toISOString(),
            },
            null,
            2,
          ),
        );
      } catch (err) {
        this.log.warn(`mock outbox write failed: ${(err as Error).message}`);
      }
      return { aggregator_id: id };
    }
    throw new Error('SmsVendor real-vendor path not yet implemented — ops agreement required');
  }
}
