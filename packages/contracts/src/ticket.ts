import { z } from 'zod';

/**
 * What the ticket signature is computed over. Stable shape — any
 * additional fields go in `extra` so the JWS verification doesn't break
 * on payload growth.
 */
export const SignedTicketPayload = z.object({
  registration_id: z.number().int().positive(),
  /** SHA-256 of student full name. Plain name never goes in the QR. */
  student_name_hash: z.string().length(64),
  venue: z.string().nullable(),
  seat: z.string().nullable(),
  exam_time_iso: z.string().datetime(),
  issued_at: z.string().datetime(),
  extra: z.record(z.unknown()).optional(),
});
export type SignedTicketPayload = z.infer<typeof SignedTicketPayload>;

/** Public-key JWK for offline verification. */
export const PublicKeyJwk = z.object({
  kty: z.string(),
  kid: z.string(),
  alg: z.string(),
  /** ES256 / RS256 fields; opaque to the contract. */
  crv: z.string().optional(),
  x: z.string().optional(),
  y: z.string().optional(),
  n: z.string().optional(),
  e: z.string().optional(),
});
export type PublicKeyJwk = z.infer<typeof PublicKeyJwk>;

export const TicketResponse = z.object({
  registration_id: z.number().int(),
  /** JWS compact serialization: header.payload.signature */
  jws: z.string(),
  /** Decoded for convenience; the JWS is the authoritative form. */
  payload: SignedTicketPayload,
  /** Base64-encoded PNG bytes for offline render. */
  qr_png_b64: z.string(),
  /** Public key in JWK form for offline verification. */
  public_key_jwk: PublicKeyJwk,
  signed_at: z.string().datetime(),
});
export type TicketResponse = z.infer<typeof TicketResponse>;
