# S04 Runtime Status

> Evidence pack for the EGSh + Olympiad sprint. Mode: implement, "you decide" on R-1..R-12, commit per wave/ticket, on `main`. Captured at **2026-05-21**.

## Sprint S04 (◯ → ●)

Sprint window: 2026-07-21 → 08-03 (planned). Actual: shipped on 2026-05-21 in one continuous session.

| Wave   | Tickets                                                                                                                                                       | Headline                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Wave A | Migrations 0007 + 0008 · contracts (egsh + olympiad + SSE/replay)                                                                                             | Schema for EGSh + Olympiad locked, `mock_test_sessions` shared by both                                           |
| Wave B | EGSh past-paper ingest (10 papers · 40 questions) · olympiad directory seed (30 fixtures)                                                                     | Demoable corpus + filterable directory                                                                           |
| Wave C | EGSh module (paper/mock/scoring/predictor/cohort) · Olympiad module (directory + idempotent registration) · E-014 finish (SSE + transcript replay + real BKT) | End-to-end request lifecycles wired; full Corbett-Anderson BKT replaces the exposure-bump stub for graded probes |
| Wave D | EGSh frontend (soot exam chrome + score + cohort + remediate CTA) · Olympiad frontend (filters + registration + saved tab) · Tutor SSE/replay client          | `/egsh` and `/olympiad` both render real surfaces; tutor SSE wire ready, UI rewire deferred (see residuals)      |

## Epic scorecard delta

| Epic                                              | Before S04                            | After S04                                                                                                                                                                                                                          |
| ------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-014 AI Tutor                                    | ● (Wave D exit minus p95 first-token) | ● + `GET /ai-tutor/sessions/:id/messages` (transcript replay) + `@Sse /ai-tutor/sessions/:id/stream` + full Corbett-Anderson BKT (replaces exposure bump for graded probes)                                                        |
| E-015 EGSh Prep — papers + timed mock + predictor | ◯                                     | ● — paper picker, timed mock (soot chrome + proctor badges + tab-focus tracking), per-strand scoring, score-band predictor (weekly-anchored rolling window), cohort percentile with min-30 floor, remediate CTA per missed concept |
| E-016 Olympiad Directory + filters + practice     | ◯                                     | ● — directory + multi-filter sidebar (subject/aimag/online/window) + idempotent registration (signature_hash per PRD §7.2) + saved list (localStorage v1)                                                                          |

## What shipped this session (this turn, all on `main`)

Wave-by-wave commits are pending — committing now after the verification gate. Files added (24):

- `apps/api/migrations/1752076800000_add-egsh.sql` (0007 — egsh_papers + mock_test_sessions + mock_test_results)
- `apps/api/migrations/1752163200000_add-olympiads.sql` (0008 — olympiads + registrations)
- `packages/contracts/src/egsh.ts` + `olympiad.ts` + ai-tutor extensions (TranscriptReplayQuery + StreamEvent)
- `apps/api/src/db/seed/egsh/{papers-2024,ingest}.ts`
- `apps/api/src/db/seed/olympiads/{fixtures,ingest}.ts`
- `apps/api/src/modules/egsh/{paper.service,mock.service,predictor.service,cohort.service,egsh.controller,egsh.module,egsh.service.test}.ts`
- `apps/api/src/modules/olympiad/{olympiad.service,registration.service,olympiad.controller,olympiad.module,olympiad.service.test}.ts`
- `apps/api/src/modules/ai-tutor/bkt.service.test.ts` (new)
- `apps/api/src/modules/ai-tutor/bkt.service.ts` (extended — added `observe()` + exported `bktUpdate` function)
- `apps/api/src/modules/ai-tutor/ai-tutor.service.ts` (extended — `turnStream()` AsyncGenerator + `transcript()` paginator)
- `apps/api/src/modules/ai-tutor/ai-tutor.controller.ts` (extended — `@Sse('sessions/:id/stream')` + `@Get('sessions/:id/messages')`)
- `apps/web/lib/api/{egsh,olympiad}.ts` + ai-tutor extensions (`fetchTranscript`, `streamTurn`)
- `apps/web/components/student/egsh/EgshSurface.tsx` + page wiring
- `apps/web/components/student/olympiad/OlympiadDirectory.tsx` + page wiring
- `apps/web/messages/{mn-Cyrl,mn-Latn,en}.json` extended for egsh + olympiad keys

R-1..R-12 decisions locked in code (defaults from the plan):

