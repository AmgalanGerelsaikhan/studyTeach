-- 0005 · Add natural-key UNIQUE on curriculum_chunks.
--
-- Why: T2/T3 ingest re-runs (CLI + CI) must be idempotent. Without a UNIQUE,
-- ON CONFLICT (lang, subject, grade, source_ref) has no constraint to target
-- and re-runs would duplicate every chunk. We pick this 4-tuple because:
--   - lang differentiates the same source rendered in mn-Cyrl vs mn-Latn vs en
--   - subject + grade scope the strand path
--   - source_ref is the authoritative pointer into the БНХ / ЭЕШ corpus
-- The composite is small (≤4 short columns) and lookup by it is rare — we
-- accept the extra index purely for write-time enforcement.

-- Up Migration

ALTER TABLE curriculum_chunks
  ADD CONSTRAINT uq_cc_natural_key UNIQUE (lang, subject, grade, source_ref);

-- Down Migration

ALTER TABLE curriculum_chunks
  DROP CONSTRAINT IF EXISTS uq_cc_natural_key;
