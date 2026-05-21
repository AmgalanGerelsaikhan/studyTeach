# ADR-0012: Migration tool — node-pg-migrate (custom SQL)

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** database-schema, backend-architect, user (D-2 resolved)
- **Affects:** `apps/api/migrations/`, deployment pipeline
- **Supersedes:** open decision D-2 in `FEATURE_DEVELOPMENT_PLAN.md`

## Context

PostgreSQL 16 is the primary database (ADR-0003). We need migrations that:

- Are reversible by default (paired with `down` when reasonable).
- Are reviewable as plain SQL (security-compliance and database-schema both review).
- Don't lock 10M-row tables for more than 30 seconds.
- Support `pgvector`, `pgcrypto`, triggers (`audit_log` append-only), monthly partitions.
- Are independent of ORM choice — we may swap ORMs but the schema is the schema.

Two reasonable shapes:

1. **Custom SQL via `node-pg-migrate`** — write migrations as plain SQL (or as JS using its SQL DSL); the tool tracks order and applied state in a `pgmigrations` table. ORM-agnostic.
2. **Tool tied to an ORM** (Prisma migrate, TypeORM migrations) — couples migration history to the ORM's understanding of the schema.

## Decision

Use **`node-pg-migrate`** with plain SQL migration files. ORM choice for application-level data access is a separate, downstream decision and can be made independently.

## Consequences

### Positive

- Plain SQL is reviewable by anyone who reads SQL — `database-schema` and `security-compliance` review every migration as plain DDL/DML, not as JS abstraction.
- `pgvector`, `pgcrypto`, triggers, partitions, and `pg_repack`-style online-DDL patterns are all first-class SQL — no ORM abstraction in the way.
- Decouples migrations from ORM choice. We can swap from (e.g.) TypeORM to Prisma without rewriting migration history.
- `node-pg-migrate` is mature, lightweight, and well-supported.
- Migration files are timestamped (`YYYYMMDDHHMMSS__<verb>_<noun>.sql`) — clear order, no merge-conflict surprises.

### Negative

- No automatic generation from model diffs. Every migration is hand-written. (We consider this a feature, not a bug — generated migrations often miss invariants like triggers and partitions.)
- Application-level code (TypeScript types) must stay in sync with the schema manually. Mitigated by `zod` contracts in `apps/api/src/contracts/` derived from migrations.
- Slightly more verbose than `prisma migrate dev` for trivial changes.

### Neutral

- Future migrations can include JS sections when needed (e.g., a complex backfill with batching) — `node-pg-migrate` supports both pure SQL files and JS-based migrations.

## Implementation notes

- Migration files in `apps/api/migrations/`.
- Naming: `YYYYMMDDHHMMSS__<verb>_<noun>.sql` (e.g., `20260601120000__add_users_table.sql`).
- Every migration is reversible where reasonable. Destructive migrations (DROP COLUMN, DROP TABLE) split into deprecation + drop, released one phase apart.
- Lock-time on 10M+ row tables <30s; backfill plan attached otherwise.
- `database-schema` reviews every migration before merge.
- `pnpm db:migrate` runs forward; `pnpm db:migrate:revert` reverts the most recent in dev only.
- CI runs every migration forward and then back on a fresh Postgres container as part of the integration test step.

## Required follow-ups

| Item                                                              | Owner             | Due        |
| ----------------------------------------------------------------- | ----------------- | ---------- |
| Wire `node-pg-migrate` in `apps/api/`                             | backend-architect | Sprint S00 |
| Migration 0001: enums + `users` + `schools` per PRD §7.3          | database-schema   | Sprint S00 |
| CI step: apply all migrations + revert all migrations on every PR | qa-test-engineer  | Sprint S00 |

## Alternatives considered

### Prisma migrate

- Pros: type-safe client; great DX for simple schema; auto-generates migrations from model diffs.
- Cons: couples migration history to Prisma's introspection (which has historically struggled with triggers, partitions, and `pgvector`).
- Why rejected: we want plain SQL we can read and security-review, and we want migration history independent of ORM choice.

### TypeORM migrations

- Pros: integrated with NestJS (which we use); decorator-based entities.
- Cons: same coupling concern as Prisma; less mature migration story; weaker support for non-trivial DDL.
- Why rejected: same as Prisma.

### Sqitch

- Pros: tag-based, very flexible.
- Cons: separate runtime (Perl); operational burden; smaller community.
- Why rejected: `node-pg-migrate` is good enough and aligns with the rest of the stack (Node).

### Hand-rolled custom tool

- Pros: maximum control.
- Cons: re-invents what `node-pg-migrate` already does well.
- Why rejected: yak-shaving.

## References

- PRD §7.3.
- ADR-0003 (PostgreSQL + pgvector).
- `docs/DATABASE_SCHEMA.md`.
- `.claude/agents/database-schema.md`.
- `FEATURE_DEVELOPMENT_PLAN.md` — D-2 now closed.
