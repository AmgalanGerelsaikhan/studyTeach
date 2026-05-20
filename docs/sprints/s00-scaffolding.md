# Sprint S00 — Scaffolding

**2026-06-01 → 06-14**

## Goal

Repo runs end-to-end on every engineer's laptop and on CI, with a Postgres migration applied, a design-system token in a real component, and an `mn-Cyrl` string round-tripping through the i18n loader.

## Active epics

| Epic | Owner | Exit |
|---|---|---|
| E-001 · Monorepo + tooling | frontend-architect | `pnpm dev` launches both apps; `pnpm test` runs (even if empty); lint + typecheck green |
| E-002 · Postgres + migrations harness | database-schema | `pnpm db:migrate` applies a no-op + the `users` table from PRD §7.3 |
| E-006 · Design system port (start) | ger-design-system | `StButton`, `StCard`, `StIcon`, `StSoyomboFlame` render in Storybook |
| E-007 · i18n catalog scaffold (start) | mongolian-localization | `mn-Cyrl/common.json` loads; one string rendered in a route |

## Ticket seed list

- `[E-001]` Initialize pnpm workspace with `apps/web` + `apps/api` + `packages/contracts`.
- `[E-001]` Configure TS strict, eslint, prettier, lefthook pre-commit.
- `[E-001]` Configure CI (lint + typecheck + test:unit on every push).
- `[E-001]` Add `docker-compose.yml` for Postgres 16 + Redis 7 + pgvector.
- `[E-002]` Wire migration runner (custom or via Prisma/TypeORM — decide and ADR).
- `[E-002]` Migration 0001: enums + `users` + `schools` tables.
- `[E-002]` Seed script with 5 Mongolian fixture users.
- `[E-006]` Port `tokens.css` from prototype to `apps/web/styles/tokens.css`.
- `[E-006]` Build `St` namespace components: `StButton`, `StCard`, `StIcon`, `StSoyomboFlame`, `StMeander`.
- `[E-006]` Set up Storybook with the Ger Interior theme.
- `[E-007]` Set up `next-intl` (or chosen library); add `mn-Cyrl`, `mn-Latn`, `en` locales.
- `[E-007]` Seed `mn-Cyrl/common.json` with 10 baseline strings.
- `[E-007]` Render one localized string in the root page.

## Sprint risks

- Library choice (Prisma vs. TypeORM, next-intl vs. lingui) takes longer than planned. **Mitigation:** time-box decisions to day 2; record in ADR.
- Mongolian font rendering on macOS dev machines. **Mitigation:** include `Noto Serif Mongolian` install in `SETUP.md`.

## Demo (Friday 2026-06-12)

- Live demo: `pnpm dev` cold start to login page rendering in Mongolian, with a `StButton`.
- Show migration applied to local Postgres.
- Show CI green on a sample PR.

## Exit criteria

- ◯ `pnpm dev` works for any new clone.
- ◯ CI runs in <10 minutes on the empty repo.
- ◯ At least one route renders with design-system component and Mongolian text.
- ◯ ADRs filed for migration tool, i18n library, monorepo manager.
