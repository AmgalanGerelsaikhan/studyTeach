import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { PublicKeyJwk, SignedTicketPayload, TicketResponse } from '@studyteach/contracts';
import { importJWK, SignJWT, type JWK } from 'jose';
import { toBuffer as qrToBuffer } from 'qrcode';

import { ENV } from '../../lib/config/config.module';
import type { Env } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';

// importJWK returns jose's `KeyLike` (or a Uint8Array for symmetric keys);
// deriving the alias from its return type keeps this jose-version-agnostic.
type SigningKey = Awaited<ReturnType<typeof importJWK>>;

interface KeyPair {
  privateKey: SigningKey;
  publicJwk: PublicKeyJwk;
  kid: string;
  alg: 'ES256';
}

/**
 * Signs digital tickets (E-021). In dev, reads the ES256 keypair from
 * keys/dev-ticket-*.jwk.json (generated at S05 Wave B). In prod, the
 * `gcp-kms` path delegates to GCP Cloud KMS asymmetricSign (ADR-0014) —
 * stub for now; lands when staging KMS keyring is provisioned in S07.
 *
 * Tickets are signed once on QPay confirmation, persisted in `tickets`,
 * and served by `/registrations/:id/ticket`. Verification is offline-
 * capable: the response carries the JWK so a frozen client can verify
 * without hitting the API.
 */
@Injectable()
export class TicketService {
  private readonly log = new Logger('TicketService');
  private keyPair: KeyPair | null = null;

  constructor(
    private readonly db: Db,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private async getKeyPair(): Promise<KeyPair> {
    if (this.keyPair) return this.keyPair;
    if (this.env.TICKET_SIGNING_MODE !== 'dev') {
      throw new Error(
        `TICKET_SIGNING_MODE=${this.env.TICKET_SIGNING_MODE} not yet implemented — ADR-0014 says GCP Cloud KMS Singapore. Switch back to dev or implement the KMS path.`,
      );
    }
    const privPath = join(process.cwd(), this.env.TICKET_SIGNING_DEV_KEY_PATH);
    const pubPath = join(process.cwd(), this.env.TICKET_SIGNING_DEV_PUBLIC_KEY_PATH);
    const privJwk = JSON.parse(readFileSync(privPath, 'utf8')) as JWK;
    const pubJwk = JSON.parse(readFileSync(pubPath, 'utf8')) as PublicKeyJwk;
    const privateKey = await importJWK(privJwk, 'ES256');
    this.keyPair = {
      privateKey,
      publicJwk: pubJwk,
      kid: pubJwk.kid,
      alg: 'ES256',
    };
    this.log.log(`Loaded dev ticket signing key kid=${pubJwk.kid}`);
    return this.keyPair;
  }

  /**
   * Signs a ticket for the given registration. Idempotent — if a ticket
   * already exists for this registration, returns the existing row's payload.
   */
  async sign(registrationId: number): Promise<TicketResponse> {
    const existing = await this.loadIfExists(registrationId);
    if (existing) return existing;

    const meta = await this.loadRegistrationMeta(registrationId);
    const studentNameHash = createHash('sha256').update(meta.full_name).digest('hex');
    const payload: SignedTicketPayload = {
      registration_id: registrationId,
      student_name_hash: studentNameHash,
      venue: meta.venue,
      seat: null,
      exam_time_iso: meta.exam_date.toISOString(),
      issued_at: new Date().toISOString(),
      extra: { jti: randomUUID() },
    };

    const { privateKey, kid, alg } = await this.getKeyPair();
    const jws = await new SignJWT(payload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg, kid })
      .sign(privateKey);

    // QR PNG carries the JWS so a venue scanner can verify offline with the
    // public key. PNG size is small (~1-2 KB) for the payload sizes we emit.
    const qrPng = await qrToBuffer(jws, { errorCorrectionLevel: 'M', margin: 1, width: 320 });

    await this.db.query(
      `INSERT INTO tickets (registration_id, payload, qr_png, kid)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (registration_id) DO UPDATE
         SET payload = EXCLUDED.payload,
             qr_png  = EXCLUDED.qr_png,
             kid     = EXCLUDED.kid,
             signed_at = NOW()`,
      [registrationId, jws, qrPng, kid],
    );
    const stored = await this.loadIfExists(registrationId);
    if (!stored) throw new Error('ticket.sign: row not found after INSERT');
    return stored;
  }

  async getForStudent(registrationId: number, studentId: number): Promise<TicketResponse> {
    const { rows } = await this.db.query<{ student_id: number }>(
      `SELECT student_id FROM registrations WHERE registration_id = $1`,
      [registrationId],
    );
    if (!rows[0]) throw new NotFoundException('registration not found');
    if (rows[0].student_id !== studentId) throw new NotFoundException('registration not found');
    const ticket = await this.loadIfExists(registrationId);
    if (!ticket) throw new NotFoundException('ticket not yet signed');
    return ticket;
  }

  private async loadIfExists(registrationId: number): Promise<TicketResponse | null> {
    const { rows } = await this.db.query<{
      payload: string;
      qr_png: Buffer;
      kid: string;
      signed_at: Date;
    }>(`SELECT payload, qr_png, kid, signed_at FROM tickets WHERE registration_id = $1`, [
      registrationId,
    ]);
    const row = rows[0];
    if (!row) return null;
    const { publicJwk } = await this.getKeyPair();
    const decoded = decodeJwsPayloadUnsafe(row.payload);
    return {
      registration_id: registrationId,
      jws: row.payload,
      payload: decoded,
      qr_png_b64: row.qr_png.toString('base64'),
      public_key_jwk: publicJwk,
      signed_at: row.signed_at.toISOString(),
    };
  }

  private async loadRegistrationMeta(registrationId: number): Promise<{
    full_name: string;
    venue: string | null;
    exam_date: Date;
  }> {
    const { rows } = await this.db.query<{
      full_name: string;
      venue: string | null;
      exam_date: Date;
    }>(
      `SELECT COALESCE(u.email, u.phone_number) AS full_name,
              o.venue, o.exam_date
         FROM registrations r
         JOIN students st ON st.student_id = r.student_id
         JOIN users    u  ON u.user_id     = st.user_id
         JOIN olympiads o ON o.olympiad_id = r.olympiad_id
        WHERE r.registration_id = $1`,
      [registrationId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('registration not found');
    return row;
  }
}

/**
 * Decode the payload of a JWS compact serialization WITHOUT verifying the
 * signature. Safe here because we're decoding a JWS WE just signed and
 * read from our own DB; the signature is verified by clients.
 */
function decodeJwsPayloadUnsafe(jws: string): SignedTicketPayload {
  const parts = jws.split('.');
  if (parts.length !== 3) throw new Error('malformed JWS');
  const json = Buffer.from(parts[1]!, 'base64url').toString('utf8');
  return JSON.parse(json) as SignedTicketPayload;
}
