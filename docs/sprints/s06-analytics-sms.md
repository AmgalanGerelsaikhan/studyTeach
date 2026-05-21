# Sprint S06 — Teacher Analytics + SMS Gateway

**2026-08-18 → 08-31**

## Goal

A teacher sees a class-level mastery matrix and an 8-week mock-test trend. Parents on feature phones receive payment-confirmation SMS in Mongolian Cyrillic and can reply `СТАТУС` to query.

## Active epics

| Epic                                     | Owner             | Exit                                                     |
| ---------------------------------------- | ----------------- | -------------------------------------------------------- |
| E-018 · Teacher Analytics Matrix         | backend-architect | per-student × per-strand heat matrix + 8-week trend      |
| E-022 · SMS gateway + outbound templates | backend-architect | outbound templates ≤2 segments; ≥98% delivery on staging |
| E-023 · SMS inbound (STATUS / STOP)      | backend-architect | inbound STATUS/STOP routed; STOP recorded in audit log   |

## Ticket seed list

- `[E-018]` `/teacher/analytics?class_id=…&subject=…` returns matrix.
- `[E-018]` Color-coded matrix cell component (5 mastery levels).
- `[E-018]` Hover reveals last-3 mock scores.
- `[E-018]` 8-week trend chart with national-average dashed line.
- `[E-018]` Multi-tenant test: teacher cannot see other school's students.
- `[E-022]` Aggregator SDK wrapper (configurable: Mobicom / Unitel / G-Mobile).
- `[E-022]` SMS template loader (`mn-Cyrl/sms.json`).
- `[E-022]` UCS-2 segment counter; CI test ≤2 segments.
- `[E-022]` Outbound templates: registration-paid, registration-pending, mock-completion, olympiad-reminder-24h.
- `[E-022]` Delivery-status webhook handler.
- `[E-023]` Inbound webhook (`/webhooks/sms-inbound`) with IP allow-list + HMAC.
- `[E-023]` `СТАТУС` / `STATUS` query → child's most recent activity.
- `[E-023]` `ЗОГС` / `STOP` opt-out → audit log row.
- `[E-023]` Parent-link verification flow refresh (national-ID hash + school code).

## Sprint risks

- SMS aggregator volume agreement not yet signed. **Mitigation:** ops escalation; demo on sandbox.
- Feature-phone STATUS query needs to identify the user from phone number alone. **Mitigation:** phone number → encrypted lookup against verified parent-child links.

## Demo

- Teacher opens 11-A Physics matrix; identifies 2 students with "Танилцсан" mastery in "Эргэлт".
- Trigger payment confirmation → see SMS arrive on a feature phone (or sandbox UI).
- Reply `СТАТУС` from feature phone → see summary SMS back.
- Reply `ЗОГС` → audit log entry + no further SMS.

## Exit criteria

- ◯ Mastery matrix matches prototype layout.
- ◯ Multi-tenant isolation E2E on analytics.
- ◯ All outbound templates ≤2 UCS-2 segments.
- ◯ STATUS inbound returns valid summary.
- ◯ STOP inbound stops all future sends and is audited.

---

## Detailed execution plan

