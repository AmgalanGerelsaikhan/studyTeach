/**
 * Integration test for SMS lifecycle (E-022 outbound + E-023 inbound).
 * Real Postgres, mock SmsVendor (drains to test/fixtures/sms-outbox/).
 *
 * Fixtures: phone prefix +97670000... so wipe doesn't touch seeded
 * '+976 8811...' numbers.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';

import { SmsService } from './sms.service';
import { SmsVendor } from './sms.vendor';

function newTestPhone(): string {
  const n = Math.floor(Math.random() * 99999999)
    .toString()
    .padStart(8, '0');
  return `+97670${n.slice(0, 6)}`;
}

describe('SmsService (integration)', () => {
  let db: Db;
  let sms: SmsService;

  beforeAll(() => {
    const env = loadEnv();
    db = new Db(env);
    sms = new SmsService(db, new SmsVendor(env));
  });

  const wipe = async (): Promise<void> => {
    await db.query(`DELETE FROM sms_messages WHERE recipient_phone LIKE '+97670%'`);
    await db.query(`DELETE FROM users WHERE phone_number LIKE '+97670%'`);
  };

  afterAll(async () => {
    await wipe();
    await db.end();
  });

  beforeEach(wipe);

  it('send renders + persists; resolved body under 2 segments', async () => {
    const phone = newTestPhone();
    const result = await sms.send('registration-paid', phone, {
      olympiad: 'XLI Улсын Математикийн Олимпиад',
    });
    expect(result.status).toBe('sent');
    expect(result.suppressed).toBe(false);

    const { rows } = await db.query<{
      template_key: string;
      segments_used: number;
      body_rendered: string;
    }>(`SELECT template_key, segments_used, body_rendered FROM sms_messages WHERE sms_id = $1`, [
      result.sms_id,
    ]);
    expect(rows[0]!.template_key).toBe('registration-paid');
    expect(rows[0]!.segments_used).toBeLessThanOrEqual(2);
    expect(rows[0]!.body_rendered).toMatch(/Олимпиад/);
  });

  it('inbound STOP records intent + suppresses subsequent sends', async () => {
    const phone = newTestPhone();

    const inbound = await sms.receiveInbound({
      aggregator_id: `mock_agg_${randomUUID()}`,
      from_phone: phone,
      body: 'ЗОГС',
    });
    expect(inbound.intent).toBe('STOP');

    // Send AFTER STOP — should be suppressed (status='failed', body='[suppressed]')
    const second = await sms.send('mock-completion', phone, { student: 'Тест' });
    expect(second.suppressed).toBe(true);
    expect(second.status).toBe('failed');

    const { rows } = await db.query<{ body_rendered: string }>(
      `SELECT body_rendered FROM sms_messages WHERE sms_id = $1`,
      [second.sms_id],
    );
    expect(rows[0]!.body_rendered).toBe('[suppressed]');
  });

  it('inbound STATUS replies with status-summary template', async () => {
    const phone = newTestPhone();
    // Create a user so summaryFor finds a record
    await db.query(
      `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
       VALUES ($1, $1, 'x', 'PARENT'::user_role_enum, NULL, 'mn-Cyrl')`,
      [phone],
    );

    const result = await sms.receiveInbound({
      aggregator_id: `mock_agg_${randomUUID()}`,
      from_phone: phone,
      body: 'СТАТУС',
    });
    expect(result.intent).toBe('STATUS');
    expect(result.replied).toBe(true);

    const { rows } = await db.query<{ template_key: string }>(
      `SELECT template_key FROM sms_messages
        WHERE recipient_phone = $1 AND template_key = 'status-summary'`,
      [phone],
    );
    expect(rows.length).toBe(1);
  });

  it('inbound is idempotent on aggregator_id', async () => {
    const phone = newTestPhone();
    const aggregatorId = `mock_agg_${randomUUID()}`;
    await sms.receiveInbound({ aggregator_id: aggregatorId, from_phone: phone, body: 'ЗОГС' });
    // Replay → no second STOP row written
    await sms.receiveInbound({ aggregator_id: aggregatorId, from_phone: phone, body: 'ЗОГС' });

    const { rows } = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM sms_messages
        WHERE recipient_phone = $1 AND inbound_intent = 'STOP'`,
      [phone],
    );
    expect(Number(rows[0]!.count)).toBe(1);
  });
});
