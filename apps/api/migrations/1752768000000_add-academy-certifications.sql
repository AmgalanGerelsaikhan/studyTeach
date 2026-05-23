-- 0015 · Teacher Academy — CPD certifications (E-026).
--
-- P1 module (PRD §4.5). When a teacher passes the course's FINAL assessment
-- (≥ pass_threshold, default 75) AND has completed every lesson, the
-- assessment service issues a digital badge here. The school admin can read
-- a teacher's CPD transcript scoped by organization_code (snapshotted at
-- enroll time on academy_enrollments — migration 0014).
--
-- cpd_credits is snapshotted at issuance so a later course re-pricing does
-- not retroactively change a teacher's transcript.
-- moe_endorsed defaults FALSE until the PRD §11.1 MoE partnership lands;
-- the transcript UI surfaces a disclaimer until then.

-- Up Migration

CREATE TABLE academy_certifications (
  certification_id    SERIAL PRIMARY KEY,
  enrollment_id       INT NOT NULL REFERENCES academy_enrollments (enrollment_id) ON DELETE CASCADE,
  course_id           INT NOT NULL REFERENCES academy_courses     (course_id)     ON DELETE RESTRICT,
  teacher_user_id     INT NOT NULL REFERENCES users               (user_id)       ON DELETE CASCADE,
  -- Snapshot from academy_enrollments at issuance time — survives org moves.
  organization_code   VARCHAR(50),
  final_submission_id INT NOT NULL REFERENCES academy_assessment_submissions (submission_id) ON DELETE RESTRICT,
  score               SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  -- Snapshot of academy_courses.cpd_credits at issuance.
  cpd_credits         NUMERIC(4,1) NOT NULL CHECK (cpd_credits >= 0),
  -- Flips TRUE per-row once the MoE partnership endorses the course's credit.
  moe_endorsed        BOOLEAN NOT NULL DEFAULT FALSE,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One badge per teacher per course. Re-passing returns the existing row.
  UNIQUE (course_id, teacher_user_id)
);

CREATE INDEX idx_academy_certs_teacher ON academy_certifications (teacher_user_id);
CREATE INDEX idx_academy_certs_org     ON academy_certifications (organization_code);

COMMENT ON TABLE academy_certifications IS
  'Teacher Academy CPD badges (PRD §4.5, E-026). Issued atomically by AssessmentService on a passing FINAL when all lessons are complete.';
COMMENT ON COLUMN academy_certifications.cpd_credits IS
  'Snapshotted from academy_courses.cpd_credits at issuance — does not track later course re-pricing.';
COMMENT ON COLUMN academy_certifications.moe_endorsed IS
  'Flips TRUE per-course once the MoE partnership endorses the credit value (PRD §11.1 — open dependency).';

-- Down Migration
-- Intentionally omitted (destructive). ADR-0012.
