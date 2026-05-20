# Sprint S04 — EGSh Prep + Olympiad Directory

**2026-07-27 → 08-09**

## Goal

A student can run a timed EGSh mock test, submit, see a score and a band predictor, and have a missed concept open a tutor session. They can also browse the Olympiad directory and start a practice mock from a past paper.

## Active epics

| Epic | Owner | Exit |
|---|---|---|
| E-014 · AI Tutor (final week) | ai-tutor-engineer | adaptive remediation hook from EGSh wired |
| E-015 · EGSh Prep — papers + timed mock + predictor | backend-architect | full-length mock + score + predictor + cohort percentile |
| E-016 · Olympiad Directory + filters + practice | backend-architect | directory + filters + practice mock + saved list |

## Ticket seed list

- `[E-014]` Hook: missed mock-test question → open tutor session on that strand.
- `[E-015]` Ingest EGSh past papers (start: 2020–2024, all 10 subjects).
- `[E-015]` Migration: `mock_test_sessions` (proctored flag), `mock_test_results`.
- `[E-015]` Timed mock controller with `is_proctored_active` bit.
- `[E-015]` Submission scoring against answer keys.
- `[E-015]` Score-band predictor (rolling window; weekly reset).
- `[E-015]` Cohort percentile endpoint (grade × aimag × nation; never names).
- `[E-015]` Soot-gradient exam chrome on the frontend.
- `[E-015]` Proctor camera + tab-lock badges.
- `[E-015]` Offline submission queueing (queued via sync if offline at submit).
- `[E-016]` Migration: `olympiads`, `registrations` (UNIQUE student_id, olympiad_id).
- `[E-016]` Seed Olympiad directory with 30 fixture olympiads (real subjects, real aimag venues).
- `[E-016]` Multi-filter sidebar UI.
- `[E-016]` Olympiad cards + saved list.
- `[E-016]` Practice mock from past paper (separate from EGSh path).

## Sprint risks

- Past-paper ingestion is tedious. **Mitigation:** content-ops parallel work; engineering only validates schema.
- Cohort percentile leaks identifiers if window too small. **Mitigation:** minimum cohort size 30; otherwise return "insufficient data".

## Demo

- Run a 20-question EGSh mock test in proctored mode.
- Submit, see score + band predictor.
- See cohort percentile.
- Click a missed concept → tutor session opens on that strand.
- Browse Olympiad directory; filter by Math + Khentii aimag + online.

## Exit criteria

- ◯ EGSh mock end-to-end including offline submit.
- ◯ Score-band predictor renders against fixture data.
- ◯ Cohort percentile never includes names; cohort floor enforced.
- ◯ Olympiad filters match prototype.
- ◯ Tutor exam-mode refusal triggers during active proctored session.
