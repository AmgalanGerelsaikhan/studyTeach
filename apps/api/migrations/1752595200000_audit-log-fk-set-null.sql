-- 0013 · audit_log.actor_user_id ON DELETE SET NULL + permit identity erasure.
--
-- The audit_log table is append-only (UPDATE/DELETE blocked by trigger), so
-- when a user was deleted the FK rejected the operation entirely. That
-- blocked test cleanup AND blocks the GDPR-style "delete-on-request" flow
-- we'll need in P2.
--
-- Two coordinated changes:
--   1. FK now ON DELETE SET NULL — the cascade nulls actor_user_id rather
--      than rejecting the user delete.
--   2. The UPDATE trigger now permits updates that only touch actor_user_id
--      (the cascade-set-null path). All other UPDATEs still raise. The row
--      content stays authoritative; actor identity is the part that goes
--      null on erasure.

-- Up Migration

ALTER TABLE audit_log
  DROP CONSTRAINT audit_log_actor_user_id_fkey,
  ADD CONSTRAINT audit_log_actor_user_id_fkey
    FOREIGN KEY (actor_user_id) REFERENCES users (user_id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION raise_on_audit_mutate_v2()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Permit the FK SET NULL cascade: every other column unchanged AND
    -- actor_user_id transitions to NULL.
    IF NEW.action = OLD.action
       AND NEW.target_type IS NOT DISTINCT FROM OLD.target_type
       AND NEW.target_id   IS NOT DISTINCT FROM OLD.target_id
       AND NEW.metadata    IS NOT DISTINCT FROM OLD.metadata
       AND NEW.created_at  = OLD.created_at
       AND NEW.actor_user_id IS NULL
       AND OLD.actor_user_id IS NOT NULL
    THEN
      RETURN NEW;
    END IF;
  END IF;
  RAISE EXCEPTION 'audit_log is append-only (no UPDATE or DELETE)';
END $$;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION raise_on_audit_mutate_v2();

-- Down Migration
-- Intentionally omitted (destructive). ADR-0012.
