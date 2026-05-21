-- 0009 · Payments + E-Barimt (E-019 + E-020).
--
-- Tables:
--   * invoices — one row per payment intent. signature_hash is the
--                idempotency anchor described in PRD §7.2 (already written
--                onto registrations.signature_hash in 0008). Same shape so
--                an invoice "looks up" registrations by hash.
--                qpay_invoice_id stays NULL until QPay returns it; UNIQUE
--                NULLs-distinct dedups confirmed invoices.
--                ebarimt_id NULL until ebarimt.mn issues; ebarimt_retries
--                counts the backoff attempts (cap before alerting ops).

-- Up Migration

CREATE TABLE invoices (
  invoice_id        SERIAL PRIMARY KEY,
  signature_hash    VARCHAR(64) UNIQUE NOT NULL,
  qpay_invoice_id   VARCHAR(128) UNIQUE,
  school_id         INT REFERENCES schools (school_id),
  issued_to         INT NOT NULL REFERENCES users (user_id),
  total_mnt         INTEGER NOT NULL CHECK (total_mnt >= 0),
  surcharge_mnt     INTEGER NOT NULL DEFAULT 0 CHECK (surcharge_mnt >= 0),
  payment_status    payment_status_enum NOT NULL DEFAULT 'PENDING',
  ebarimt_id        VARCHAR(128),
  ebarimt_retries   INTEGER NOT NULL DEFAULT 0,
  ebarimt_pdf_path  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at      TIMESTAMPTZ
);

CREATE INDEX idx_invoices_issued_to       ON invoices (issued_to);
CREATE INDEX idx_invoices_school          ON invoices (school_id);
CREATE INDEX idx_invoices_status_created  ON invoices (payment_status, created_at DESC);

COMMENT ON COLUMN invoices.signature_hash IS
  'SHA-256 over the same canonical tuple as registrations.signature_hash. PaymentService.create looks up by hash before INSERT — repeated submissions return the existing row.';
COMMENT ON COLUMN invoices.qpay_invoice_id IS
  'Issued by QPay on invoice creation. NULL until the QPay create call succeeds.';
COMMENT ON COLUMN invoices.ebarimt_id IS
  'Issued by ebarimt.mn on receipt sync. Retry counter in ebarimt_retries.';

-- Down Migration
-- Intentionally omitted (destructive). ADR-0012.
