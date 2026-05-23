import { z } from 'zod';

import { IdempotencyKey } from './index';

export const PaymentStatus = z.enum(['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

/**
 * Create an invoice for one or more registrations. The server computes the
 * signature_hash and dedups against existing invoices — same payload twice
 * returns the existing invoice.
 *
 * S05 ships single-registration only; bulk (teacher-roster) uses the same
 * shape with multiple registration_ids and the existing PRD §7.2 hash.
 */
export const InvoiceCreateRequest = z.object({
  registration_ids: z.array(z.number().int().positive()).min(1).max(1000),
  idempotency_key: IdempotencyKey,
});
export type InvoiceCreateRequest = z.infer<typeof InvoiceCreateRequest>;

export const InvoiceDescriptor = z.object({
  invoice_id: z.number().int(),
  signature_hash: z.string().length(64),
  qpay_invoice_id: z.string().nullable(),
  total_mnt: z.number().int().nonnegative(),
  surcharge_mnt: z.number().int().nonnegative(),
  payment_status: PaymentStatus,
  ebarimt_id: z.string().nullable(),
  ebarimt_pdf_url: z.string().nullable(),
  /** Deep link to the QPay-hosted payment page. Null in dev/mock mode. */
  qpay_redirect_url: z.string().nullable(),
  created_at: z.string().datetime(),
  confirmed_at: z.string().datetime().nullable(),
  /** True if this invoice was returned via idempotency, not freshly created. */
  replayed: z.boolean(),
});
export type InvoiceDescriptor = z.infer<typeof InvoiceDescriptor>;

/**
 * QPay webhook payload — what QPay POSTs to us after the user pays.
 * HMAC-SHA256(body, QPAY_WEBHOOK_SECRET) is the verification anchor.
 */
export const QpayWebhookPayload = z.object({
  qpay_invoice_id: z.string(),
  status: z.enum(['PAID', 'CANCELLED']),
  paid_amount_mnt: z.number().int().nonnegative().optional(),
  paid_at: z.string().datetime().optional(),
});
export type QpayWebhookPayload = z.infer<typeof QpayWebhookPayload>;

/**
 * E-Barimt receipt returned by ebarimt.mn. We only persist `id` + the PDF
 * blob path; the full payload is treated as opaque.
 */
export const EbarimtReceipt = z.object({
  ebarimt_id: z.string(),
  pdf_url: z.string().nullable(),
  issued_at: z.string().datetime(),
});
export type EbarimtReceipt = z.infer<typeof EbarimtReceipt>;
