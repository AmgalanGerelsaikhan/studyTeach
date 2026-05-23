import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { QueuePositionResponse, SurgeToken } from '@studyteach/contracts';

import Redis from 'ioredis';

import { ENV } from '../../lib/config/config.module';
import type { Env } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';
import { REDIS } from '../../lib/redis/redis.module';
import { InvoiceService } from '../payments/invoice.service';

const STREAM_KEY = 'st:registrations:surge';

interface EnqueueInput {
  /** PRD §7.2 hash — the same anchor invoices use; cascades to the row the worker creates. */
  signature_hash: string;
  issued_to: number;
  registration_ids: readonly number[];
}

@Injectable()
export class SurgeService {
  private readonly log = new Logger('SurgeService');
  private consumerLoop: Promise<void> | null = null;
  private stopFlag = false;

  constructor(
    private readonly db: Db,
    private readonly invoices: InvoiceService,
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * Enqueue a deferred invoice creation. Returns a token the client polls.
   *
   * `position` is the count of unfulfilled tokens enqueued before this one
   * (display value). `eta_seconds` uses SURGE_CONSUME_MS — a rolling-mean
   * estimate would be more accurate but adds complexity beyond S07 scope.
   */
  async enqueue(input: EnqueueInput): Promise<SurgeToken> {
    const token = randomUUID();
    const { rows } = await this.db.query<{ position: number }>(
      `SELECT COUNT(*)::int AS position FROM surge_queue_tokens WHERE fulfilled_at IS NULL`,
    );
    const position = rows[0]!.position;
    await this.db.query(
      `INSERT INTO surge_queue_tokens (token, signature_hash, position)
       VALUES ($1, $2, $3)`,
      [token, input.signature_hash, position],
    );
    await this.redis.xadd(
      STREAM_KEY,
      '*',
      'token',
      token,
      'sig',
      input.signature_hash,
      'issued_to',
      input.issued_to.toString(),
      'registration_ids',
      JSON.stringify(input.registration_ids),
    );
    return {
      token,
      position,
      eta_seconds: this.etaSeconds(position),
    };
  }

  async position(token: string): Promise<QueuePositionResponse> {
    const { rows } = await this.db.query<{
      fulfilled_at: Date | null;
      invoice_id: number | null;
      enqueued_at: Date;
    }>(
      `SELECT fulfilled_at, invoice_id, enqueued_at
         FROM surge_queue_tokens WHERE token = $1`,
      [token],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('token not found');
    if (row.fulfilled_at && row.invoice_id !== null) {
      return { fulfilled: true, invoice_id: row.invoice_id };
    }
    const { rows: aheadRows } = await this.db.query<{ ahead: number }>(
      `SELECT COUNT(*)::int AS ahead
         FROM surge_queue_tokens
        WHERE fulfilled_at IS NULL AND enqueued_at < $1`,
      [row.enqueued_at],
    );
    const ahead = aheadRows[0]!.ahead;
    return {
      fulfilled: false,
      position: ahead,
      eta_seconds: this.etaSeconds(ahead),
    };
  }

  private etaSeconds(position: number): number {
    return Math.ceil((position * this.env.SURGE_CONSUME_MS) / 1000);
  }

  /**
   * Single-writer consume loop. Reads from the Redis stream sequentially
   * and creates the deferred invoice via InvoiceService. On error the
   * stream entry stays unconsumed (we use single-message XREAD; failure
   * leaves the position).
   *
   * R-1 — surge auto-activates via SURGE_ENABLED env; the loop runs
   * unconditionally to drain whatever was enqueued (so flipping the env
   * off doesn't strand tokens).
   */
  startConsumer(): void {
    if (this.consumerLoop) return;
    this.consumerLoop = this.runConsumer().catch((err: unknown) => {
      this.log.error(`consumer crashed: ${(err as Error).message}`);
      this.consumerLoop = null;
    });
  }

  async stop(): Promise<void> {
    this.stopFlag = true;
    await this.consumerLoop;
  }

  private async runConsumer(): Promise<void> {
    let lastId = '0-0';
    while (!this.stopFlag) {
      // XREAD with a small BLOCK so the loop respects stopFlag.
      // ioredis types want COUNT before BLOCK in this overload; both are
      // optional and either order is accepted at the wire level.
      const result = (await this.redis.xread(
        'COUNT',
        10,
        'BLOCK',
        500,
        'STREAMS',
        STREAM_KEY,
        lastId,
      )) as Array<[string, Array<[string, string[]]>]> | null;
      if (!result) continue;
      for (const [, entries] of result) {
        for (const [id, fields] of entries) {
          lastId = id;
          const map = fieldsToMap(fields);
          try {
            await this.consumeOne({
              token: map.token!,
              issuedTo: Number(map.issued_to),
              registrationIds: JSON.parse(map.registration_ids!) as number[],
            });
          } catch (err) {
            this.log.error(`consume failed for token ${map.token}: ${(err as Error).message}`);
          }
        }
      }
    }
  }

  private async consumeOne(input: {
    token: string;
    issuedTo: number;
    registrationIds: readonly number[];
  }): Promise<void> {
    const invoice = await this.invoices.create({
      issuedTo: input.issuedTo,
      registrationIds: input.registrationIds,
    });
    await this.db.query(
      `UPDATE surge_queue_tokens SET fulfilled_at = NOW(), invoice_id = $1
        WHERE token = $2`,
      [invoice.invoice_id, input.token],
    );
  }

  /** Returns true when surge mode is currently active (env flag for now). */
  isActive(): boolean {
    return this.env.SURGE_ENABLED === 'true' || this.env.SURGE_ENABLED === 'force';
  }
}

function fieldsToMap(fields: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i + 1 < fields.length; i += 2) {
    out[fields[i]!] = fields[i + 1]!;
  }
  return out;
}
