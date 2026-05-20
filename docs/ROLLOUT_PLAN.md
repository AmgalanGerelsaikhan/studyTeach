# Rollout Plan

> Operationalizes PRD §9. Use this as the working backlog framing — every PR maps to a phase.

## Phasing summary

| Phase | Window | Theme |
|---|---|---|
| P0 — Foundation | Q3 2026 | Adaptive learning + Olympiads + Teacher workspace + offline + SMS + payments |
| P1 — Expansion | Q1 2027 | Teacher Academy + Focus Mode + Parent Portal + PSR + Study Abroad |
| P2 — Depth | Q3 2027 | Wellbeing + Boys-at-Risk + App Coach + Alumni + Capacitor |
| P3 — Optional | when partner unlocks | Bus Tracker + 3rd-party publishers + SIS API |

## P0 — Q3 2026 (single launch, modules depend on each other)

| Module | PRD § | Status |
|---|---|---|
| AI Tutor (Mongolian) | 4.1 | — |
| EGSh Prep Engine | 4.2 | — |
| Olympiad Directory + Digital Ticket | 4.3 | — |
| Teacher Workspace + Bulk Roster | 4.4 | — |
| Offline PWA + SMS fallback infrastructure | 5.1, 5.2, 5.3, 5.4, 4.8 (SMS portion) | — |
| Auth, RBAC, audit logging | 8.1 | — |
| QPay + E-Barimt | 7.1, 5.3 | — |
| Mongolian + English UI | 6.3 | — |

**P0 is monolithic.** No partial launch — these modules depend on each other (Tutor remediates from EGSh failures; Teacher writes to Olympiad registrations; Olympiad payments via QPay; QPay confirmation issues tickets; tickets cached offline).

### P0 critical-path dependencies (external)

| Item | Owner | Required by |
|---|---|---|
| SMS aggregator volume agreement (Mobicom/Unitel/G-Mobile) | AIAA Ops | P0 launch |
| UNICEF / World Bank co-funding for free tier | AIAA Leadership | P0 launch |
| LLM vendor selection locked | AIAA + this team | P0 build-start |

## P1 — Q1 2027

| Module | PRD § | Depends on |
|---|---|---|
| Teacher Academy (first 20 courses) | 4.5 | P0 auth, teacher workspace |
| Focus Mode | 4.6 | P0 teacher workspace |
| Parent Portal (full incl. USSD) | 4.8 | P0 SMS infra |
| Portable Student Record | 4.9 | P0 schema; MoE agreement |
| Study Abroad Hub v2 (8 destinations) | 4.10 | P0 auth |
| Scholarship Aggregator | 4.10b | Aggregator data feed |

### P1 critical-path dependencies (external)

| Item | Owner | Required by |
|---|---|---|
| MoE Teacher Academy CPD endorsement | AIAA Leadership | P1 launch |
| MoE PSR data-sharing agreement | AIAA Leadership | P1 launch |
| Embassy / scholarship-administrator content review | AIAA Ops | P1 Study Abroad |

## P2 — Q3 2027

| Module | PRD § | Notes |
|---|---|---|
| Wellbeing Pulse (boarding) | 4.7a | Requires clinical consent + counselor training |
| Boys-at-Risk Early Warning | 4.7b | Requires baseline-model from P0 data |
| AI Application Coach | 4.10c | Requires P1 Study Abroad scaffolding |
| Mongolian Alumni Network | 4.10d | Verification flow + anti-harassment design |
| Native mobile wrapper (Capacitor) | 7.1 | Wraps existing PWA |

## P3 — Optional

| Module | PRD § | Unlock |
|---|---|---|
| Boarding Bus Tracker | 4.7c | Hardware partner secured |
| Third-party Olympiad publishers | — | After 6 months of in-house catalog maturity |
| API for school SIS integrations | — | Demand-driven |

## Success gating

Each phase ships only when its **equity metrics** (PRD §10.2) and **non-functional targets** (PRD §8.4) are green on staging for 14 consecutive days.

### P0 gates

- p95 page load on 3G <3s (PRD §8.4).
- p95 form submit on 3G <2s.
- Surge-window simulation: 50K concurrent users for 60 min with zero data loss.
- Offline E2E: 7-day disconnect simulation across all P0 flows.
- E-Barimt sync success rate ≥99.5% on staging.
- Audit log integrity test: 100% of sensitive actions logged.

### P1 gates

- Teacher Academy completion rate ≥40% from rural aimags in beta cohort.
- Parent Portal SMS delivery rate ≥98%.
- PSR read-audit coverage = 100%.

### P2 gates

- Wellbeing crisis-classifier precision ≥0.85, recall ≥0.90 on held-out corpus.
- Boys-at-Risk false-positive rate <15% on 3-month historical backtest.
- AI Application Coach refusal scenarios pass 100% in test.

## Rollback policy

- **Database migrations:** every migration paired with a "down" migration unless it's an additive operation. Destructive migrations (DROP COLUMN, DROP TABLE) are split into deprecation + drop, released one phase apart.
- **Features behind flags:** every P1 / P2 module ships with a feature flag in the user's role profile; toggle off in <5 minutes.
- **Content packs:** rolling pack versions; a broken pack can be revoked by signing a new "kill" manifest.

## Phase-cut checklist (run before each phase ships)

- [ ] All gates from "Success gating" green for 14 days.
- [ ] Localization complete for all new strings.
- [ ] Accessibility audit passes for new screens.
- [ ] Security review of new endpoints completed (`security-compliance`).
- [ ] Load test passed at target concurrency.
- [ ] Runbooks updated.
- [ ] Pricing / billing reconciled (if applicable).
- [ ] User documentation translated.

## Phase ownership

- P0: full team.
- P1: full team; Teacher Academy track has a separate content-ops lead.
- P2: full team; wellbeing track has a clinical-review lead from AIAA pedagogy.
- P3: opportunistic; spun up only when an unlock arrives.
