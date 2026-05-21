# Sprint S07 — Surge Mode + Hardening + RC

**2026-09-01 → 09-14**

## Goal

Deadline-night surge proven at 50K concurrent users with zero data loss. All P0 gates from `FEATURE_DEVELOPMENT_PLAN.md` are green. Release candidate cut.

## Active epics

| Epic | Owner | Exit |
|---|---|---|
| E-024 · Surge mode (Redis Streams + queue UI) | payments-integration | 50K-user simulation passes; queue position UI works |
| **Hardening track** | qa-test-engineer + frontend-architect | a11y AA, perf budgets, i18n freeze, prod cutover prep |

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
- HSM provisioning delayed by hosting region. **Mitigation:** software key acceptable for P0 launch *only* if external auditor agrees; otherwise delay launch.

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