Owns the **Teacher Dashboard (#3)** missing-screen mockup from
[`missing-screens-plan.md`](./missing-screens-plan.md) plus the SMS gateway
backbone that every notification path will hang off in P1+.

### Wave shape (≈ 20–24 commits)

| Wave                    | E-018 Analytics                                                                                                                                                                                                                                                                                                                                                                                                            | E-022 SMS outbound                                                                                                                                                                                                                                                                                                                | E-023 SMS inbound                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **A · Foundation**      | No new tables — reads from existing `concept_mastery` + `mock_test_results` + `students` + `schools`. Contracts (`AnalyticsMatrixCell`, `AnalyticsRow`, `TrendPoint`, `AnalyticsQuery`).                                                                                                                                                                                                                                   | Migration 0011: `sms_messages` (id, recipient_phone, template_key, body_rendered, sent_at, status, aggregator_id UNIQUE, segments_used INT). Contracts (`OutboundSmsRequest`, `DeliveryStatus`).                                                                                                                                  | Migration 0011 extends `sms_messages` with `is_inbound BOOLEAN` + `inbound_intent ENUM('STATUS','STOP','UNKNOWN')`. Contracts (`InboundSmsPayload`). |
| **B · Ingest**          | Test fixtures: synthetic cohort of 30 students with varied mastery + mock-test trajectories                                                                                                                                                                                                                                                                                                                                | `apps/api/messages/sms/mn-Cyrl.json` (registration-paid, registration-pending, mock-completion, olympiad-reminder-24h templates) with `{name}`/`{score}` placeholders                                                                                                                                                             | IP allow-list for the aggregator inbound webhook (`SMS_INBOUND_ALLOW`)                                                                               |
| **C · Lifecycle (API)** | `GET /teacher/analytics?class_id=…&subject=…` returns `{ matrix: AnalyticsRow[], trend: TrendPoint[] }`. Per-student row scoped by teacher's `organization_code`; per-strand cell coloured by mastery_level_enum bucket. Cohort floor of **5 students** before rendering (smaller groups identify individuals). Hover surface returns last 3 mock scores via separate `/teacher/analytics/:student/recent` for lazy fetch. | `SmsService.send(template_key, recipient, params)` renders + counts segments + posts to aggregator wrapper; on aggregator delivery webhook → updates `sms_messages.status`. Triggered hooks: payment confirmed (S05 E-019) → registration-paid; mock submitted → mock-completion; olympiad T-24h → cron-driven olympiad-reminder. | `POST /webhooks/sms-inbound` (IP allow-list + HMAC). Routes by case-insensitive keyword match: `СТАТУС                                               | STATUS`→ look up phone in verified parent-child links, return summary SMS via outbound path;`ЗОГС | STOP` → write opt-out row + audit_log entry + suppress all future sends to that phone. Unrecognized → reply with help template. |
| **D · UI**              | `apps/web/app/teacher/page.tsx` — replaces stub. Three cards: cohort metrics (Metric component from `studyTeach (2)/teacher.jsx:317`), mastery matrix (`MatrixCell` from `teacher.jsx:336` — student × strand grid coloured by level, hover reveals last-3 scores), 8-week trend chart with national-average dashed line. Filter row: by class / by olympiad. Empty state when cohort <5.                                  | No new UI in S06 — payment-confirmation SMS triggered automatically from S05 payment flow. Aggregator sandbox console used for demo.                                                                                                                                                                                              | No new UI — inbound is a programmatic backend.                                                                                                       |

### Open questions (R-1 … R-10) with recommended defaults

| #        | Decision                      | Default recommendation                                                                                                            | Why                                                                      |
| -------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| **R-1**  | SMS aggregator pick           | Configurable via `SMS_AGGREGATOR=mobicom                                                                                          | unitel                                                                   | gmobile`; wrapper interface so any of the three can plug in. Default in dev = mock vendor (drains messages to `apps/api/test/fixtures/sms-outbox/`). | Operations partner choice still in flight; engineering ships the seam   |
| **R-2**  | SMS encoding                  | UCS-2 (Cyrillic = ≥2 bytes per char); enforce ≤2 segments (140 bytes) per template at compile time via vitest assertion           | PRD §10 SMS delivery cost rule                                           |
| **R-3**  | Inbound shortcode source      | Aggregator provides shared short code (4 digits); platform identifies user by sender phone                                        | Mongolia carriers' default model                                         |
| **R-4**  | STATUS query identity binding | Sender phone → JOIN against verified parent-child link OR registered student — whichever matches; if both, prefer student         | Most students give their own phone; parents give theirs separately       |
| **R-5**  | STOP scope                    | Per-phone, full opt-out of _all_ templates including payment confirmations; opt-back-in only via web UI re-consent                | PDP Law §11 + practical: STOP is intentional, recovery is intentional    |
| **R-6**  | Analytics cohort floor        | 5 students per (class × strand) cell; below → cell shows "—" with tooltip "цөөн оролцоо"                                          | Per missing-screens-plan acceptance; smaller groups identify individuals |
| **R-7**  | Matrix cell hover behaviour   | Server-side lazy fetch (`/teacher/analytics/:student/recent`) on hover with 150ms debounce; cached client-side per session        | Avoids fetching N×M rows up front; matrix can be 30×8 = 240 cells        |
| **R-8**  | Trend dashed line             | National average computed live from `mock_test_results` aggregated across all schools for the same subject + grade + week         | Read-only; refreshed every cron run; cached 1h in Redis                  |
| **R-9**  | SMS retry                     | Status `pending                                                                                                                   | sent                                                                     | delivered                                                                                                                                            | failed`; on `failed`, single retry after 5m; further failures alert ops | Aggregator-reported failures are usually permanent |
| **R-10** | Audit-log granularity         | Every outbound send AND every inbound receive writes one `audit_log` row with `metadata: {template_key, segments_used}` (no body) | Body could contain student score; treat as PII                           |

### Sprint risks

- **SMS aggregator volume agreement** not yet signed — already flagged. Mitigation: ops escalation; demo on aggregator sandbox; engineering ships the wrapper so all three vendors are drop-in.
- **Feature-phone STATUS query** needs identity from phone alone. Mitigation: phone → encrypted lookup against verified parent-child links (R-4).
- **Multi-tenant leak in analytics** — teacher could craft a `class_id` they don't own. Mitigation: middleware enforces — any `class_id` not under `req.context.organization_code` returns 404; cross-tenant test required.
- **Matrix render perf at 30×8 cells** on 3G phones. Mitigation: server returns only the colour bucket per cell; client renders solid colors (no gradients); hover-fetched detail loads progressively.

### What does NOT ship in S06

- **Real SMS billing dashboards** — ops-side, out of S06.
- **Parent-side analytics view** — P1 (E-030 — Parent Portal expansion).
- **CSV/PDF export of analytics matrix** — P1.
- **8-week trend cohort comparison filtering by aimag** — uses national average only; aimag-level rollup is P1.

### Demoability

- Teacher opens `/teacher` → 11-A Physics matrix renders with 30 students × 6 strands; identifies the 2 students at "Танилцсан" level on "Цахилгаан соронзон".
- Trigger a paid registration via S05 path → payment confirmation SMS appears in the aggregator-sandbox UI.
- From feature phone (or sandbox), send `СТАТУС` → receive summary SMS back with the focal child's last mock score + nearest olympiad.
- Send `ЗОГС` → `audit_log` row visible in admin tool; subsequent triggered SMS skipped.

### Verification checklist

- `pnpm -r test` ≥ 130 (current after S05 ≈ 110, + ~20 new tests)
- Integration tests covering: matrix multi-tenant isolation, cohort floor empty cells, STATUS roundtrip via sandbox, STOP opt-out write
- UCS-2 segment counter unit test asserts every template ≤ 2 segments
- Live curl: 30-row synthetic cohort renders matrix; STATUS inbound returns valid summary; STOP inbound + verify no further outbound sends
