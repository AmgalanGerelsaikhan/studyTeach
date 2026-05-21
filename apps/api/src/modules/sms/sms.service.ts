import { ConflictException, Injectable, Logger } from '@nestjs/common';
import type { SmsStatus, SmsTemplateKey } from '@studyteach/contracts';

import { Db } from '../../lib/db/pool';

import { renderTemplate, segmentsForUcs2 } from './sms.templates';
import { SmsVendor } from './sms.vendor';

@Injectable()
export class SmsService {
  private readonly log = new Logger('SmsService');

  constructor(
    private readonly db: Db,
    private readonly vendor: SmsVendor,
  ) {}

  /**
   * Render + send an outbound SMS. R-5: opt-out is enforced — phones with
   * a previous STOP intent skip the vendor call and the row is recorded
   * with status='failed' + body_rendered='[suppressed]' so the audit trail
   * shows the attempt.
   *
   * R-10: body_rendered is the resolved template body. No raw scores or
   * wellbeing values — templates resolve to labels, not values.
   */
  async send(
    templateKey: SmsTemplateKey,
    recipientPhone: string,
    params: Record<string, string | number>,
  ): Promise<{ sms_id: number; status: SmsStatus; suppressed: boolean }> {
    if (await this.isOptedOut(recipientPhone)) {
      const { rows } = await this.db.query<{ sms_id: number }>(
        `INSERT INTO sms_messages
           (recipient_phone, template_key, body_rendered, segments_used, status)
         VALUES ($1, $2, '[suppressed]', 1, 'failed'::sms_status_enum)
         RETURNING sms_id`,
        [recipientPhone, templateKey],
      );
      return { sms_id: rows[0]!.sms_id, status: 'failed', suppressed: true };
    }

    const body = renderTemplate(templateKey, params);
    const segs = segmentsForUcs2(body);
    if (segs > 2) {
      throw new ConflictException(`rendered SMS exceeds 2 UCS-2 segments (${segs})`);
    }

    const result = await this.vendor.send({
      recipient_phone: recipientPhone,
      body,
      segments_used: segs,
    });

    const { rows } = await this.db.query<{ sms_id: number }>(
      `INSERT INTO sms_messages
         (recipient_phone, template_key, body_rendered, segments_used, status, aggregator_id)
       VALUES ($1, $2, $3, $4, 'sent'::sms_status_enum, $5)
       RETURNING sms_id`,
      [recipientPhone, templateKey, body, segs, result.aggregator_id],
    );
    return { sms_id: rows[0]!.sms_id, status: 'sent', suppressed: false };
  }

  async isOptedOut(phone: string): Promise<boolean> {
    const { rows } = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM sms_messages
          WHERE recipient_phone = $1 AND inbound_intent = 'STOP'
       ) AS exists`,
      [phone],
    );
    return rows[0]!.exists;
  }

  /**
   * Process an inbound SMS. Classifies the body, routes to a handler, and
   * persists the row. Returns the parsed intent + any reply that was sent.
   *
   * Idempotent on aggregator_id (UNIQUE).
   */
  async receiveInbound(input: {
    aggregator_id: string;
    from_phone: string;
    body: string;
  }): Promise<{ intent: 'STATUS' | 'STOP' | 'UNKNOWN'; replied: boolean }> {
    const intent = classifyIntent(input.body);
    const segs = segmentsForUcs2(input.body);

    let auditUserId: number | null = null;
    if (intent === 'STOP' || intent === 'STATUS') {
      const { rows } = await this.db.query<{ user_id: number }>(
        `SELECT user_id FROM users WHERE phone_number = $1`,
        [input.from_phone],
      );
      auditUserId = rows[0]?.user_id ?? null;
    }

    // Insert the inbound row first (idempotent on aggregator_id). If it
    // already exists, skip side effects — duplicate webhook delivery.
    const { rows: ins, rowCount } = await this.db.query<{ sms_id: number }>(
      `INSERT INTO sms_messages
         (recipient_phone, body_rendered, segments_used, status,
          is_inbound, inbound_intent, aggregator_id, audit_user_id)
       VALUES ($1, $2, $3, 'delivered'::sms_status_enum, TRUE, $4::sms_intent_enum, $5, $6)
       ON CONFLICT (aggregator_id) DO NOTHING
       RETURNING sms_id`,
      [input.from_phone, input.body, segs, intent, input.aggregator_id, auditUserId],
    );
    if (rowCount === 0) {
      return { intent, replied: false };
    }
    void ins;

    let replied = false;
    if (intent === 'STATUS') {
      try {
        const summary = await this.summaryFor(input.from_phone);
        await this.send('status-summary', input.from_phone, summary);
        replied = true;
      } catch (err) {
        this.log.warn(`STATUS summary failed: ${(err as Error).message}`);
      }
    } else if (intent === 'STOP') {
      try {
        await this.send('stop-confirmation', input.from_phone, {});
        replied = true;
      } catch (err) {
        // stop-confirmation send may be the LAST send before opt-out takes
        // effect on the NEXT call — that's fine; it's idempotent
        this.log.warn(`STOP confirmation failed: ${(err as Error).message}`);
      }
    } else if (intent === 'UNKNOWN') {
      try {
        await this.send('unknown-keyword', input.from_phone, {});
        replied = true;
      } catch {
        // ignore — feature phone may already be on STOP
      }
    }

    return { intent, replied };
  }

  /**
   * Build STATUS-summary params for the user identified by `phone`. Returns
   * placeholder labels (not raw scores) per R-10. Looks up the most recent
   * mock_test_result + the soonest upcoming olympiad registration.
   */
  private async summaryFor(phone: string): Promise<{ child: string; score: string; next: string }> {
    const { rows: userRows } = await this.db.query<{ user_id: number }>(
      `SELECT user_id FROM users WHERE phone_number = $1`,
      [phone],
    );
    const userId = userRows[0]?.user_id;
    if (!userId) {
      return { child: '—', score: '—', next: '—' };
    }
    const { rows: studentRows } = await this.db.query<{ student_id: number; display: string }>(
      `SELECT st.student_id,
              COALESCE(u.email, u.phone_number) AS display
         FROM students st
         JOIN users u ON u.user_id = st.user_id
        WHERE st.user_id = $1`,
      [userId],
    );
    const student = studentRows[0];
    if (!student) {
      return { child: '—', score: '—', next: '—' };
    }
    const { rows: scoreRows } = await this.db.query<{ score: number }>(
      `SELECT score FROM mock_test_results
         JOIN mock_test_sessions s ON s.session_id = mock_test_results.session_id
        WHERE s.student_id = $1
        ORDER BY mock_test_results.submitted_at DESC NULLS LAST
        LIMIT 1`,
      [student.student_id],
    );
    const { rows: nextRows } = await this.db.query<{ title: string }>(
      `SELECT o.title FROM registrations r
         JOIN olympiads o ON o.olympiad_id = r.olympiad_id
        WHERE r.student_id = $1 AND o.exam_date >= NOW()
        ORDER BY o.exam_date ASC
        LIMIT 1`,
      [student.student_id],
    );
    return {
      child: student.display,
      score: scoreRows[0]?.score?.toString() ?? '—',
      next: nextRows[0]?.title ?? '—',
    };
  }
}

function classifyIntent(body: string): 'STATUS' | 'STOP' | 'UNKNOWN' {
  const trimmed = body.trim().toUpperCase();
  if (trimmed === 'СТАТУС' || trimmed === 'STATUS') return 'STATUS';
  if (trimmed === 'ЗОГС' || trimmed === 'STOP') return 'STOP';
  return 'UNKNOWN';
}
