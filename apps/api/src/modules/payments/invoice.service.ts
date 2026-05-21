import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { PaymentStatus } from '@studyteach/contracts';

import { Env } from '../../lib/config/env';
import { ENV } from '../../lib/config/config.module';
import { Inject } from '@nestjs/common';
import { Db } from '../../lib/db/pool';

import { QpayVendor } from './qpay.vendor';

export interface InvoiceDescriptorRow {
  invoice_id: number;
  signature_hash: string;
  qpay_invoice_id: string | null;
  total_mnt: number;
  surcharge_mnt: number;
  payment_status: PaymentStatus;
  ebarimt_id: string | null;
  ebarimt_pdf_url: string | null;
  qpay_redirect_url: string | null;
  created_at: string;
  confirmed_at: string | null;
  replayed: boolean;
}

@Injectable()
export class InvoiceService {
  constructor(
    private readonly db: Db,
    private readonly qpay: QpayVendor,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * Create an invoice covering one or more registration_ids. Idempotent on
   * signature_hash. Each call recomputes the hash from the canonical PRD §7.2
   * tuple — same set → same hash → same invoice row returned.
   */
  async create(input: {
    issuedTo: number;
    registrationIds: readonly number[];
  }): Promise<InvoiceDescriptorRow> {
    if (input.registrationIds.length === 0) {
      throw new ConflictException('registration_ids must not be empty');
    }
    // Load the registrations to compute hash + total fee.
    const { rows: regs } = await this.db.query<{
      registration_id: number;
      student_id: number;
      olympiad_id: number;
      school_id: number | null;
      base_fee_mnt: number;
      registration_opens: Date;
      payment_status: PaymentStatus;
    }>(
      `SELECT r.registration_id, r.student_id, r.olympiad_id, st.school_id,
              o.base_fee_mnt, o.registration_opens, r.payment_status
         FROM registrations r
         JOIN students   st ON st.student_id = r.student_id
         JOIN olympiads  o  ON o.olympiad_id = r.olympiad_id
        WHERE r.registration_id = ANY($1::int[])`,
      [[...input.registrationIds]],
    );
    if (regs.length !== input.registrationIds.length) {
      throw new NotFoundException('one or more registrations not found');
    }

    // PRD §7.2 hash: school_id ‖ sorted(student_ids) ‖ sorted(olympiad_ids) ‖
    // registration_window_id. We use the first registration's school_id +
    // first olympiad's registration_opens as the window anchor.
    const schoolId = regs[0]!.school_id ?? 0;
    const studentIds = regs.map((r) => r.student_id).sort((a, b) => a - b);
    const olympiadIds = [...new Set(regs.map((r) => r.olympiad_id))].sort((a, b) => a - b);
    const windowId = `${regs[0]!.olympiad_id}|${regs[0]!.registration_opens.toISOString()}`;
    const sigPayload = `${schoolId}|${studentIds.join(',')}|${olympiadIds.join(',')}|${windowId}`;
    const signatureHash = createHash('sha256').update(sigPayload).digest('hex');

    const totalMnt = regs.reduce((sum, r) => sum + r.base_fee_mnt, 0);

    // UPSERT — replay returns the existing row.
    const { rows } = await this.db.query<InvoiceRow & { replayed: boolean }>(
      `INSERT INTO invoices (signature_hash, school_id, issued_to, total_mnt)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (signature_hash) DO UPDATE
         SET signature_hash = EXCLUDED.signature_hash
       RETURNING invoice_id, signature_hash, qpay_invoice_id, total_mnt,
                 surcharge_mnt, payment_status, ebarimt_id, ebarimt_pdf_path,
                 created_at, confirmed_at,
                 (xmax <> 0) AS replayed`,
      [signatureHash, schoolId || null, input.issuedTo, totalMnt],
    );
    let row = rows[0]!;

    // Lazily create the QPay invoice on the first non-replayed call.
    if (!row.replayed && !row.qpay_invoice_id) {
      const qpay = await this.qpay.createInvoice({
        signature_hash: signatureHash,
        total_mnt: totalMnt,
        description: `Олимпиадын бүртгэл: ${olympiadIds.join(',')}`,
      });
      const { rows: updated } = await this.db.query<InvoiceRow>(
        `UPDATE invoices SET qpay_invoice_id = $1 WHERE invoice_id = $2
         RETURNING invoice_id, signature_hash, qpay_invoice_id, total_mnt,
                   surcharge_mnt, payment_status, ebarimt_id, ebarimt_pdf_path,
                   created_at, confirmed_at`,
        [qpay.qpay_invoice_id, row.invoice_id],
      );
      row = { ...updated[0]!, replayed: row.replayed };
      // Note: qpay_redirect_url is per-call, not persisted; downstream callers
      // pass it through the response.
      return this.toDescriptor(row, qpay.qpay_redirect_url);
    }

    return this.toDescriptor(row, null);
  }

  async getById(invoiceId: number, scopedToUser: number): Promise<InvoiceDescriptorRow> {
    const { rows } = await this.db.query<InvoiceRow>(
      `SELECT invoice_id, signature_hash, qpay_invoice_id, total_mnt, surcharge_mnt,
              payment_status, ebarimt_id, ebarimt_pdf_path, created_at, confirmed_at
         FROM invoices
        WHERE invoice_id = $1 AND issued_to = $2`,
      [invoiceId, scopedToUser],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('invoice not found');
    return this.toDescriptor({ ...row, replayed: false }, null);
  }

  /**
   * QPay webhook handler. Verifies HMAC-SHA256 against QPAY_WEBHOOK_SECRET,
   * idempotently flips status to PAID, and returns the affected invoice so
   * the controller can trigger the E-Barimt + ticket-sign side effects.
   */
  async confirmFromWebhook(
    rawBody: Buffer,
    headerSignature: string,
  ): Promise<{ invoice_id: number; alreadyPaid: boolean }> {
    const expected = createHmac('sha256', this.env.QPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    if (!timingSafeEqualHex(expected, headerSignature)) {
      throw new ConflictException('invalid webhook signature');
    }
    const payload = JSON.parse(rawBody.toString('utf8')) as {
      qpay_invoice_id: string;
      status: 'PAID' | 'CANCELLED';
    };
    const status: PaymentStatus = payload.status === 'PAID' ? 'PAID' : 'CANCELLED';
    // Look up first so we know whether this confirmation is the *first* one.
    const { rows: before } = await this.db.query<{
      invoice_id: number;
      payment_status: PaymentStatus;
    }>(`SELECT invoice_id, payment_status FROM invoices WHERE qpay_invoice_id = $1`, [
      payload.qpay_invoice_id,
    ]);
    const existing = before[0];
    if (!existing) throw new NotFoundException('unknown qpay_invoice_id');
    const alreadyPaid = existing.payment_status === 'PAID';
    if (!alreadyPaid) {
      await this.db.query(
        `UPDATE invoices
            SET payment_status = $1::payment_status_enum,
                confirmed_at   = NOW()
          WHERE invoice_id = $2`,
        [status, existing.invoice_id],
      );
    }
    return { invoice_id: existing.invoice_id, alreadyPaid };
  }

  /**
   * Marks the invoice's registrations as PAID. Called by the controller
   * after the webhook confirms; idempotent.
   */
  async cascadeRegistrationsPaid(invoiceId: number): Promise<number[]> {
    const { rows } = await this.db.query<{ signature_hash: string }>(
      `SELECT signature_hash FROM invoices WHERE invoice_id = $1`,
      [invoiceId],
    );
    const sig = rows[0]?.signature_hash;
    if (!sig) return [];
    const { rows: regs } = await this.db.query<{ registration_id: number }>(
      `UPDATE registrations SET payment_status = 'PAID'::payment_status_enum
        WHERE signature_hash = $1 AND payment_status <> 'PAID'
        RETURNING registration_id`,
      [sig],
    );
    return regs.map((r) => r.registration_id);
  }

  private toDescriptor(
    row: InvoiceRow & { replayed: boolean },
    redirect: string | null,
  ): InvoiceDescriptorRow {
    return {
      invoice_id: row.invoice_id,
      signature_hash: row.signature_hash,
      qpay_invoice_id: row.qpay_invoice_id,
      total_mnt: row.total_mnt,
      surcharge_mnt: row.surcharge_mnt,
      payment_status: row.payment_status,
      ebarimt_id: row.ebarimt_id,
      ebarimt_pdf_url: row.ebarimt_pdf_path
        ? `/payments/invoices/${row.invoice_id}/receipt.pdf`
        : null,
      qpay_redirect_url: redirect,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      confirmed_at: row.confirmed_at
        ? row.confirmed_at instanceof Date
          ? row.confirmed_at.toISOString()
          : row.confirmed_at
        : null,
      replayed: row.replayed,
    };
  }
}

interface InvoiceRow {
  invoice_id: number;
  signature_hash: string;
  qpay_invoice_id: string | null;
  total_mnt: number;
  surcharge_mnt: number;
  payment_status: PaymentStatus;
  ebarimt_id: string | null;
  ebarimt_pdf_path: string | null;
  created_at: Date | string;
  confirmed_at: Date | string | null;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
