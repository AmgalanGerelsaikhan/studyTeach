# Feature Development Plan

> The actionable build plan for MozaTeach. Operationalizes [`docs/ROLLOUT_PLAN.md`](./docs/ROLLOUT_PLAN.md) into epics, sprints, and concrete tickets. PRs reference epic IDs (e.g. `Refs: EPIC-007`).

## How to read this

- **Phases** (P0 / P1 / P2 / P3) come from PRD §9 and `docs/ROLLOUT_PLAN.md`.
- **Epics** are 1–4 weeks of work owned by one agent (with reviewers).
- **Sprints** are 2-week containers that bundle epics. Detail in [`docs/sprints/`](./docs/sprints/).
- **Tickets** live inside epics in the issue tracker; sprint docs include the seed list.
- **Status legend:** ◯ not started · ◐ in progress · ● shipped · ◇ blocked

Today's date: **2026-05-20** · P0 target: **Q3 2026** (~16 weeks of build time from kickoff).

## Phase summary

| Phase  | Window                  | Epics         | Headline outcome                                                                       |
| ------ | ----------------------- | ------------- | -------------------------------------------------------------------------------------- |
| **P0** | 2026-05-26 → 2026-09-24 | E-001 → E-024 | National launch of AI Tutor + EGSh + Olympiad + Teacher Workspace + offline + payments |
| **P1** | 2026-11-01 → 2027-03-31 | E-025 → E-038 | Teacher Academy + Focus Mode + full Parent Portal + PSR + Study Abroad                 |
| **P2** | 2027-05-01 → 2027-09-30 | E-039 → E-048 | Wellbeing Pulse + Boys-at-Risk + AI App Coach + Alumni + Capacitor                     |
| **P3** | opportunistic           | E-049+        | Bus Tracker + 3rd-party publishers + SIS API                                           |

---

## P0 — Foundation (Q3 2026)

P0 is monolithic: modules depend on each other (Tutor remediates EGSh failures; Teacher writes Olympiad registrations; QPay confirmation issues tickets; tickets cached offline). Ship together or ship none.

### Epic map

| Epic                                                    | Owner agent            | Weeks | Status | Blocks                        |
| ------------------------------------------------------- | ---------------------- | ----- | ------ | ----------------------------- |
| **E-001 · Monorepo + tooling**                          | frontend-architect     | 1     | ◯      | everything                    |
| **E-002 · Postgres + migrations harness**               | database-schema        | 1     | ◯      | every persistent feature      |
| **E-003 · Auth + sessions + 2FA**                       | security-compliance    | 2     | ◯      | every authenticated route     |
| **E-004 · Multi-tenant scope middleware**               | security-compliance    | 1     | ◯      | every authenticated route     |
| **E-005 · Audit log infra**                             | security-compliance    | 1     | ◯      | PSR, wellbeing, payments      |
| **E-006 · Design system port (`st/*`)**                 | ger-design-system      | 3     | ◯      | every screen                  |
| **E-007 · i18n catalog scaffold + mn-Cyrl baseline**    | mongolian-localization | 2     | ◯      | every screen                  |
| **E-008 · PWA shell + service worker**                  | offline-pwa-engineer   | 2     | ◯      | every offline-capable feature |
| **E-009 · IndexedDB stores + sync queue**               | offline-pwa-engineer   | 2     | ◯      | E-014, E-016, E-019           |
| **E-010 · RBAC role guards**                            | security-compliance    | 1     | ◯      | persona routes                |
| **E-011 · Student persona chrome**                      | frontend-architect     | 1     | ◯      | E-014..E-016                  |
| **E-012 · Teacher persona chrome (dual mode)**          | frontend-architect     | 1     | ◯      | E-017..E-019                  |
| **E-013 · Parent persona chrome (mobile-first)**        | frontend-architect     | 1     | ◯      | E-020                         |
| **E-014 · AI Tutor — RAG + refusals + BKT (mvp)**       | ai-tutor-engineer      | 4     | ◯      | E-015 remediation hook        |
| **E-015 · EGSh Prep — papers + timed mock + predictor** | backend-architect      | 3     | ◯      | E-014 hook                    |
| **E-016 · Olympiad Directory + filters + practice**     | backend-architect      | 2     | ◯      | E-019 ticket                  |
| **E-017 · Teacher Bulk Roster**                         | backend-architect      | 2     | ◯      | E-018                         |
| **E-018 · Teacher Analytics Matrix**                    | backend-architect      | 1     | ◯      | —                             |
| **E-019 · Payments — QPay + idempotent invoices**       | payments-integration   | 3     | ◯      | E-020, E-016 ticket issue     |
| **E-020 · E-Barimt receipt sync**                       | payments-integration   | 1     | ◯      | —                             |
| **E-021 · Signed Digital Ticket + offline render**      | payments-integration   | 1     | ◯      | E-009                         |
| **E-022 · SMS gateway + outbound templates**            | backend-architect      | 2     | ◯      | parent notifications          |
| **E-023 · SMS inbound (STATUS / STOP)**                 | backend-architect      | 1     | ◯      | —                             |
| **E-024 · Surge mode (Redis Streams + queue UI)**       | payments-integration   | 2     | ◯      | deadline-night ops            |

