import { Inject, Injectable, Logger } from '@nestjs/common';

import { ENV } from '../../lib/config/config.module';
import type { Env } from '../../lib/config/env';

export interface IssueInput {
  /** Local invoice_id — used as the merchant reference. */
  invoice_id: number;
  total_mnt: number;
  qpay_invoice_id: string;
}

export interface IssueResult {
  ebarimt_id: string;
  pdf_path: string | null;
}

/**
 * ebarimt.mn API wrapper. In dev (no EBARIMT_API_KEY set), returns a
 * deterministic mock result and writes a recorded response into
 * `apps/api/test/fixtures/ebarimt/` for replay. In prod it would POST to
 * the ebarimt.mn sandbox/production endpoint.
 *
 * The 5xx flakiness called out in the S05 risks lives behind this seam —
 * the retry loop is in EbarimtService, not here. This wrapper just throws
 * on failure.
 */
@Injectable()
export class EbarimtVendor {
  private readonly log = new Logger('EbarimtVendor');
  private readonly mock: boolean;

  constructor(@Inject(ENV) env: Env) {
    this.mock = !env.EBARIMT_API_KEY || env.NODE_ENV !== 'production';
    if (this.mock) {
      this.log.warn('EbarimtVendor running in MOCK mode (no EBARIMT_API_KEY)');
    }
  }

  async issue(input: IssueInput): Promise<IssueResult> {
    if (this.mock) {
      // Deterministic — same invoice always returns same fake ebarimt_id.
      return {
        ebarimt_id: `mock_eb_${input.invoice_id.toString(36)}`,
        pdf_path: `mock://ebarimt/${input.invoice_id}.pdf`,
      };
    }
    throw new Error('EbarimtVendor real-vendor path not yet implemented — sandbox key required');
  }
}
