import { z } from 'zod';

export const SmsStatus = z.enum(['pending', 'sent', 'delivered', 'failed']);
export type SmsStatus = z.infer<typeof SmsStatus>;

export const SmsTemplateKey = z.enum([
  'registration-paid',
  'registration-pending',
  'mock-completion',
  'olympiad-reminder-24h',
  'status-summary',
  'stop-confirmation',
  'unknown-keyword',
  'parent-link-otp',
]);
export type SmsTemplateKey = z.infer<typeof SmsTemplateKey>;

/**
 * Aggregator's webhook payload for an INBOUND SMS. IP allow-list +
 * HMAC-SHA256 of body using SMS_INBOUND_SECRET protects this endpoint.
 */
export const InboundSmsPayload = z.object({
  aggregator_id: z.string(),
  from_phone: z.string().regex(/^\+976\d{8}$/),
  body: z.string().min(1).max(320),
  received_at: z.string().datetime(),
});
export type InboundSmsPayload = z.infer<typeof InboundSmsPayload>;

/**
 * Aggregator's webhook payload for a DELIVERY status update on a
 * previously sent SMS.
 */
export const SmsDeliveryStatusPayload = z.object({
  aggregator_id: z.string(),
  status: SmsStatus,
});
export type SmsDeliveryStatusPayload = z.infer<typeof SmsDeliveryStatusPayload>;
