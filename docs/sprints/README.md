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
| [S00](./s00-scaffolding.md) | 2026-06-01 → 06-14 | Monorepo, Postgres, design system + i18n bootstrap |
| [S01](./s01-auth-design.md) | 2026-06-15 → 06-28 | Auth + RBAC + audit + design system continued |
| [S02](./s02-pwa-shell.md) | 2026-06-29 → 07-12 | PWA shell + sync queue + persona chrome |
| [S03](./s03-ai-tutor-mvp.md) | 2026-07-13 → 07-26 | AI Tutor RAG + refusals + BKT |
| [S04](./s04-egsh-olympiad.md) | 2026-07-27 → 08-09 | EGSh + Olympiad directory + practice |
| [S05](./s05-payments-ticket.md) | 2026-08-10 → 08-23 | QPay + E-Barimt + signed ticket + bulk roster |
| [S06](./s06-analytics-sms.md) | 2026-08-24 → 09-06 | Teacher analytics + SMS gateway |
| [S07](./s07-surge-hardening.md) | 2026-09-07 → 09-20 | Surge mode + a11y + perf + load test + RC |

## Per-sprint structure

Each sprint file has:

1. **Goal** — one sentence.
2. **Active epics** with owner and exit criteria.
3. **Ticket seed list** — concrete items to file in the tracker on day 1.
4. **Sprint risks** — known unknowns.
5. **Demo checklist** — what gets demoed on Friday of week 2.
6. **Exit criteria** — what must be ● before the next sprint starts.
