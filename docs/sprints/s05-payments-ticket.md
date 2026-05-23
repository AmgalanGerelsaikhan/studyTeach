# Sprint S05 — Payments + Ticket + Bulk Roster

**2026-08-04 → 08-17**

## Goal

A teacher uploads a roster, registers a delegation for an Olympiad, pays via QPay, receives an E-Barimt receipt, and each student's digital ticket is signed, cached offline, and renders without network. Idempotent end-to-end.

## Active epics

| Epic                                           | Owner                | Exit                                                         |
| ---------------------------------------------- | -------------------- | ------------------------------------------------------------ |
| E-017 · Teacher Bulk Roster                    | backend-architect    | 1000-row CSV parse + dedupe + checksum + delegation register |
| E-019 · Payments — QPay + idempotent invoices  | payments-integration | QPay sandbox happy path + idempotency under retry            |
| E-020 · E-Barimt receipt sync                  | payments-integration | webhook → receipt attached + downloadable PDF                |
| E-021 · Signed Digital Ticket + offline render | payments-integration | signed payload + offline render at "venue"                   |

## Ticket seed list

- `[E-017]` CSV / Excel parser (`papaparse` or similar).
- `[E-017]` National-ID checksum validator (MN format).
- `[E-017]` Dedup within school across uploads.
- `[E-017]` Row-level error chips in UI.
- `[E-017]` Bulk-register endpoint with idempotency key.
- `[E-019]` QPay sandbox SDK wrapper.
- `[E-019]` Migration: `invoices` with `signature_hash UNIQUE`.
- `[E-019]` Signature: `SHA256(school_id || students_sorted || olympiads_sorted || window_id)`.
- `[E-019]` Invoice creation endpoint; returns existing on duplicate signature.
- `[E-019]` QPay webhook handler (HMAC-verified, idempotent).
- `[E-019]` Frontend payment flow (redirect or in-app deep-link).
- `[E-020]` ebarimt.mn API wrapper.
- `[E-020]` On QPay confirmation → call E-Barimt → attach `ebarimt_id`.
- `[E-020]` Retry queue if E-Barimt 5xx.
- `[E-020]` PDF receipt generation.
- `[E-021]` HSM-backed signing key (use software key in dev; HSM in prod).
- `[E-021]` Sign QR payload on confirmation.
- `[E-021]` PWA caches signed payload + pre-rendered QR PNG in IndexedDB `tickets` store.
- `[E-021]` Ticket render offline E2E test.

## Sprint risks

- QPay sandbox uptime. **Mitigation:** ops escalation contact + recorded webhook payloads for offline test.
- HSM not provisioned for prod. **Mitigation:** software key in S05; provision HSM in S07.
- E-Barimt schema changes. **Mitigation:** lock to current sandbox; integration test pinned to a recorded response.

## Demo

- Teacher uploads 50-row roster (with 2 intentional errors).
- Fixes errors, registers 48 for an Olympiad.
- Pays via QPay sandbox.
- See E-Barimt receipt attach.
- Open one student's ticket on phone with airplane mode on — QR renders.

## Exit criteria

- ◯ Duplicate signature returns existing invoice.
- ◯ E-Barimt sync success on every QPay confirmation.
- ◯ Ticket renders offline.
- ◯ Roster idempotent (same CSV twice → same rows).
- ◯ All payment paths emit audit-log rows.

---

## Detailed execution plan

