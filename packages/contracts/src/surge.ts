import { z } from 'zod';

/**
 * Queue token issued during surge mode. Caller polls /queue-position/:token
 * until the response shape switches to `fulfilled: true` with an invoice_id.
 */
export const SurgeToken = z.object({
  token: z.string().uuid(),
  position: z.number().int().nonnegative(),
  eta_seconds: z.number().int().nonnegative(),
});
export type SurgeToken = z.infer<typeof SurgeToken>;

export const QueuePositionResponse = z.discriminatedUnion('fulfilled', [
  z.object({
    fulfilled: z.literal(false),
    position: z.number().int().nonnegative(),
    eta_seconds: z.number().int().nonnegative(),
  }),
  z.object({
    fulfilled: z.literal(true),
    invoice_id: z.number().int(),
  }),
]);
export type QueuePositionResponse = z.infer<typeof QueuePositionResponse>;
