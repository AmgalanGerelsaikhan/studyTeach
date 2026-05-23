-- 0010 · Tickets + bulk roster + national-ID hash (E-021 + E-017).
--
-- Tables:
--   * tickets         — signed digital tickets. registration_id is the PK
--                       (one ticket per registration); payload is the JWS
--                       compact serialization; qr_png is the pre-rendered
--                       QR PNG bytes so the offline render path doesn't
--                       need a client-side QR lib.
--   * roster_uploads  — teacher-initiated CSV uploads. roster_hash is the
--                       idempotency anchor — same CSV uploaded twice
--                       returns the existing row.
--   * students extension — national_id_hash for cross-roster dedup; the
--                       plain national ID is NEVER stored (PDP Law §4
--                       data-minimization).

-- Up Migration

CREATE TABLE tickets (
  registration_id  INT PRIMARY KEY REFERENCES registrations (registration_id) ON DELETE CASCADE,
  -- JWS compact serialization. Format: header.payload.signature
  payload          TEXT NOT NULL,
  -- Pre-rendered QR PNG bytes. Offline render path serves this directly.
  qr_png           BYTEA NOT NULL,
  -- Key identifier so multiple key versions can coexist during rotation.
  kid              VARCHAR(64) NOT NULL,
  signed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN tickets.payload IS
  'JWS compact serialization signed with the active ticket-signing key (ES256 in prod via GCP Cloud KMS; RS256/ES256 software key in dev). Header carries `kid`.';
COMMENT ON COLUMN tickets.qr_png IS
  'QR PNG generated server-side via the `qrcode` lib. Sized for 4cm × 4cm print at 300 DPI.';

ALTER TABLE students
  ADD COLUMN national_id_hash VARCHAR(64);

-- Cross-roster dedup within a school. A national ID can appear in at most
-- one student row per school. NULL-distinct so legacy rows without a hash
-- don't conflict.
CREATE UNIQUE INDEX uq_students_national_id_school
  ON students (school_id, national_id_hash)
  WHERE national_id_hash IS NOT NULL;

COMMENT ON COLUMN students.national_id_hash IS
  'SHA-256 of the Mongolian national ID. Plain ID never persists or logs (PDP Law §4). Populated by the bulk-roster upload path (E-017).';

CREATE TABLE roster_uploads (
  roster_id      SERIAL PRIMARY KEY,
  school_id      INT NOT NULL REFERENCES schools (school_id),
  uploaded_by    INT NOT NULL REFERENCES users (user_id),
  roster_hash    VARCHAR(64) UNIQUE NOT NULL,
  row_count      INT NOT NULL CHECK (row_count >= 0),
  -- JSON snapshot of the parsed + validated rows. Stored so the commit
  -- step is replay-safe and the audit trail is reconstructible.
  parsed_rows    JSONB NOT NULL,
  committed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roster_uploads_school   ON roster_uploads (school_id);
CREATE INDEX idx_roster_uploads_uploader ON roster_uploads (uploaded_by, created_at DESC);

COMMENT ON COLUMN roster_uploads.roster_hash IS
  'SHA-256(school_id ‖ sorted(national_id_hashes) ‖ window_id). Same CSV re-uploaded returns the same row.';

-- Down Migration
-- Intentionally omitted (destructive). ADR-0012.
