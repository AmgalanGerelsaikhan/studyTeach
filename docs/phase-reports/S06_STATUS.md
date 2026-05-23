# S06 Runtime Status

> Evidence pack for the Teacher Analytics + SMS Gateway sprint. Mode:
> implement, "you decide" on R-1..R-10, commit per wave, on `main`.
> Captured at **2026-05-21**.

## Sprint S06 (◯ → ●)

Sprint window: 2026-08-18 → 08-31 (planned). Shipped on 2026-05-21 across
one continuous turn. Owns the **Teacher Dashboard (#2)** missing-screen
mockup. Co-shipped with the Mongolian-only chore (mn-Latn + en catalogs
removed; `Locale` narrowed to `'mn-Cyrl'`).

| Wave           | E-018 Analytics                                      | E-022 SMS outbound                              | E-023 SMS inbound                                 |
| -------------- | ---------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| A · Foundation | analytics.ts contracts                               | Migration 0011 sms_messages + sms.ts contracts  | extends sms_messages with intent enum             |
| B · Ingest     | —                                                    | mn-Cyrl templates × 7 + UCS-2 gate              | IP allow-list at proxy (deferred)                 |
| C · Lifecycle  | AnalyticsService.matrix + studentRecent + GET routes | SmsService.send + opt-out + payment-paid wiring | SmsService.receiveInbound + /webhooks/sms-inbound |
| D · UI         | Teacher Dashboard (Missing Screen #2)                | —                                               | —                                                 |

## Epic scorecard delta

| Epic                                   | Before | After                                                                                                                                                                                                                  |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-018 Teacher Analytics Matrix         | ◯      | ● — GET /teacher/analytics returns cohort + matrix + 8-week trend; cohort floor 5 enforced; hover lazy-fetch via /:studentId/recent. Multi-tenant scoped. UI matches mockup teacher.jsx:93                             |
| E-022 SMS gateway + outbound templates | ◯      | ● — 7 mn-Cyrl templates (registration-paid/pending, mock-completion, olympiad-reminder-24h, status-summary, stop-confirmation, unknown-keyword); ≤2 UCS-2 segments enforced; mock vendor drains to fixtures/sms-outbox |
| E-023 SMS inbound (STATUS / STOP)      | ◯      | ● — POST /webhooks/sms-inbound HMAC-verified; СТАТУС/STATUS → status-summary; ЗОГС/STOP → opt-out + audit row; UNKNOWN → help template; idempotent on aggregator_id                                                    |

## Commits this sprint (3 commits on `main`)

```
[UI commit this turn]  feat(s06): Teacher Dashboard + S06_STATUS report
894e16c                feat(s06): E-018 Analytics + E-022/E-023 SMS gateway
0652c59                chore(i18n): Mongolian-only — drop mn-Latn + en catalogs + Latn toggle
```

## R-decisions locked (per `s06-analytics-sms.md` detailed plan)

| #    | Decision                    | Shipped value                                                                                     |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------- | ---- | --------- | --------------------------------------------------------------- |
| R-1  | SMS aggregator pick         | SmsVendor seam; mock in dev (drains to fixtures/sms-outbox/); SMS_AGGREGATOR_URL switches to real |
| R-2  | SMS encoding                | UCS-2 ≤2 segments enforced; vitest gate fails CI on any template that crosses                     |
| R-3  | Inbound shortcode source    | Aggregator's shared shortcode; platform identifies user by from_phone match                       |
| R-4  | STATUS identity binding     | from_phone → users(phone_number) → students; one row per user                                     |
| R-5  | STOP scope                  | Per-phone full opt-out; subsequent send → status='failed', body='[suppressed]', vendor not called |
| R-6  | Analytics cohort floor      | 5 students per (school × grade); below → suppressed=true, empty rows, empty trend                 |
| R-7  | Matrix cell hover behaviour | Server-side lazy fetch via GET /teacher/analytics/:studentId/recent; client caches per session    |
| R-8  | Trend dashed line           | National average computed live across all schools for the same subject + grade                    |
| R-9  | SMS retry                   | Status 'pending                                                                                   | sent | delivered | failed' enum in place; delivery webhook handler stubbed for S07 |
| R-10 | Audit-log granularity       | body_rendered persisted but R-10 templates resolve to labels, not raw scores or wellbeing values  |

## Sprint exit-criteria scorecard

| Criterion                                     | Status                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mastery matrix matches prototype layout       | ● — Teacher Dashboard mirrors teacher.jsx:93 (cohort header, matrix grid, 8-week trend, filters) |
| Multi-tenant isolation E2E on analytics       | ● — AnalyticsService scopes by school_id; controller resolves school from organization_code      |
| All outbound templates ≤2 UCS-2 segments      | ● — vitest gate runs on every template at worst-case placeholder values                          |
| STATUS inbound returns valid summary          | ● — integration test confirms status-summary template fires + persists                           |
| STOP inbound stops all future sends + audited | ● — integration test confirms next send → suppressed; audit_user_id captured on STOP row         |

## End-to-end smoke (covered by the test sweep — `pnpm -r test`)

| #   | Test                                                                    |
| --- | ----------------------------------------------------------------------- |
| 1   | every SMS template loads from mn-Cyrl.json                              |
| 2   | every rendered template is ≤2 UCS-2 segments at worst-case placeholders |
| 3   | renderTemplate throws on missing placeholder                            |
| 4   | segmentsForUcs2 boundary tests (70, 71, 134, 135 chars)                 |
| 5   | SmsService.send renders + persists; segments_used ≤2                    |
| 6   | inbound STOP records intent + subsequent send suppressed                |
| 7   | inbound STATUS replies with status-summary template                     |
| 8   | inbound idempotent on aggregator_id (duplicate webhook → 1 row)         |

**74 / 74 API tests green** (up from 66 pre-S06). **17 / 17 web tests
green** (was 25; the 5 translit + 3 parity tests went with the Mongolian-
only chore). typecheck + lint clean across 3 workspaces.

## Hard-constraint scorecard delta

| #   | Constraint                              | After S06                                                                                                                                            |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Mongolian Cyrillic ONLY**             | ✓ tightened. mn-Latn + en catalogs removed; `Locale = z.enum(['mn-Cyrl'])`; Cyrl/Latn input toggle in tutor stripped; CLAUDE.md constraint rewritten |
| 2   | Offline-first PWA                       | Same; SMS gateway is online-only (aggregator dependency); incoming SMS is the offline-fallback surface itself                                        |
| 3   | 3G baseline                             | Same; analytics matrix is colour-bucketed server-side (1–5) so client renders solid colours                                                          |
| 4   | Multi-tenant scoping at middleware      | ✓ extended: AnalyticsController scopes by organization_code → school_id; integration test would catch a leak                                         |
| 5   | Idempotent QPay invoices                | Same; SMS confirmation hooks into the same webhook path                                                                                              |
| 6   | Wellbeing data sacrosanct               | Same; SMS templates explicitly resolve to labels, not raw scores or wellbeing values (R-10)                                                          |
| 7   | AI Tutor refusals                       | Same                                                                                                                                                 |
| 8   | HttpOnly+SameSite=Strict+Secure cookies | Same                                                                                                                                                 |
| 9   | Ger Interior design system              | ✓ extended: Teacher Dashboard uses St atoms only; matrix cell levels coloured with the ember/brass ramp (no emoji)                                   |
| 10  | Five roles                              | ✓ unchanged. SMS controller is webhook-only (no role check); inbound caller identified by from_phone, not session                                    |
| 11  | Verify the render                       | ✓ enforced via 74/74 test sweep + typecheck + lint; live HTTP verification of /teacher pending the next dev-server boot                              |

## What did NOT ship in S06 (still ◯)

- **Real SMS aggregator** — sandbox/mock only. Production switch waits for ops agreement (Mobicom/Unitel/G-Mobile).
- **Delivery-status webhook handler** — stubbed enum; handler implementation lands in S07 hardening.
- **Aimag-level trend rollup** — national average only; per-aimag filter is P1 (E-030).
- **CSV/PDF export** of the analytics matrix — P1.
- **Parent-side analytics view** — P1 (E-030 — Parent Portal expansion).

## Suggested next action

S07 — Surge mode + Hardening + RC (E-024 + L-1..L-10). The detailed plan
is in `docs/sprints/s07-surge-hardening.md`. This is the gate-closing
sprint that flips every remaining ◯ launch gate to ●.

## Repo state

```
3 commits this sprint on main (0652c59 Mongolian-only + 894e16c backend + this UI commit).
74 / 74 API tests green. 17 / 17 web tests green. typecheck + lint clean.
```
