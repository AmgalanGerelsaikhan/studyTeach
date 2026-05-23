-- 0006 · Add natural-key UNIQUE on practice_problems.
--
-- Mirrors curriculum_chunks (0005). The seed CLI needs a target for
-- ON CONFLICT so re-runs refresh `answer_key` + `difficulty` in place
-- rather than duplicate rows.
--
-- Natural key: (subject, grade, lang, prompt). `prompt` is the human-
-- readable problem text — re-using the exact same prompt in the same
-- (subject, grade, lang) context is almost certainly a duplicate.

-- Up Migration

ALTER TABLE practice_problems
  ADD CONSTRAINT uq_pp_natural_key UNIQUE (subject, grade, lang, prompt);

-- Down Migration

ALTER TABLE practice_problems
  DROP CONSTRAINT IF EXISTS uq_pp_natural_key;