### Dependency graph (P0)

```
E-001 ──┬─► E-002 ──► E-003 ──► E-004 ──► E-010 ──► (E-011 ∥ E-012 ∥ E-013)
        ├─► E-005
        ├─► E-006 ──► (E-011 ∥ E-012 ∥ E-013)
        ├─► E-007 ──► (E-011 ∥ E-012 ∥ E-013)
        └─► E-008 ──► E-009 ──► (E-021 ∥ writes from E-014..E-019)

(E-014 AI Tutor) ──── hooks into ──► (E-015 EGSh)
(E-015 EGSh) ──── enables ──► (E-016 Olympiad practice carry-over)
(E-016 Olympiad) ──── creates invoice via ──► (E-019 Payments)
(E-019 Payments) ──── on confirmation ──► (E-021 Ticket signing) ──► (E-009 offline cache)
(E-019 Payments) ──── on confirmation ──► (E-020 E-Barimt) ──► (E-022 SMS to parent)
(E-024 Surge mode) ──── wraps ──► (E-019)
```

### Sprint allocation (P0, 8 × 2-week sprints)

| Sprint  | Dates (planned)    | Headline                   | Epics in flight                                       |
| ------- | ------------------ | -------------------------- | ----------------------------------------------------- |
| **S00** | 2026-05-26 → 06-08 | Scaffolding                | E-001, E-002, E-006 (start), E-007 (start)            |
| **S01** | 2026-06-09 → 06-22 | Auth + design system       | E-003, E-004, E-005, E-006 (cont), E-010              |
| **S02** | 2026-06-23 → 07-06 | PWA shell + persona chrome | E-008, E-009 (start), E-011, E-012, E-013             |
| **S03** | 2026-07-07 → 07-20 | AI Tutor MVP               | E-014 (3 of 4 weeks), E-009 (cont)                    |
| **S04** | 2026-07-21 → 08-03 | EGSh + Olympiad directory  | E-014 (finish), E-015, E-016                          |
| **S05** | 2026-08-04 → 08-17 | Payments + ticket          | E-019, E-020, E-021, E-017                            |
| **S06** | 2026-08-18 → 08-31 | Teacher analytics + SMS    | E-018, E-022, E-023                                   |
| **S07** | 2026-09-01 → 09-14 | Surge + hardening          | E-024, perf + a11y + i18n freeze, load test, RC build |

Sprint detail: [`docs/sprints/`](./docs/sprints/).

### P0 launch gate (PRD §10 + ROLLOUT_PLAN gates)

Before going live, all must be ●:

- ◯ p95 page load <3s on 3G profile in CI for every route.
- ◯ p95 form submit <2s on 3G profile.
- ◯ 50K concurrent surge simulation against `/payments/invoices` with zero data loss.
- ◯ 7-day offline E2E across all P0 flows (tickets render, queued writes replay).
- ◯ E-Barimt sync success ≥99.5% on staging for 14 consecutive days.
- ◯ Audit log integrity: 100% of sensitive actions logged in audit test.
- ◯ A11y: WCAG 2.1 AA across all P0 screens.
- ◯ Mongolian Cyrillic catalog 100% complete; no `i18n.todo` keys.
- ◯ DPIA filed for every third-party integration (QPay, ebarimt, SMS aggregator, LLM vendor).
- ◯ External: SMS aggregator agreement signed; UNICEF/WB co-funding confirmed.

---

## P1 — Expansion (Q1 2027)

Builds on P0. Independent epics — sprint planning re-opens once P0 stabilizes.

