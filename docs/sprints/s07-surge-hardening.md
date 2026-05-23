# Sprint S07 — Surge Mode + Hardening + RC

**2026-09-01 → 09-14**

## Goal

Deadline-night surge proven at 50K concurrent users with zero data loss. All P0 gates from `FEATURE_DEVELOPMENT_PLAN.md` are green. Release candidate cut.

## Active epics

| Epic                                          | Owner                                 | Exit                                                  |
| --------------------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| E-024 · Surge mode (Redis Streams + queue UI) | payments-integration                  | 50K-user simulation passes; queue position UI works   |
| **Hardening track**                           | qa-test-engineer + frontend-architect | a11y AA, perf budgets, i18n freeze, prod cutover prep |

## Ticket seed list

- `[E-024]` Redis Streams consumer for `registrations.surge`.
- `[E-024]` Single-writer-per-shard guarantee.
- `[E-024]` `/queue-position/:token` endpoint returns ETA.
- `[E-024]` Frontend queue UI (position + ETA + reassurance copy in Mongolian).
- `[E-024]` Surge mode activation criteria (cron + RPS threshold).
- `[E-024]` k6 load test in `load/surge.js`; 50K concurrent / 60 min / `/payments/invoices`.
- `[E-024]` Zero-data-loss assertion (every queued write must end as a real row).
- `[Hardening]` Axe-core CI across all P0 routes.
- `[Hardening]` Manual screen-reader sweep (NVDA + JAWS Mongolian).
- `[Hardening]` Performance: bundle size budget < 200KB initial JS per route.
- `[Hardening]` Performance: 3G profile CI assertion (p95 page load <3s, form submit <2s).
- `[Hardening]` i18n catalog: 100% coverage, no `i18n.todo`, no orphan keys.
- `[Hardening]` Visual regression snapshot per persona-screen.
- `[Hardening]` Offline E2E suite: 7-day disconnect simulation across all P0 flows.
- `[Hardening]` Provision HSM for production ticket signing key.
- `[Hardening]` Pen test booked with external firm.
- `[Hardening]` Runbook drills (incident response, on-call rotation set).
- `[Hardening]` Release notes draft + CHANGELOG entry.

## Sprint risks

- Surge simulation reveals DB lock contention. **Mitigation:** keep 3 days of S07 reserved for fixes; have read-replica config ready as fallback.
- HSM provisioning delayed by hosting region. **Mitigation:** software key acceptable for P0 launch _only_ if external auditor agrees; otherwise delay launch.

## Demo

- Run 50K-user surge simulation live in front of stakeholders.
- Show queue position UI from a user's perspective.
- Walk through P0 launch-gate checklist with status of each.

## Exit criteria

All P0 launch gates from `FEATURE_DEVELOPMENT_PLAN.md` green:

- ◯ p95 page load <3s on 3G CI.
- ◯ p95 form submit <2s on 3G CI.
- ◯ 50K-user surge simulation passes with zero data loss.
- ◯ 7-day offline E2E across all P0 flows.
- ◯ E-Barimt sync ≥99.5% on staging for 14 days.
- ◯ Audit-log integrity: 100% of sensitive actions logged.
- ◯ WCAG 2.1 AA across all P0 screens.
- ◯ Mongolian Cyrillic catalog 100% complete.
- ◯ DPIA filed for QPay, ebarimt, SMS aggregator, LLM vendor.
- ◯ External: SMS aggregator agreement signed; UNICEF/WB funding confirmed.

Once all green: cut **v1.0.0-rc1** tag, schedule prod cutover.

---

## Detailed execution plan

S07 is unique — it ships **one new epic** (E-024 surge mode) plus the
hardening track that flips every remaining ◯ launch gate to ●. The
hardening track is mostly already-existing-code-improvements + adding CI
assertions, not greenfield work.

### Wave shape (≈ 22–28 commits)

| Wave                   | E-024 Surge                                                                                                                                                                                                                                                                                         | Hardening (L-1 … L-10)                                                                                                                                                                                                                                                                                                                    | RC cut                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **A · Foundation**     | Migration 0012: `surge_queue_tokens` (token UUID PK, position INT, signature_hash FK to `invoices`, enqueued_at, fulfilled_at NULL). Contracts (`SurgeToken`, `QueuePositionResponse`). Confirm `redis stream egsh:registrations:surge` config.                                                     | k6 load-test scripts in `load/` directory; Playwright suite in `apps/web/e2e/`; axe-core wired into CI; lighthouse-ci config for perf budgets                                                                                                                                                                                             | —                                                             |
| **B · Implementation** | `SurgeService.enqueue(signature_hash)` writes to Redis stream + returns token + position; `SurgeService.consume()` single-writer worker reads from stream, calls `InvoiceService.create`, marks token fulfilled; `/queue-position/:token` returns ETA based on rolling-mean per-second consume rate | Bundle analyzer + budget enforcement (200KB initial JS per route); 3G throttling in CI (`network: 'Slow 3G'`); WCAG 2.1 AA scan per persona-screen; visual regression snapshots per persona × screen; i18n parity gate hardened to fail on any orphan in any of mn-Cyrl/mn-Latn/en/sms.json; HSM provisioning runbook (links to ADR-0014) | —                                                             |
| **C · UI**             | Frontend queue UI — `apps/web/components/payments/QueueWaitCard.tsx`; renders position + ETA in mn-Cyrl + reassurance copy + polling at 5s interval. Shown by S05's PaymentFlow when API returns 202 + Location header pointing at `/queue-position/:token`                                         | a11y fixes from axe-core reports per route; bundle splits per route; service worker tightening (cache invalidation on new SW build)                                                                                                                                                                                                       | —                                                             |
| **D · Load + soak**    | k6 50K concurrent against `/payments/invoices` for 60 minutes; assertion: every queued write ends as a real `invoices` row; pg_stat_statements review + index plan tweaks if needed                                                                                                                 | 7-day offline E2E across all P0 flows via Playwright with `--offline=true`; E-Barimt sync rate measured on staging over 14 days                                                                                                                                                                                                           | —                                                             |
| **E · Cutover**        | Surge mode "armed" toggle via env var + redis flag (`SURGE_ENABLED=true` activates the 202 path; otherwise straight-through)                                                                                                                                                                        | DPIA filings finalized (QPay, ebarimt, SMS aggregator, LLM vendor); pen test booked + run; CHANGELOG + RELEASE NOTES drafted                                                                                                                                                                                                              | Tag `v1.0.0-rc1`; runbook drills logged; on-call rotation set |