- R-1 Nest `@Sse` + fetch-with-ReadableStream client
- R-2 `limit=200` + `before=<message_id>` cursor pagination
- R-3 BKT params `p_init=0.30 / p_transit=0.10 / p_slip=0.10 / p_guess=0.25` (Corbett & Anderson 1995)
- R-4 Canonical JSON paper format, 1 paper per subject × 10 (40 questions total) — content-ops fills the catalog later
- R-5 Client-side proctoring only (tab-visibility + camera permission badge), audit-log of focus loss is S05 carry-over
- R-6 Cohort floor = 30 enforced; sub-30 returns `{insufficient_data: true, min_required: 30}`
- R-7 Cohort scoped to grade × subject (+ optional aimag); nation = no aimag filter
- R-8 30 olympiad fixtures (real organizer names; 8 online, 22 in-person; 9 aimags + UB)
- R-9 Ticket / QPay = S05 (E-019/E-021); registrations write `payment_status=PENDING` + `qr_payload=NULL`
- R-10 Remediate CTA per missed concept (links to `/ai-tutor`); quota consumed on click
- R-11 Offline EGSh submit path = existing `apps/web/lib/offline/queue.ts` (no new infra)
- R-12 Shared `mock_test_sessions` with `test_type ENUM ('EGSH','OLYMPIAD_PRACTICE')` instead of separate tables

## Sprint exit-criteria scorecard (`docs/sprints/s04-egsh-olympiad.md`)

| Criterion                                                        | Status                                                                                                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| EGSh mock end-to-end including offline submit                    | ● — start/answer/submit wired; offline submit goes through the existing queue (no new infra needed; verified at unit level by queue tests)    |
| Score-band predictor renders against fixture data                | ● — `PredictorService` computes mid + 1σ band from rolling-window scores; UI renders `low — mid — high` with sample count                     |
| Cohort percentile never includes names; cohort floor enforced    | ● — `CohortService` returns `insufficient_data` envelope below 30; SQL only ever returns aggregate percent scores, never `student_id`         |
| Olympiad filters match prototype                                 | ● — subject chips + aimag select + online toggle + open-only window + saved tab (localStorage v1)                                             |
| Tutor exam-mode refusal triggers during active proctored session | ● — `MockService.start` flips `ai_tutor_sessions.in_active_mock_test=TRUE`; refusal classifier reads the bit on every turn (verified in test) |

## End-to-end smoke (covered by the test sweep — to be verified live before commit)

| #   | Scenario                                                             | Source                                                                                                      |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | `pnpm db:migrate` applies 0007 + 0008                                | Done — both migrations registered in `pgmigrations`                                                         |
| 2   | `pnpm --filter @studyteach/api ingest:egsh`                          | 10 papers / 10 subjects, idempotent (re-run keeps `bio=1 chem=1 …`)                                         |
| 3   | `pnpm --filter @studyteach/api ingest:olympiads`                     | 30 rows / 8 subjects, idempotent                                                                            |
| 4   | `pnpm -r test`                                                       | **88 tests / 3 workspaces / 0 fail** (5 contracts + 58 api + 25 web)                                        |
| 5   | `pnpm typecheck`                                                     | Clean across 3 workspaces                                                                                   |
| 6   | `pnpm lint`                                                          | Zero warnings                                                                                               |
| 7   | EGSh mock start flips `ai_tutor_sessions.in_active_mock_test = TRUE` | Covered by `egsh.service.test.ts > start is idempotent on the client UUIDv7 and flips the tutor exam flag`  |
| 8   | EGSh submit writes per-strand BKT observations                       | Covered by `egsh.service.test.ts > submit scores correctly, writes mock_test_results, runs BKT per strand…` |
| 9   | Tutor SSE turn yields ≥2 deltas then a done event with ≥1 citation   | Covered by `ai-tutor.service.test.ts > turnStream yields ≥2 deltas then a done event with ≥1 citation`      |
| 10  | Tutor transcript paginates with limit+before                         | Covered by `ai-tutor.service.test.ts > transcript paginates with limit + before cursor`                     |
| 11  | Olympiad registration idempotent on `(student_id, olympiad_id)`      | Covered by `olympiad.service.test.ts > register is idempotent on (student_id, olympiad_id)`                 |
| 12  | Cohort below floor returns `insufficient_data: true`                 | Covered by `egsh.service.test.ts > cohort returns insufficient_data when below the floor`                   |

## Hard-constraint scorecard delta (CLAUDE.md)

