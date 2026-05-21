import { Injectable, Logger } from '@nestjs/common';

import { Env } from '../../lib/config/env';

/**
 * QPay sandbox wrapper. In dev (no QPAY_SANDBOX_MERCHANT_ID set), the
 * `createInvoice` call returns a deterministic mock — no network. In prod
 * it would POST to the QPay v2 invoice endpoint and return the
 * `{invoice_id, qpay_short_url}` for redirect.
 *
 * R-1 from the S05 plan: dev = mock; sandbox/prod = real call. The seam
 * stays identical so the controller code doesn't change between envs.
 */
export interface QpayCreateInput {
  /** Our local idempotency anchor (signature_hash); QPay sees it as merchant_invoice_id. */
  signature_hash: string;
  total_mnt: number;
  description: string;
}

export interface QpayCreateResult {
  qpay_invoice_id: string;
  qpay_redirect_url: string | null;
}

@Injectable()
export class QpayVendor {
  private readonly log = new Logger('QpayVendor');
  private readonly mock: boolean;

  constructor(env: Env) {
    this.mock = !env.QPAY_SANDBOX_MERCHANT_ID || env.NODE_ENV !== 'production';
    if (this.mock) {
      this.log.warn('QpayVendor running in MOCK mode (no QPAY_SANDBOX_MERCHANT_ID)');
    }
  }

  async createInvoice(input: QpayCreateInput): Promise<QpayCreateResult> {
    if (this.mock) {
      // Deterministic mock — same signature_hash → same qpay invoice id
      return {
        qpay_invoice_id: `mock_qpay_${input.signature_hash.slice(0, 16)}`,
        qpay_redirect_url: null,
      };
    }
    throw new Error('QpayVendor real-vendor path not yet implemented — see ADR-0011');
  }
}
