-- Migration 0002 · Audit log infrastructure
-- Source of truth: PRD §8.1, docs/DATABASE_SCHEMA.md, ADR-0006 (tenant scope audit)
-- Refs: E-005

-- Up Migration
CREATE TABLE audit_log (
  log_id        BIGSERIAL PRIMARY KEY,
  actor_user_id INT REFERENCES users (user_id),
  action        VARCHAR(100) NOT NULL,
  target_type   VARCHAR(50),
  target_id     VARCHAR(100),
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_actor_time ON audit_log (actor_user_id, created_at DESC);
CREATE INDEX idx_audit_log_action     ON audit_log (action, created_at DESC);

-- Append-only enforcement. UPDATE/DELETE blocked at the DB layer so even
-- a misbehaving service or rogue psql session can't tamper with history.
-- See ADR-0014 / PRD §8.1 / docs/SECURITY_PRIVACY.md.
CREATE OR REPLACE FUNCTION raise_on_audit_mutate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (no UPDATE or DELETE)';
END $$;

CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION raise_on_audit_mutate();

CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION raise_on_audit_mutate();

COMMENT ON TABLE audit_log IS
  'Append-only. 7-year retention. Partition by month in a follow-on migration before P0 launch.';

-- Down Migration
-- Intentionally omitted (destructive). To revert in dev, drop manually.
