# Sprints

Each file is a 2-week sprint plan for P0 (Q3 2026). The master plan that orders them is [`../../FEATURE_DEVELOPMENT_PLAN.md`](../../FEATURE_DEVELOPMENT_PLAN.md).

## Sprint convention

- 2 weeks, Monday start.
- Mid-sprint check on Tuesday of week 2.
- Demo + retro on the final Friday.
- Sprint is *not* a deadline — it's a planning rhythm. An epic that bleeds 2 days is fine; one that bleeds 2 sprints is a re-plan.

## P0 sprints

| Sprint | Dates | Headline |
|---|---|---|
| [S00](./s00-scaffolding.md) | 2026-05-26 → 06-08 | Monorepo, Postgres, design system + i18n bootstrap |
| [S01](./s01-auth-design.md) | 2026-06-09 → 06-22 | Auth + RBAC + audit + design system continued |
| [S02](./s02-pwa-shell.md) | 2026-06-23 → 07-06 | PWA shell + sync queue + persona chrome |
| [S03](./s03-ai-tutor-mvp.md) | 2026-07-07 → 07-20 | AI Tutor RAG + refusals + BKT |
| [S04](./s04-egsh-olympiad.md) | 2026-07-21 → 08-03 | EGSh + Olympiad directory + practice |
| [S05](./s05-payments-ticket.md) | 2026-08-04 → 08-17 | QPay + E-Barimt + signed ticket + bulk roster |
| [S06](./s06-analytics-sms.md) | 2026-08-18 → 08-31 | Teacher analytics + SMS gateway |
| [S07](./s07-surge-hardening.md) | 2026-09-01 → 09-14 | Surge mode + a11y + perf + load test + RC |

## Per-sprint structure

Each sprint file has:

1. **Goal** — one sentence.
2. **Active epics** with owner and exit criteria.
3. **Ticket seed list** — concrete items to file in the tracker on day 1.
4. **Sprint risks** — known unknowns.
5. **Demo checklist** — what gets demoed on Friday of week 2.
6. **Exit criteria** — what must be ● before the next sprint starts.
