import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { ENV } from '../../lib/config/config.module';
import { Inject } from '@nestjs/common';
import type { Env } from '../../lib/config/env';

import { SmsService } from './sms.service';

/**
 * Inbound SMS webhook. HMAC-SHA256 of raw body using SMS_INBOUND_SECRET.
 * IP allow-list belongs at the proxy layer (Caddy/Cloudflare) — not
 * re-implemented here.
 *
 * Idempotency anchor is the aggregator_id (UNIQUE in sms_messages).
 */
@Controller('webhooks/sms-inbound')
export class SmsController {
  constructor(
    private readonly sms: SmsService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Req() req: Request,
    @Headers('x-sms-signature') signature: string | undefined,
  ): Promise<void> {
    if (!signature) throw new BadRequestException('X-SMS-Signature missing');
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw) throw new BadRequestException('raw body unavailable');
    const expected = createHmac('sha256', this.env.SMS_INBOUND_SECRET).update(raw).digest('hex');
    if (!timingSafeEqualHex(expected, signature)) {
      throw new BadRequestException('invalid signature');
    }
    const payload = JSON.parse(raw.toString('utf8')) as {
      aggregator_id: string;
      from_phone: string;
      body: string;
    };
    await this.sms.receiveInbound(payload);
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