Mirrors the S04 plan format (waves → R-decisions → risks → boundary). Owns
the two highest-priority missing-screen mockups from
[`missing-screens-plan.md`](./missing-screens-plan.md): **Digital Ticket
(#1)** and **Teacher Bulk Roster (#3)**. Backend has 3 epics worth of
plumbing under those screens.

### Wave shape (≈ 28–32 commits)

| Wave                    | E-019 Payments                                                                                                                                                                                                                               | E-020 E-Barimt                                                                                                                                                                                                                           | E-021 Ticket                                                                                                                                                                                                                                                                                                                                                                                       | E-017 Bulk Roster                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A · Foundation**      | Migration 0009: `invoices` (`signature_hash UNIQUE`, `qpay_invoice_id UNIQUE`, FK `student_id`/`olympiad_id` via a join table); contracts (`InvoiceCreateRequest`, `InvoiceDescriptor`, `WebhookPayload`); QPay sandbox env vars locked      | Migration 0009 extends `invoices` with `ebarimt_id` + retry counters; contracts (`EbarimtReceiptPayload`)                                                                                                                                | Migration 0010: `tickets` table mirroring IndexedDB store (registration_id PK, signed `payload JSONB`, `qr_png BYTEA`, `signed_at`); contracts (`SignedTicketPayload`, `Citation` of issuer)                                                                                                                                                                                                       | Migration 0010 extends `students` with `national_id_hash` for dedup (no plain national ID stored); contracts (`RosterRow`, `RosterUpload`, `RosterValidationError`)                                                                                                                                                                                                                                                                |
| **B · Ingest**          | —                                                                                                                                                                                                                                            | —                                                                                                                                                                                                                                        | Dev signing key generated (`keys/dev-ticket.pem`, gitignored); HSM provisioning ticket opened (S07 follow-up); KMS env wiring                                                                                                                                                                                                                                                                      | CSV fixture for tests (50 rows, 2 intentional errors); national-ID-hash test vectors                                                                                                                                                                                                                                                                                                                                               |
| **C · Lifecycle (API)** | `POST /payments/invoices` (idempotent via signature_hash); `POST /webhooks/qpay` (HMAC verify against env shared secret + idempotency on QPay invoice ID); on success → updates `registrations.payment_status=PAID` + writes `audit_log` row | On QPay confirmation → `EbarimtService.issue(invoice_id)` calls ebarimt.mn sandbox; failure → push onto retry queue (`redis stream egsh:ebarimt:retry`) with backoff caps at 12h; manual `POST /admin/ebarimt/retry/:invoice_id` for ops | On QPay confirmation → `TicketService.sign(registration_id)` builds payload `{registration_id, student_name_hash, venue, seat, exam_time_iso, issued_at}`, signs with `TICKET_SIGNING_MODE` (dev key or gcp-kms), generates QR PNG via `qrcode` npm lib, stores in `tickets`. `GET /registrations/:id/ticket` returns `{payload, qr_png_b64}` with public-key in response headers for verification | `RosterParser` (server-side validation re-run on top of client parse), `RosterService.upload` idempotent on `roster_hash = SHA256(school_id ‖ sorted(national_id_hashes) ‖ window_id)`; per-row validation (phone E.164, grade 1–12, optional national ID format); `RosterService.commit(roster_id, olympiad_id)` calls existing `RegistrationService.register` in a loop; returns `{ rows: [{row_id, registration_id, error?}] }` |
| **D · UI**              | `apps/web/components/payments/PaymentFlow.tsx` — invoice card + "QPay-р төлөх" CTA → QPay sandbox deep link → polling for confirmation (until webhook lands)                                                                                 | E-Barimt PDF download link inside paid invoice card                                                                                                                                                                                      | `apps/web/app/(student)/ticket/[id]/page.tsx` — render mockup `studyTeach (2)/student2.jsx:256`. Hero card with brass corner brackets, QR centered, exam date + venue + seat. Caches into IDB `tickets` store on load (already-shipped E-009 schema). SW NEVER_CACHE swapped to CACHE for `/api/registrations/:id/ticket`                                                                          | `apps/web/app/teacher/roster/page.tsx` — render mockup `studyTeach (2)/teacher2.jsx:7`. Drop-zone for CSV → parse via PapaParse → preview grid with editable cells → per-cell validation badges → progress modal on commit                                                                                                                                                                                                         |
| **E · Cross-cutting**   | All payment endpoints emit audit_log; surge mode (S07) wraps the invoice create                                                                                                                                                              | Daily reconciliation report (out-of-scope for S05 — sketched in S07)                                                                                                                                                                     | TicketCard component reusable from parent portal for the "Show ticket" link                                                                                                                                                                                                                                                                                                                        | RosterUpload component reusable in future bulk flows (E-022 SMS roster import)                                                                                                                                                                                                                                                                                                                                                     |

### Open questions (R-1 … R-12) with recommended defaults

| #        | Decision                             | Default recommendation                                                                                                                                                                        | Why                                                                          |
| -------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **R-1**  | QPay sandbox vs production endpoints | Sandbox only through S05; production toggle behind `QPAY_ENV` env var                                                                                                                         | No real money on the prod QPay account before S07 launch readiness           |
| **R-2**  | QPay webhook auth                    | HMAC-SHA256 of body using `QPAY_WEBHOOK_SECRET`; reject on mismatch                                                                                                                           | QPay's documented webhook signing model                                      |
| **R-3**  | Invoice lifecycle states             | `PENDING → PAID → REFUNDED` (one-way except via support); `CANCELLED` only valid from `PENDING`                                                                                               | Simple state machine; refunds are out-of-band ops touch                      |
| **R-4**  | Idempotency anchor                   | Reuse `signature_hash` from `registrations` (S04) — `invoices.signature_hash UNIQUE`                                                                                                          | Already the documented PRD §7.2 model                                        |
| **R-5**  | Ticket signing — dev vs prod         | `TICKET_SIGNING_MODE=dev` uses a software keypair in `keys/`; `gcp-kms` calls `projects/${PROJECT}/locations/${REGION}/keyRings/${RING}/cryptoKeys/${KEY}/cryptoKeyVersions/1:asymmetricSign` | ADR-0014 already chose GCP Cloud KMS Singapore                               |
| **R-6**  | QR algorithm + payload size          | EC-Level M; payload ≤ 256 bytes (signed compact JWS, alg=ES256 in prod, alg=RS256 in dev)                                                                                                     | Mid recovery + safe scan margin on cheap Android cameras                     |
| **R-7**  | Offline ticket cache strategy        | Cache the full payload + base64 QR PNG in IndexedDB `tickets` store on first fetch; SW serves `/api/registrations/:id/ticket` cache-first after first hit                                     | Matches the offline-first policy documented in `docs/OFFLINE_STRATEGY.md`    |
| **R-8**  | E-Barimt retry policy                | Exponential backoff 30s → 1m → 5m → 15m → 1h → 4h → 12h; alert ops after 6 retries                                                                                                            | E-Barimt sandbox is known-flaky; the manual retry endpoint covers stuck rows |
| **R-9**  | National ID storage in roster        | Store **only the SHA-256 hash** (`national_id_hash`); plain ID never persists or logs                                                                                                         | PDP Law §4 — minors' data minimization                                       |
| **R-10** | Roster CSV size cap                  | 1000 rows per upload (mockup spec); reject above with `413`                                                                                                                                   | Larger rosters split client-side; surge protection                           |
| **R-11** | Bulk-register concurrency            | Sequential calls to `RegistrationService.register` inside a transaction; rollback if any row throws non-409                                                                                   | Atomic-or-fail; the typical 50-row roster commits in ~2s                     |
| **R-12** | E-Barimt PDF generation              | Server-side via `pdfkit` (no headless browser); render minimal compliance template; ebarimt.mn-supplied QR embedded as-is                                                                     | No Chrome dependency in API container                                        |

### Sprint risks (additions to the docs above)

- **QPay sandbox uptime** — already flagged. Mitigation: ops escalation + recorded webhook payloads in `test/fixtures/qpay/` for offline test.
- **HSM not provisioned for prod** — software key in S05; HSM in S07. Test that `gcp-kms` mode is a drop-in replacement (env switch only).
- **CSV parse perf on 1000-row uploads on 3G phones** — parsing client-side could lock the main thread. Mitigation: use Web Workers via PapaParse's worker mode (already supports).
- **E-Barimt schema drift** — pin integration tests to a recorded sandbox response in `test/fixtures/ebarimt/recv-2024-03.json`.
- **Ticket signing key rotation** — design `keys/dev-ticket.pem` to be rotatable in dev without invalidating older tickets (header carries `kid`); test the verification path against multiple `kid`s.

### What does NOT ship in S05 (boundary)

- **Real QPay merchant account** — sandbox only.
- **Refund flow** — out-of-band ops; UI shows the status but doesn't initiate.
- **PSR exposure of receipts** — P1 (E-033/34 — PSR module).
- **SMS notifications on payment** — S06 (E-022 outbound templates).
- **Surge queue UI** — S07 (E-024).
- **WCAG AA pass** on the new screens — S07 hardening.

### Demoability

- Teacher logs in, uploads `test/fixtures/roster-50.csv` (with 2 deliberate errors), fixes them inline, registers all 48 for "Үндэсний Математикийн Олимпиад".
- Returns to the registration detail page → "QPay-р төлөх" → sandbox approves → page polls → status flips to PAID; E-Barimt PDF link appears.
- Opens one student's `/ticket/:id` on a phone, toggles airplane mode, reloads the route — QR renders from IDB cache.

### Verification checklist before phase-report

- `pnpm -r test` ≥ 110 (current 88 + new payment/ticket/roster integration tests)
- `pnpm typecheck && pnpm lint` clean
- Live curl: login as teacher → upload roster → register → invoice POST → simulated QPay webhook → ticket GET returns signed payload; verify signature with public key offline
- Open `/ticket/:id`, kill API, reload route, confirm IDB-served render
