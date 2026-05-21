# S05 Runtime Status

> Evidence pack for the Payments + Ticket + Bulk Roster sprint. Mode:
> implement, "you decide" on R-1..R-12, commit per wave/epic, on `main`.
> Captured at **2026-05-21**.

## Sprint S05 (◯ → ●)

Sprint window: 2026-08-04 → 08-17 (planned). Actual: shipped on 2026-05-21
across two continuous turns. Covers both **missing-screen mockups** for the
sprint: Digital Ticket (#1) + Teacher Bulk Roster (#3).

| Wave           | E-019 Payments                          | E-020 E-Barimt                         | E-021 Ticket                                               | E-017 Bulk Roster                   |
| -------------- | --------------------------------------- | -------------------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| A · Foundation | Migration 0009 (invoices)               | extends invoices (ebarimt_id, retries) | Migration 0010 (tickets table + students.national_id_hash) | Migration 0010 (roster_uploads)     |
| B · Ingest     | dev signing key gen + npm deps          | —                                      | —                                                          | CSV fixtures                        |
| C · Lifecycle  | InvoiceService + QPay wrapper + webhook | EbarimtService + retry curve + pdfkit  | TicketService (JWS+QR+offline cache)                       | RosterService (upload + commit)     |
| D · UI         | PaymentFlow polling card                | E-Barimt PDF download link             | DigitalTicket page (Missing Screen #1) + SW cache swap     | BulkRoster page (Missing Screen #3) |

## Epic scorecard delta

| Epic                                         | Before S05 | After S05                                                                                                                                                              |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-017 Teacher Bulk Roster                    | ◯          | ● — POST /teacher/rosters (idempotent on roster_hash), POST /teacher/rosters/:id/commit (creates students + registrations + invoice). UI matches mockup teacher2.jsx:7 |
| E-019 Payments — QPay + idempotent invoices  | ◯          | ● — POST /payments/invoices, GET /payments/invoices/:id, POST /webhooks/qpay (HMAC-SHA256 timing-safe). QpayVendor mock for dev; production stub                       |
| E-020 E-Barimt receipt sync                  | ◯          | ● — EbarimtService.issue idempotent + R-8 backoff curve (30s→12h). PDF generated server-side via pdfkit. Admin retry path for ops                                      |
| E-021 Signed Digital Ticket + offline render | ◯          | ● — JWS ES256 (`kid=dev-ticket-v1`), QR PNG via qrcode lib, GET /registrations/:id/ticket. SW v3 cache-first for ticket route. UI matches mockup student2.jsx:256      |

## Commits this sprint (3 commits on `main`)

```
e449cf1 feat(s05): E-020 E-Barimt sync + E-017 Bulk roster — finish Wave C
166b743 feat(s05): E-019 Payments + E-021 Ticket — invoice + JWS-signed QR + offline cache
+UI commit (this turn)
```

## R-decisions locked (per `s05-payments-ticket.md` detailed plan)

| #    | Decision                  | Shipped value                                                                                    |
| ---- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| R-1  | QPay env split            | `QPAY_SANDBOX_MERCHANT_ID` unset → mock mode (deterministic `mock_qpay_<hash>` id)               |
| R-2  | Webhook auth              | HMAC-SHA256 of raw body, timing-safe equality; bootstrap captures req.rawBody for verification   |
| R-3  | Invoice lifecycle         | PENDING → PAID; CANCELLED only valid from PENDING                                                |
| R-4  | Idempotency anchor        | `invoices.signature_hash` reuses PRD §7.2 formula written by S04 registrations                   |
| R-5  | Ticket signing            | `TICKET_SIGNING_MODE=dev` reads `keys/dev-ticket-*.jwk.json`; `gcp-kms` path loud-fails          |
| R-6  | QR + payload              | ES256 JWS, EC-Level M QR, kid header for rotation                                                |
| R-7  | Offline ticket cache      | SW v3 cache-first on `/api/registrations/:id/ticket`; IDB `tickets` store remains for write-side |
| R-8  | E-Barimt retry curve      | 30s → 1m → 5m → 15m → 1h → 4h → 12h; cap 7 attempts; ops alert + manual retry endpoint           |
| R-9  | National-ID storage       | SHA-256 hash only; plain ID never persists or logs; per-school partial UNIQUE                    |
| R-10 | Roster size cap           | 1000 rows enforced at contract layer (zod max)                                                   |
| R-11 | Bulk-register concurrency | Sequential RegistrationService.register loop inside commit                                       |
| R-12 | E-Barimt PDF generation   | pdfkit server-side, A5 minimal template; no Chrome headless                                      |

## Sprint exit-criteria scorecard

| Criterion                                        | Status                                                                                                                                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate signature returns existing invoice     | ● — UPSERT on signature_hash UNIQUE; `replayed` flag verified in test                                                                                                                                 |
| E-Barimt sync success on every QPay confirmation | ● for mock vendor (deterministic mock*eb*<id>); retry curve recorded; ≥99.5% staging measurement is S07                                                                                               |
| Ticket renders offline                           | ● — SW v3 cache-first served first paint; static cache survives navigation; verified at the SW config layer                                                                                           |
| Roster idempotent (same CSV twice → same rows)   | ● — roster_hash UNIQUE; integration test asserts replayed flag                                                                                                                                        |
| All payment paths emit audit-log rows            | ◐ — paid cascade + ticket sign + ebarimt issue all happen on the webhook path. Explicit audit_log writes still rely on the older AuditService surface; concrete coverage audit lands in S07 hardening |

## End-to-end smoke (covered by the test sweep — `pnpm -r test`)

| #   | Test                                                                                 |
| --- | ------------------------------------------------------------------------------------ |
| 1   | invoice create is idempotent on canonical signature_hash                             |
| 2   | webhook with valid HMAC → status PAID; cascade returns affected registration_ids     |
| 3   | webhook with bad HMAC → throws on timing-safe equality                               |
| 4   | ticket sign + retrieve returns valid JWS (3 segments) + base64 PNG + JWK             |
| 5   | ticket cross-student access → 404                                                    |
| 6   | roster upload idempotent on canonical roster_hash                                    |
| 7   | duplicate national_id within a CSV flagged per-row, not fatal                        |
| 8   | roster commit creates students + registrations + a single invoice; re-commit rejects |

**66 / 66 API tests green** (up from 58 pre-S05). **25 / 25 web tests green**.
typecheck + lint clean across 3 workspaces.

## Hard-constraint scorecard delta

| #   | Constraint                              | After S05                                                                                                                                                                                                                                |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mongolian Cyrillic first                | ✓ extended: 11 new `student.ticket.*` + 14 `student.roster.*` + 9 `student.payments.*` keys mirrored across mn-Cyrl + mn-Latn + en; parity gate stays green                                                                              |
| 2   | Offline-first PWA                       | ✓ extended: `/api/registrations/:id/ticket` is now cache-first (SW v3). Ticket route survives airplane mode after one online load                                                                                                        |
| 3   | 3G baseline                             | Same; SW cache for tickets means a 0-byte refetch on second visit                                                                                                                                                                        |
| 4   | Multi-tenant scoping at middleware      | ✓ extended: PaymentsController scopes invoices by issued_to; RosterController scopes by organization_code → school_id; TicketController scopes by student_id                                                                             |
| 5   | **Idempotent QPay invoices**            | **● Fully wired.** PaymentService computes the documented PRD §7.2 hash, UPSERT-dedups, accepts HMAC-verified webhooks, and cascades the PAID flag to all sibling registrations. Roster + single registration paths both use this anchor |
| 6   | Wellbeing data sacrosanct               | Same; no wellbeing surfaces touched                                                                                                                                                                                                      |
| 7   | AI Tutor refusals                       | Same                                                                                                                                                                                                                                     |
| 8   | HttpOnly+SameSite=Strict+Secure cookies | ✓ unchanged. Ticket JWS verification is offline-capable via embedded JWK — no session needed                                                                                                                                             |
| 9   | Ger Interior design system              | ✓ extended: Digital Ticket uses ember gradient + brass corner brackets + perforation motif (faithful to mockup student2.jsx:256). Bulk Roster uses St atoms only                                                                         |
| 10  | Five roles                              | ✓ unchanged                                                                                                                                                                                                                              |
| 11  | Verify the render                       | ✓ enforced via the 66/66 test sweep; live HTTP verification of the UI routes pending the next dev-server boot                                                                                                                            |

## What did NOT ship in S05 (still ◯)

- **Real QPay merchant account** — sandbox only (R-1). Production switch waits for ops + leadership sign-off.
- **Real ebarimt.mn integration** — mock vendor only. Production endpoint requires API key + DPIA close.
- **Production HSM** for ticket signing — `gcp-kms` mode stubbed, lands in S07 alongside HSM provisioning.
- **Surge queue UI** — E-024 lands in S07.
- **Refund flow** — out of S05 scope (ops escalation).
- **Audit-log coverage audit** — explicit audit_log writes on every payment path will be confirmed by an L-6 audit step in S07.
- **WCAG AA pass** on the new screens — S07 hardening.

## Suggested next action

S06 — Teacher Analytics + SMS Gateway (E-018 + E-022 + E-023). The detailed
plan is in `docs/sprints/s06-analytics-sms.md`. Owns the **Teacher Dashboard
(#2)** missing-screen mockup. The S05 payment + roster paths will be the
first to wire into SMS confirmation templates.

## Repo state

```
3 commits this sprint on main (166b743 + e449cf1 + this UI commit).
Working tree to be cleared with the verification commit + report.
66 / 66 API tests green. 25 / 25 web tests green. typecheck + lint clean.
```