| Epic                                                    | Owner agent                            | Weeks | Blocked by                |
| ------------------------------------------------------- | -------------------------------------- | ----- | ------------------------- |
| **E-025 · Teacher Academy — content pipeline + player** | backend-architect + frontend-architect | 4     | —                         |
| **E-026 · Teacher Academy — assessments + badges**      | backend-architect                      | 2     | E-025                     |
| **E-027 · Teacher Academy — cohort scheduling**         | backend-architect                      | 1     | E-025                     |
| **E-028 · English-for-Teachers track A1**               | content-ops                            | 4     | E-025                     |
| **E-029 · Focus Mode (teacher + student)**              | frontend-architect                     | 2     | —                         |
| **E-030 · Parent Portal — full view set**               | frontend-architect                     | 2     | P0 SMS                    |
| **E-031 · Parent Portal — USSD menu (Mobicom)**         | backend-architect                      | 2     | aggregator USSD agreement |
| **E-032 · Parent Portal — multi-child + revocation**    | backend-architect                      | 1     | E-030                     |
| **E-033 · PSR — materialized view + access grants**     | database-schema + backend-architect    | 3     | MoE agreement             |
| **E-034 · PSR — owner audit timeline UI**               | frontend-architect                     | 1     | E-033                     |
| **E-035 · Study Abroad — 8 destination blueprints**     | content-ops + frontend-architect       | 3     | —                         |
| **E-036 · Scholarship Aggregator — registry + filters** | backend-architect                      | 2     | —                         |
| **E-037 · Scholarship deadline notifications**          | backend-architect                      | 1     | E-036                     |
| **E-038 · Content packs — generator + signing**         | offline-pwa-engineer                   | 2     | content-feed maturity     |

---

## P2 — Depth (Q3 2027)

| Epic                                                            | Owner                                 | Weeks | Notes                      |
| --------------------------------------------------------------- | ------------------------------------- | ----- | -------------------------- |
| **E-039 · Wellbeing Pulse — student check-in + dorm aggregate** | backend-architect                     | 2     | clinical reviewer required |
| **E-040 · Wellbeing — crisis classifier (Mongolian corpus)**    | ai-tutor-engineer                     | 4     | external clinical reviewer |
| **E-041 · Wellbeing — counselor de-anonymization path + audit** | security-compliance                   | 2     | —                          |
| **E-042 · Boys-at-Risk — model + dashboard**                    | ai-tutor-engineer + backend-architect | 4     | 3 months P0 data           |
| **E-043 · AI Application Coach — critique + paragraph rewrite** | ai-tutor-engineer                     | 3     | E-035                      |
| **E-044 · App Coach — mock interview generator**                | ai-tutor-engineer                     | 2     | E-043                      |
| **E-045 · Alumni Network — verification + intro form**          | backend-architect                     | 2     | —                          |
| **E-046 · Capacitor wrapper (iOS + Android)**                   | frontend-architect                    | 3     | P0 PWA stable              |
| **E-047 · Performance pass — content pack v2 + delta sync**     | offline-pwa-engineer                  | 2     | P0 telemetry baseline      |
| **E-048 · Equity dashboards refresh + quarterly report**        | backend-architect                     | 1     | —                          |

---

## P3 — Optional

Spun up only when an external unlock arrives.

| Epic                                                | Owner                                | Trigger                            |
| --------------------------------------------------- | ------------------------------------ | ---------------------------------- |
| **E-049 · Boarding Bus Tracker**                    | backend-architect + hardware partner | hardware partner signed            |
| **E-050 · 3rd-party Olympiad publisher onboarding** | backend-architect                    | 6 months in-house catalog maturity |
| **E-051 · School SIS API**                          | backend-architect                    | demand from ≥3 large SISs          |

---

## Cross-cutting workstreams (parallel to phases)

These run continuously and don't fit a single sprint:

- **W-A · Curriculum content ingestion** — Moza pedagogy team feeds curriculum chunks for RAG; weekly cadence.
- **W-B · Mongolian translation review** — `mongolian-localization` on every PR; ongoing.
- **W-C · Accessibility audits** — quarterly external audit; per-PR axe-core.
- **W-D · Security pen-test** — semi-annual external pen-test; per-PR `security-compliance` review.
- **W-E · Load test** — nightly surge sim on staging; per-PR k6 against changed routes.
- **W-F · Clinical review (wellbeing)** — external clinical advisors; required for any wellbeing change in P2+.

---

## Estimation rules

- Weeks are _effort weeks_ (one engineer working full-time). Multiply by 1.5 for calendar weeks to absorb review, blockers, integration.
- Epics with explicit external dependencies (MoE, SMS aggregator) cite the dependency; the team does not estimate those — operations does.
- Re-estimation happens at sprint planning; this plan is the master and is rebased at the end of each sprint.

## How a new feature enters this plan

1. Author proposes the feature with PRD section reference.
2. `frontend-architect` or `backend-architect` drafts the epic (owner, weeks, blockers).
3. `security-compliance` reviews for new trust-boundary work.
4. `qa-test-engineer` confirms testability.
5. Epic added to next sprint's planning meeting agenda.
6. This file updated with epic row and dependency arrow.

## How a feature exits this plan

When status becomes ●, the epic moves to the `CHANGELOG.md` release notes for the version that ships it and is struck through here (kept for history).

---

**This plan is the source of truth for build order.** If a PR conflicts with it, fix the plan first (in the same PR) or escalate.
