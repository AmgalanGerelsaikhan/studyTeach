# Cross-phase Gates Status

> Derived snapshot across P0/P1/P2/P3. Regenerable from the per-phase reports. Last refreshed: **2026-05-21 (post-S05)**.

## Summary

| Phase     | Gates                                     | ◯ Not started | ◐ In progress | ● Shipped | ◇ Blocked |
| --------- | ----------------------------------------- | ------------- | ------------- | --------- | --------- |
| P0        | 42 (24 epics + 10 launch + 8 sprint exit) | 18            | 1             | 23        | 0         |
| P1        | 17 (14 epics + 3 acceptance)              | 17            | 0             | 0         | 0         |
| P2        | 13 (10 epics + 3 acceptance)              | 13            | 0             | 0         | 0         |
| P3        | 3 (epics)                                 | 0             | 0             | 0         | 3         |
| **Total** | **75**                                    | **48**        | **1**         | **23**    | **3**     |

## P0 — 42 gates

### Epics (24)

| ID    | Title                                       | Owner                  | Status |
| ----- | ------------------------------------------- | ---------------------- | ------ |
| E-001 | Monorepo + tooling                          | frontend-architect     | ●      |
| E-002 | Postgres + migrations harness               | database-schema        | ●      |
| E-003 | Auth + sessions + 2FA                       | security-compliance    | ●      |
| E-004 | Multi-tenant scope middleware               | security-compliance    | ●      |
| E-005 | Audit log infra                             | security-compliance    | ●      |
| E-006 | Design system port (`st/*`)                 | ger-design-system      | ●      |
| E-007 | i18n catalog scaffold + mn-Cyrl baseline    | mongolian-localization | ●      |
| E-008 | PWA shell + service worker                  | offline-pwa-engineer   | ●      |
| E-009 | IndexedDB stores + sync queue               | offline-pwa-engineer   | ◐      |
| E-010 | RBAC role guards                            | security-compliance    | ●      |
| E-011 | Student persona chrome                      | frontend-architect     | ●      |
| E-012 | Teacher persona chrome (dual mode)          | frontend-architect     | ●      |
| E-013 | Parent persona chrome (mobile-first)        | frontend-architect     | ●      |
| E-014 | AI Tutor — RAG + refusals + BKT (mvp)       | ai-tutor-engineer      | ●      |
| E-015 | EGSh Prep — papers + timed mock + predictor | backend-architect      | ●      |
| E-016 | Olympiad Directory + filters + practice     | backend-architect      | ●      |
| E-017 | Teacher Bulk Roster                         | backend-architect      | ●      |
| E-018 | Teacher Analytics Matrix                    | backend-architect      | ◯      |
| E-019 | Payments — QPay + idempotent invoices       | payments-integration   | ●      |
| E-020 | E-Barimt receipt sync                       | payments-integration   | ●      |
| E-021 | Signed Digital Ticket + offline render      | payments-integration   | ●      |
| E-022 | SMS gateway + outbound templates            | backend-architect      | ◯      |
| E-023 | SMS inbound (STATUS / STOP)                 | backend-architect      | ◯      |
| E-024 | Surge mode (Redis Streams + queue UI)       | payments-integration   | ◯      |

### Launch gates (10)

| #    | Gate                                                                   | Status |
| ---- | ---------------------------------------------------------------------- | ------ |
| L-1  | p95 page load <3s on 3G CI                                             | ◯      |
| L-2  | p95 form submit <2s on 3G CI                                           | ◯      |
| L-3  | 50K-user surge simulation passes with zero data loss                   | ◯      |
| L-4  | 7-day offline E2E across all P0 flows                                  | ◯      |
| L-5  | E-Barimt sync ≥99.5% on staging for 14 consecutive days                | ◯      |
| L-6  | Audit-log integrity: 100% of sensitive actions logged                  | ◯      |
| L-7  | WCAG 2.1 AA across all P0 screens                                      | ◯      |
| L-8  | Mongolian Cyrillic catalog 100% complete; no `i18n.todo`               | ◯      |
| L-9  | DPIA filed for QPay, ebarimt, SMS aggregator, LLM vendor               | ◯      |
| L-10 | External: SMS aggregator agreement signed; UNICEF/WB funding confirmed | ◯      |

### Sprint exit criteria (8)

| Sprint | Headline                        | Status |
| ------ | ------------------------------- | ------ |
| S00    | Scaffolding                     | ●      |
| S01    | Auth + design system            | ●      |
| S02    | PWA shell + persona chrome      | ●      |
| S03    | AI Tutor MVP                    | ●      |
| S04    | EGSh + Olympiad directory       | ●      |
| S05    | Payments + ticket + bulk roster | ●      |
| S06    | Analytics + SMS                 | ◯      |
| S07    | Surge + hardening + RC          | ◯      |

