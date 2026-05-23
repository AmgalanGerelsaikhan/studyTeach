-- 0011 · SMS gateway (E-022 outbound + E-023 inbound).
--
-- Single table covers both outbound and inbound:
--   * outbound rows have aggregator_id (UNIQUE), template_key, segments_used
--   * inbound rows have is_inbound = TRUE + inbound_intent (STATUS/STOP/UNKNOWN)
--   * opt-out rows (inbound STOP) have audit_user_id pointing at the affected
--     user — also used to suppress all future outbound sends to that phone.
--
-- body_rendered captures what was actually sent/received; for outbound that
-- includes resolved placeholders. NO scores or wellbeing data in the body
-- (R-10 — audit-log granularity per template_key only).

-- Up Migration

CREATE TYPE sms_status_enum AS ENUM ('pending', 'sent', 'delivered', 'failed');
CREATE TYPE sms_intent_enum AS ENUM ('STATUS', 'STOP', 'UNKNOWN');

CREATE TABLE sms_messages (
  sms_id            SERIAL PRIMARY KEY,
  recipient_phone   VARCHAR(20) NOT NULL,
  template_key      VARCHAR(64),
  body_rendered     TEXT NOT NULL,
  segments_used     INTEGER NOT NULL CHECK (segments_used > 0),
  status            sms_status_enum NOT NULL DEFAULT 'pending',
  is_inbound        BOOLEAN NOT NULL DEFAULT FALSE,
  inbound_intent    sms_intent_enum,
  aggregator_id     VARCHAR(128) UNIQUE,
  audit_user_id     INT REFERENCES users (user_id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sms_recipient_created    ON sms_messages (recipient_phone, created_at DESC);
CREATE INDEX idx_sms_status_created       ON sms_messages (status, created_at DESC) WHERE NOT is_inbound;
CREATE INDEX idx_sms_inbound_created      ON sms_messages (created_at DESC) WHERE is_inbound;

-- Phone-level opt-out flag derived from the most recent inbound STOP for
-- that phone. Implemented as a partial unique index so the SmsService can
-- check existence in O(1).
CREATE INDEX idx_sms_stop_by_phone ON sms_messages (recipient_phone)
  WHERE inbound_intent = 'STOP';

COMMENT ON TABLE sms_messages IS
  'Unified outbound + inbound SMS log. R-10: body_rendered MUST NOT contain raw scores or wellbeing data; templates resolve placeholders to labels not values.';
COMMENT ON COLUMN sms_messages.aggregator_id IS
  'Vendor-side id (Mobicom/Unitel/G-Mobile or mock). UNIQUE prevents duplicate webhook deliveries.';
COMMENT ON COLUMN sms_messages.audit_user_id IS
  'For STOP rows, the user whose phone matched. Used to scope future suppression.';

-- Down Migration
-- Intentionally omitted (destructive). ADR-0012.
