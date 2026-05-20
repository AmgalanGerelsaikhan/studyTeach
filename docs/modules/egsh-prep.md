# Module: EGSh (ЭЕШ) Prep Engine (PRD §4.2)

> The most important module for upper secondary students. Free, high-quality, score-band-predictive EGSh preparation. Owner: `backend-architect` (engine) + `ai-tutor-engineer` (adaptive remediation hook) + `frontend-architect` (UI).

## Purpose

Replace expensive private prep with a free, predictive, adaptive EGSh prep engine that narrows the UB ↔ province score gap.

## Scope

- Subjects: Mongolian Language (mandatory), Math, Physics, Chemistry, Biology, English, Russian, History, Social Studies, Geography.
- Past papers from 2013 onward in original Mongolian with worked solutions.
- Full-length timed mock tests with proctored mode (camera + tab-lock for self-discipline).
- Score-band predictor with weekly reset.
- Cohort comparison (anonymous): percentile against grade × aimag × nation.

## Behavior

- Timed mock: countdown timer; on submission, instant score.
- Proctored mode is opt-in self-discipline (not enforcement). Camera permission + tab visibility tracked; warning if tab loses focus.
- Missed questions feed the AI Tutor — opens that concept's remediation track.
- Score-band predictor shows a confidence interval; resets weekly to prevent gaming.
- Cohort comparison: percentile only, never absolute names. Aggregates by grade, aimag, nation.

## Free tier

- Free for all students at registered public schools.
- Tiered access for unregistered users (limits TBD with AIAA).

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/egsh/papers?subject=…&year=…` | Catalog of past papers |
| `POST` | `/egsh/mocks` | Start a mock-test session |
| `POST` | `/egsh/mocks/:id/answers` | Submit answers (queued in proctored mode) |
| `POST` | `/egsh/mocks/:id/submit` | Final submission; returns score |
| `GET` | `/egsh/predictor` | Score-band prediction |
| `GET` | `/egsh/cohort?grade=…&aimag=…` | Anonymous percentile |

## Data

- Reads: `mock_test_results`, `students`.
- Writes: `mock_test_sessions`, `mock_test_results`, `concept_mastery` (via Tutor hook).
- `mock_test_sessions.is_proctored_active` is the bit AI Tutor checks for the exam-mode refusal.

## UI (per prototype)

- Soot-gradient header signaling high-stakes context.
- Timer + question counter + proctor badges (camera, tab-lock).
- Question card with corner brackets; brass nav.
- Score-band predictor chart: trend line, cohort band, target zone.
- Subject mastery grid post-submission.

See `studyTeach (2)/student2.jsx` → EGSh Mock screen and `studyTeach (2)/student.jsx` → EGShMock predictor.

## Tests

- Mock-test session creation + idempotency.
- Submission scoring against known answer keys.
- Score-band predictor correctness on synthetic series.
- Cohort comparison anonymity — endpoint never leaks user IDs.
- Tutor exam-mode refusal triggers during active session.

## P0 acceptance

- [ ] All 10 subjects' past papers ingested (2013–present).
- [ ] Timed mock works offline (queued submission).
- [ ] Score-band predictor reset weekly.
- [ ] Cohort percentiles render without leaking identifiers.
- [ ] Missed concepts open a tutor session.
- [ ] Soot exam chrome matches design prototype.

## Equity targets (PRD §10.2)

- Narrow median mock-EGSh score gap UB ↔ province by 15 points within 12 months of P1 launch.