## P1 — 17 gates

### Epics (14)

| ID    | Title                                       | Owner                               | Status                        |
| ----- | ------------------------------------------- | ----------------------------------- | ----------------------------- |
| E-025 | Teacher Academy — content pipeline + player | backend + frontend                  | ◯                             |
| E-026 | Teacher Academy — assessments + badges      | backend-architect                   | ◯                             |
| E-027 | Teacher Academy — cohort scheduling         | backend-architect                   | ◯                             |
| E-028 | English-for-Teachers track A1               | content-ops                         | ◯                             |
| E-029 | Focus Mode (teacher + student)              | frontend-architect                  | ◯                             |
| E-030 | Parent Portal — full view set               | frontend-architect                  | ◯                             |
| E-031 | Parent Portal — USSD menu (Mobicom)         | backend-architect                   | ◇ (aggregator USSD agreement) |
| E-032 | Parent Portal — multi-child + revocation    | backend-architect                   | ◯                             |
| E-033 | PSR — materialized view + access grants     | database-schema + backend-architect | ◇ (MoE agreement)             |
| E-034 | PSR — owner audit timeline UI               | frontend-architect                  | ◯                             |
| E-035 | Study Abroad — 8 destination blueprints     | content-ops + frontend-architect    | ◯                             |
| E-036 | Scholarship Aggregator — registry + filters | backend-architect                   | ◯                             |
| E-037 | Scholarship deadline notifications          | backend-architect                   | ◯                             |
| E-038 | Content packs — generator + signing         | offline-pwa-engineer                | ◯                             |

### Acceptance criteria (3)

| #    | Gate                                                                  | Status |
| ---- | --------------------------------------------------------------------- | ------ |
| A1-1 | Teacher Academy completion rate ≥40% from rural aimags in beta cohort | ◯      |
| A1-2 | Parent Portal SMS delivery rate ≥98%                                  | ◯      |
| A1-3 | PSR read-audit coverage = 100%                                        | ◯      |

## P2 — 13 gates

### Epics (10)

| ID    | Title                                               | Owner                                 | Status |
| ----- | --------------------------------------------------- | ------------------------------------- | ------ |
| E-039 | Wellbeing Pulse — student check-in + dorm aggregate | backend-architect                     | ◯      |
| E-040 | Wellbeing — crisis classifier (Mongolian corpus)    | ai-tutor-engineer                     | ◯      |
| E-041 | Wellbeing — counselor de-anonymization path + audit | security-compliance                   | ◯      |
| E-042 | Boys-at-Risk — model + dashboard                    | ai-tutor-engineer + backend-architect | ◯      |
| E-043 | AI Application Coach — critique + paragraph rewrite | ai-tutor-engineer                     | ◯      |
| E-044 | App Coach — mock interview generator                | ai-tutor-engineer                     | ◯      |
| E-045 | Alumni Network — verification + intro form          | backend-architect                     | ◯      |
| E-046 | Capacitor wrapper (iOS + Android)                   | frontend-architect                    | ◯      |
| E-047 | Performance pass — content pack v2 + delta sync     | offline-pwa-engineer                  | ◯      |
| E-048 | Equity dashboards refresh + quarterly report        | backend-architect                     | ◯      |

### Acceptance criteria (3)

| #    | Gate                                                                 | Status |
| ---- | -------------------------------------------------------------------- | ------ |
| A2-1 | Wellbeing crisis-classifier precision ≥0.85, recall ≥0.90            | ◯      |
| A2-2 | Boys-at-Risk false-positive rate <15% on 3-month historical backtest | ◯      |
| A2-3 | AI Application Coach refusal scenarios 100%                          | ◯      |

## P3 — 3 gates (all ◇ blocked)

| ID    | Title                                   | Trigger                            | Status |
| ----- | --------------------------------------- | ---------------------------------- | ------ |
| E-049 | Boarding Bus Tracker                    | Hardware partner signed            | ◇      |
| E-050 | 3rd-party Olympiad publisher onboarding | 6 months in-house catalog maturity | ◇      |
| E-051 | School SIS API                          | Demand from ≥3 large SISs          | ◇      |

## Critical path (P0 only)

```
S00 scaffolding ──► S01 auth + design ──► S02 PWA shell + persona chrome
                                              │
                                              ├──► S03 AI Tutor MVP
                                              ├──► S04 EGSh + Olympiad
                                              ├──► S05 Payments + ticket + roster
                                              ├──► S06 Analytics + SMS
                                              └──► S07 Surge + hardening + RC
```

External blockers (must close before P0 ship):

- SMS aggregator volume agreement (ops, not engineering)
- LLM vendor selection locked (engineering + leadership decision)
- UNICEF / World Bank co-funding confirmation (leadership)
- HSM provisioning for ticket signing key (ops)
- DPIA filed for each third-party (security-compliance)