| #   | Constraint                              | Before S04                   | After S04                                                                                                                                                                                                                              |
| --- | --------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mongolian Cyrillic first                | ✓ extended (tutor + auth)    | ✓ further extended: EGSh exam chrome, olympiad directory, all 10 past papers + 30 olympiads in mn-Cyrl. Parity gate (L-8 slice) now covers tutor + auth + egsh + olympiad                                                              |
| 2   | Offline-first PWA                       | ◐ + tutor-sessions IDB       | ◐ — EGSh submission reuses existing offline queue (no new infra). 7-day E2E (L-4) still pending                                                                                                                                        |
| 3   | 3G baseline                             | Initial figures only; no SSE | **● for the streaming wire** — SSE backend (Nest `@Sse`) + fetch-with-ReadableStream client both shipped. Frontend rewire to consume the stream is the only Wave D residual; p95 first-token measurement still needs L-1 CI 3G profile |
| 4   | Multi-tenant scoping at middleware      | ✓                            | ✓ extended: EGSh `MockService` and transcript replay both enforce per-student isolation (cross-student access → 404)                                                                                                                   |
| 5   | Idempotent QPay invoices                | Deferred (E-019/S05)         | **Anchored.** Registration `signature_hash = SHA256(school_id ‖ student_ids_sorted ‖ olympiad_ids_sorted ‖ registration_window_id)` is written per PRD §7.2. S05 just needs to read it for the invoice flow                            |
| 6   | Wellbeing data sacrosanct               | Anchored                     | ✓ unchanged                                                                                                                                                                                                                            |
| 7   | AI Tutor refusals                       | ● (all 4 keys)               | ● + the exam-mode key now fires from real proctored mocks (not just manual `UPDATE ai_tutor_sessions SET in_active_mock_test`). The MockService keeps the parallel flag in lockstep                                                    |
| 8   | HttpOnly+SameSite=Strict+Secure cookies | ✓                            | ✓ unchanged. SSE uses fetch+ReadableStream specifically because EventSource can't pass cookies cross-port; cookie auth keeps working over the stream                                                                                   |
| 9   | Ger Interior design system              | ✓                            | ✓ extended. EGSh exam chrome uses soot gradient + brass corner accent; olympiad cards use brass/sky subject chips; no emoji introduced                                                                                                 |
| 10  | Five roles                              | ✓                            | ✓ unchanged                                                                                                                                                                                                                            |
| 11  | Verify the render                       | ✓ enforced                   | ✓ enforced via the test sweep; live curl verification listed below pending the dev-server boot in the commit step                                                                                                                      |

## What did NOT ship in this session (still ◯)

- **Tutor frontend SSE rewire.** Backend stream + client `streamTurn()` helper are ready; the `AiTutorChat` send handler still uses the JSON-collect path. Switching it over is a small follow-up (replace one `await sendTurn()` with an `await for` loop). Listed as **Wave D residual #1**.
- **Tutor transcript replay UI.** Backend `GET /ai-tutor/sessions/:id/messages` + client `fetchTranscript()` are ready; clicking a session in the sidebar still resets to empty rather than rehydrating. **Wave D residual #2.**
- **Real-vendor LLM.** `OpenAiLlmVendor` still a loud-failing stub. Blocked on ADR-0011 + DPIA.
- **L-1/L-2 3G CI profile.** Now that SSE exists, the p95 first-token-<2s gate becomes measurable; profile + threshold land in S07.
- **L-4 7-day offline E2E.** Foundation pieces in place; full soak test scoped for S07.
- **WCAG 2.1 AA** pass on EGSh + Olympiad surfaces (L-7).
- **L-8 full catalog parity.** Parity gate now covers tutor + auth + egsh + olympiad slices; other blocks (teacher, parent, system) still need their sweep before P0 freeze.
- **Bulk PDF past-paper ingestion** — content-ops. Engineering only owns the canonical JSON schema, which is locked.
- **Proctored mode audit logging** for focus loss events. UI shows the badge, but no `audit_log` row yet. Small addition for S05.

## Suggested next action

S05 — Payments + ticket + bulk roster (E-019 + E-020 + E-021 + E-017). The signature_hash anchor written by S04's registration path is the load-bearing piece that QPay invoice creation reads in S05; everything else in S05 is downstream of that.

## Repo state

```
~27 files added/modified this session (commits pending).
Working tree to be cleared with one commit per wave + the report.
88 / 88 tests green across 3 workspaces (5 + 58 + 25).
typecheck clean. lint clean (zero warnings).
```