### Open questions (R-1 … R-12) with recommended defaults

| #        | Decision                    | Default recommendation                                                                                                                                                             | Why                                                                                             |
| -------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **R-1**  | Surge activation criteria   | Auto-enable when 5xx rate >2% OR RPS >`SURGE_THRESHOLD_RPS` (env, default 500) sustained 30s; auto-disable when both drop below for 5m. Manual override via `SURGE_ENABLED=force`. | Hands-off in the common case; ops can force-on for known-deadline windows                       |
| **R-2**  | Queue token TTL             | 30 min from enqueue; expired tokens require client to retry the original POST; expired-token UI shows a friendly "Try again" CTA                                                   | Prevents indefinite queue tails on abandoned sessions                                           |
| **R-3**  | Token in URL vs header      | URL (`/queue-position/:token`) — shareable + cacheable per browser tab, no cookie complication                                                                                     | Polling works through ad-blockers + WAFs that strip custom headers                              |
| **R-4**  | k6 target RPS               | 50K concurrent simulated users with 1 RPS each = 50K RPS sustained for 60 min                                                                                                      | Per PRD §10 surge target                                                                        |
| **R-5**  | Zero-data-loss assertion    | k6 issues N=50000 requests with unique `signature_hash`es; at end, COUNT(\*) FROM invoices WHERE signature_hash IN (k6 hashes) MUST equal N                                        | The contract — no exceptions                                                                    |
| **R-6**  | 3G CI profile               | k6 `network.throttle` to 400 Kbps down / 200 Kbps up / 400ms RTT (Slow 3G per Chrome devtools defaults); axe-core runs at this profile too                                         | Mongolia carrier baseline                                                                       |
| **R-7**  | Bundle budget enforcement   | webpack-bundle-analyzer + a CI step that diffs initial-JS size vs `budgets.json`; fail if any route >200KB initial JS gzip                                                         | Catches accidental imports of moment.js etc                                                     |
| **R-8**  | Axe-core failure threshold  | `level=AA`, fail CI on any `serious` or `critical`; `moderate` warns only                                                                                                          | WCAG 2.1 AA per gate L-7                                                                        |
| **R-9**  | Visual regression tolerance | Playwright `expect(page).toHaveScreenshot({maxDiffPixelRatio: 0.01})` — 1% pixel diff tolerance for anti-aliasing                                                                  | Catches deterministic regressions without flaking on subpixel renders                           |
| **R-10** | HSM seam testing            | CI mode runs with `TICKET_SIGNING_MODE=dev`; nightly job tests `gcp-kms` mode against a staging KMS keyring                                                                        | Catches KMS misconfig before launch                                                             |
| **R-11** | i18n freeze gate            | CI step: walk `apps/web/messages/*.json` + every `apps/api/messages/*.json` + `apps/api/test/fixtures/mn/`; assert no `i18n.todo` key; assert mn-Cyrl ⊆ mn-Latn = en               | L-8 acceptance                                                                                  |
| **R-12** | Production cutover plan     | Cutover window: Friday 23:00 ULAT, off-hours; rollback to S06-tag if any of: error rate >1%, p95 latency >5s, E-Barimt sync drops below 99%                                        | Conservative — Mongolia school holiday week chosen so an ugly rollback doesn't disrupt students |

### Sprint risks

- **Surge simulation reveals DB lock contention** — already flagged. Mitigation: 3 days of S07 reserved for fixes; read-replica config ready as fallback.
- **HSM provisioning delayed** by hosting region. Software key acceptable for P0 launch _only_ if external auditor agrees; otherwise delay launch.
- **Axe-core sweep surfaces large a11y debt** in earlier sprints. Mitigation: triage to `serious` only for RC; `moderate` fixes can land in v1.0.1.
- **External dependencies stall** — SMS aggregator agreement, UNICEF/WB funding. Engineering can ship RC without; launch decision is leadership.

### What does NOT ship in S07 (boundary)

- **All P1 epics** — E-025+ start 2026-11-01.
- **Production HSM** if not provisioned in time — fall back to software key with auditor sign-off.
- **Real LLM vendor** — still on mock until ADR-0011 + DPIA close. RC may go live with mock vendor IF leadership accepts the diminished tutor UX.

### Demoability

- Open a Grafana dashboard showing live k6 surge run at 50K RPS.
- Show one user's queue position UI updating in real time.
- Walk through the P0 launch-gate checklist with every line ●.
- Show the `v1.0.0-rc1` tag and the release-notes draft.

### Verification checklist before tagging RC

- All 10 launch gates ● in `docs/phase-reports/GATES_STATUS.md`
- Test count ≥ 160 across 3 workspaces
- All four DPIAs filed and approved
- 7-day offline E2E green
- HSM seam verified in nightly job
- Pen test report received + critical/high findings fixed
