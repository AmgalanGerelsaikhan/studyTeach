import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import { Db } from '../../lib/db/pool';

import { EbarimtVendor } from './ebarimt.vendor';

/** Exponential backoff schedule per S05 plan R-8: 30s → 1m → 5m → 15m → 1h → 4h → 12h. */
const BACKOFF_SECONDS = [30, 60, 300, 900, 3600, 14400, 43200] as const;
const MAX_RETRIES = BACKOFF_SECONDS.length;

@Injectable()
export class EbarimtService {
  private readonly log = new Logger('EbarimtService');

  constructor(
    private readonly db: Db,
    private readonly vendor: EbarimtVendor,
  ) {}

  /**
   * Issues an E-Barimt receipt for an invoice. Idempotent — if the invoice
   * already has `ebarimt_id`, returns it.
   *
   * On vendor failure: bumps `ebarimt_retries` and rethrows. The caller
   * (controller or retry job) decides whether to schedule another attempt.
   */
  async issue(invoiceId: number): Promise<{ ebarimt_id: string; replayed: boolean }> {
    const { rows } = await this.db.query<{
      invoice_id: number;
      total_mnt: number;
      qpay_invoice_id: string | null;
      ebarimt_id: string | null;
      ebarimt_retries: number;
      payment_status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
    }>(
      `SELECT invoice_id, total_mnt, qpay_invoice_id, ebarimt_id, ebarimt_retries, payment_status
         FROM invoices WHERE invoice_id = $1`,
      [invoiceId],
    );
    const inv = rows[0];
    if (!inv) throw new NotFoundException('invoice not found');
    if (inv.payment_status !== 'PAID') {
      throw new Error(
        `invoice ${invoiceId} is ${inv.payment_status} — only PAID invoices get receipts`,
      );
    }
    if (inv.ebarimt_id) return { ebarimt_id: inv.ebarimt_id, replayed: true };
    if (!inv.qpay_invoice_id) {
      throw new Error(`invoice ${invoiceId} has no qpay_invoice_id — paid via what?`);
    }

    try {
      const result = await this.vendor.issue({
        invoice_id: invoiceId,
        total_mnt: inv.total_mnt,
        qpay_invoice_id: inv.qpay_invoice_id,
      });
      await this.db.query(
        `UPDATE invoices SET ebarimt_id = $1, ebarimt_pdf_path = $2 WHERE invoice_id = $3`,
        [result.ebarimt_id, result.pdf_path, invoiceId],
      );
      return { ebarimt_id: result.ebarimt_id, replayed: false };
    } catch (err) {
      const nextRetries = inv.ebarimt_retries + 1;
      await this.db.query(`UPDATE invoices SET ebarimt_retries = $1 WHERE invoice_id = $2`, [
        nextRetries,
        invoiceId,
      ]);
      if (nextRetries >= MAX_RETRIES) {
        this.log.error(
          `E-Barimt issue failed ${MAX_RETRIES} times for invoice ${invoiceId} — manual ops retry required`,
        );
      }
      throw err;
    }
  }

  /**
   * Generate a minimal PDF receipt for an invoice with an ebarimt_id.
   * Returns the PDF bytes; the controller serves them.
   *
   * Server-side via pdfkit (no headless browser per R-12).
   */
  async generatePdf(invoiceId: number): Promise<Buffer> {
    const { rows } = await this.db.query<{
      invoice_id: number;
      total_mnt: number;
      surcharge_mnt: number;
      ebarimt_id: string | null;
      created_at: Date;
      confirmed_at: Date | null;
    }>(
      `SELECT invoice_id, total_mnt, surcharge_mnt, ebarimt_id, created_at, confirmed_at
         FROM invoices WHERE invoice_id = $1`,
      [invoiceId],
    );
    const inv = rows[0];
    if (!inv) throw new NotFoundException('invoice not found');
    if (!inv.ebarimt_id) throw new Error('invoice has no ebarimt_id');

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 32 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.font('Helvetica-Bold').fontSize(14).text('studyTeach · E-Barimt', { align: 'center' });
      doc.moveDown();
      doc.font('Helvetica').fontSize(10);
      doc.text(`Invoice: #${inv.invoice_id}`);
      doc.text(`E-Barimt: ${inv.ebarimt_id}`);
      doc.text(`Confirmed: ${inv.confirmed_at?.toISOString() ?? '—'}`);
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Дүн: ${inv.total_mnt.toLocaleString()} ₮`);
      if (inv.surcharge_mnt > 0) {
        doc.text(`Хураамж: ${inv.surcharge_mnt.toLocaleString()} ₮`);
      }
      doc.moveDown();
      doc
        .fontSize(8)
        .fillColor('#666')
        .text('Энэхүү баримтыг ebarimt.mn-ээс шалгана уу.', { align: 'center' });
      doc.end();
    });
  }

  /**
   * Returns the seconds-to-wait before the next retry attempt for this
   * invoice (based on the current retry count). Caller schedules accordingly.
   */
  nextBackoffSeconds(currentRetries: number): number | null {
    if (currentRetries >= MAX_RETRIES) return null;
    return BACKOFF_SECONDS[currentRetries] ?? null;
  }
}
