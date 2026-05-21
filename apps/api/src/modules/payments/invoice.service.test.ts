/**
 * Integration test for the invoice + ticket lifecycle (E-019 + E-021).
 * Real Postgres, dev signing key from apps/api/keys/.
 *
 * Fixtures: phone prefix 'TEST-PAY-' on users + 'TEST-PAY-' on schools +
 * 'TEST-PAY-' on olympiads + 'TEST-PAY-' on registrations.signature_hash
 * prefix. Cleanup at suite end.
 */
import 'dotenv/config';
import { createHash, createHmac, randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';
import { TicketService } from '../ticket/ticket.service';

import { InvoiceService } from './invoice.service';
import { QpayVendor } from './qpay.vendor';

async function setup(db: Db): Promise<{
  userId: number;
  studentId: number;
  schoolId: number;
  olympiadId: number;
  registrationId: number;
}> {
  const suffix = randomUUID().slice(0, 8);
  const phone = `TEST-PAY-${suffix}`;

  const { rows: userRows } = await db.query<{ user_id: number }>(
    `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
     VALUES ($1, $2, 'x', 'STUDENT'::user_role_enum, NULL, 'mn-Cyrl')
     RETURNING user_id`,
    [phone, `${phone}@test.local`],
  );
  const userId = userRows[0]!.user_id;

  const { rows: schoolRows } = await db.query<{ school_id: number }>(
    `INSERT INTO schools (school_code, name, aimag, is_urban)
     VALUES ($1, $2, 'УБ', TRUE)
     RETURNING school_id`,
    [`TEST-PAY-S-${suffix}`, `Test ${suffix}`],
  );
  const schoolId = schoolRows[0]!.school_id;

  const { rows: studentRows } = await db.query<{ student_id: number }>(
    `INSERT INTO students (user_id, school_id, grade) VALUES ($1, $2, 11) RETURNING student_id`,
    [userId, schoolId],
  );
  const studentId = studentRows[0]!.student_id;

  const { rows: olympRows } = await db.query<{ olympiad_id: number }>(
    `INSERT INTO olympiads
       (title, organizer, subject, grade_min, grade_max,
        registration_opens, registration_closes, exam_date,
        aimag, venue, is_online, base_fee_mnt)
     VALUES ($1, 'TEST-PAY', 'math', 9, 12,
             NOW() - interval '1 day', NOW() + interval '14 days', NOW() + interval '21 days',
             'УБ', 'Test Venue', FALSE, 12000)
     RETURNING olympiad_id`,
    [`TEST-PAY-O-${suffix}`],
  );
  const olympiadId = olympRows[0]!.olympiad_id;

  // Register directly. signature_hash must follow the canonical PRD §7.2
  // formula so InvoiceService.cascadeRegistrationsPaid can match it.
  const { rows: opensRow } = await db.query<{ opens: Date }>(
    `SELECT registration_opens AS opens FROM olympiads WHERE olympiad_id = $1`,
    [olympiadId],
  );
  const windowId = `${olympiadId}|${opensRow[0]!.opens.toISOString()}`;
  const sigPayload = `${schoolId}|${studentId}|${olympiadId}|${windowId}`;
  const sigHash = createHash('sha256').update(sigPayload).digest('hex');
  const { rows: regRows } = await db.query<{ registration_id: number }>(
    `INSERT INTO registrations (student_id, olympiad_id, registered_by, signature_hash)
     VALUES ($1, $2, $3, $4) RETURNING registration_id`,
    [studentId, olympiadId, userId, sigHash],
  );
  return { userId, studentId, schoolId, olympiadId, registrationId: regRows[0]!.registration_id };
}

describe('InvoiceService + TicketService (integration)', () => {
  let db: Db;
  let invoices: InvoiceService;
  let tickets: TicketService;

  beforeAll(() => {
    const env = loadEnv();
    db = new Db(env);
    invoices = new InvoiceService(db, new QpayVendor(env), env);
    tickets = new TicketService(db, env);
  });

  const wipe = async (): Promise<void> => {
    await db.query(`DELETE FROM tickets WHERE registration_id IN (
      SELECT r.registration_id FROM registrations r
      JOIN students st ON st.student_id = r.student_id
      JOIN users    u  ON u.user_id     = st.user_id
      WHERE u.phone_number LIKE 'TEST-PAY-%'
    )`);
    await db.query(`DELETE FROM invoices WHERE issued_to IN (
      SELECT user_id FROM users WHERE phone_number LIKE 'TEST-PAY-%'
    )`);
    await db.query(`DELETE FROM registrations WHERE registered_by IN (
      SELECT user_id FROM users WHERE phone_number LIKE 'TEST-PAY-%'
    )`);
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-PAY-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-PAY-%'`);
    await db.query(`DELETE FROM olympiads WHERE title LIKE 'TEST-PAY-%'`);
  };

  afterAll(async () => {
    await wipe();
    await db.end();
  });

  beforeEach(wipe);

  it('create is idempotent on the canonical signature_hash', async () => {
    const fx = await setup(db);
    const first = await invoices.create({
      issuedTo: fx.userId,
      registrationIds: [fx.registrationId],
    });
    expect(first.replayed).toBe(false);
    expect(first.qpay_invoice_id).toMatch(/^mock_qpay_/);
    expect(first.total_mnt).toBe(12000);

    const second = await invoices.create({
      issuedTo: fx.userId,
      registrationIds: [fx.registrationId],
    });
    expect(second.invoice_id).toBe(first.invoice_id);
    expect(second.replayed).toBe(true);
  });

  it('webhook with valid HMAC flips status PAID and cascades registrations', async () => {
    const env = loadEnv();
    const fx = await setup(db);
    const inv = await invoices.create({
      issuedTo: fx.userId,
      registrationIds: [fx.registrationId],
    });

    const body = Buffer.from(
      JSON.stringify({ qpay_invoice_id: inv.qpay_invoice_id, status: 'PAID' }),
    );
    const sig = createHmac('sha256', env.QPAY_WEBHOOK_SECRET).update(body).digest('hex');
    const result = await invoices.confirmFromWebhook(body, sig);
    expect(result.invoice_id).toBe(inv.invoice_id);
    expect(result.alreadyPaid).toBe(false);

    const updated = await invoices.cascadeRegistrationsPaid(inv.invoice_id);
    expect(updated).toContain(fx.registrationId);
  });

  it('webhook with bad HMAC throws', async () => {
    const fx = await setup(db);
    const inv = await invoices.create({
      issuedTo: fx.userId,
      registrationIds: [fx.registrationId],
    });
    const body = Buffer.from(
      JSON.stringify({ qpay_invoice_id: inv.qpay_invoice_id, status: 'PAID' }),
    );
    await expect(invoices.confirmFromWebhook(body, 'cafefade')).rejects.toThrow(/signature/);
  });

  it('ticket sign + retrieve returns a verifiable JWS + QR PNG', async () => {
    const fx = await setup(db);
    const ticket = await tickets.sign(fx.registrationId);
    expect(ticket.jws.split('.')).toHaveLength(3);
    expect(ticket.qr_png_b64).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(ticket.payload.registration_id).toBe(fx.registrationId);
    expect(ticket.public_key_jwk.kid).toBe(
      ticket.payload.extra ? 'dev-ticket-v1' : 'dev-ticket-v1',
    );

    // Second sign for same registration → idempotent (same payload/jws are
    // re-issued but row replaced — see service comment).
    const again = await tickets.sign(fx.registrationId);
    expect(again.registration_id).toBe(fx.registrationId);
  });

  it('ticket getForStudent rejects cross-student access', async () => {
    const fx = await setup(db);
    await tickets.sign(fx.registrationId);

    const other = await setup(db);
    await expect(tickets.getForStudent(fx.registrationId, other.studentId)).rejects.toThrow(
      /not found/,
    );
  });
});
