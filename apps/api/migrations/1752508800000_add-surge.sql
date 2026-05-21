-- 0012 · Surge mode (E-024).
--
-- Tokens are issued when SURGE_ENABLED=true and a /payments/invoices call
-- comes in. The token is the client's handle for polling /queue-position/:token.
-- signature_hash is the same anchor as invoices.signature_hash — once the
-- worker consumes the token, the resulting invoice row carries the same hash
-- (idempotency cascades naturally).
--
-- Capacity model: position is a monotonically-increasing INT per (re)issue
-- of the surge mode; the worker decrements via SerialScan. fulfilled_at NULL
-- means "still queued"; a non-NULL timestamp means the invoice row is created.

-- Up Migration

CREATE TABLE surge_queue_tokens (
  token            UUID PRIMARY KEY,
  signature_hash   VARCHAR(64) NOT NULL,
  -- Position at the moment of enqueue. Display value, not authoritative —
  -- the worker reads from the Redis stream in order.
  position         INTEGER NOT NULL CHECK (position >= 0),
  enqueued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at     TIMESTAMPTZ,
  -- Linked invoice row after the consume worker writes it. NULL until then.
  invoice_id       INTEGER REFERENCES invoices (invoice_id)
);

CREATE INDEX idx_surge_unfulfilled  ON surge_queue_tokens (enqueued_at ASC)
  WHERE fulfilled_at IS NULL;
CREATE INDEX idx_surge_signature    ON surge_queue_tokens (signature_hash);

COMMENT ON TABLE surge_queue_tokens IS
  'Issued during surge mode (SURGE_ENABLED=true). Client polls /queue-position/:token until fulfilled_at is set. The worker is the only writer of invoices when surge is on, guaranteeing PRD §10 zero-data-loss target.';

-- Down Migration
-- Intentionally omitted (destructive). ADR-0012.
