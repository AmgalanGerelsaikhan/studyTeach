# Architecture Decision Records (ADRs)

> Lightweight log of significant technical decisions. Format follows Michael Nygard's original ADR template.

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [0000](./0000-template.md) | Template | n/a | — |
| [0001](./0001-nextjs-app-router.md) | Next.js 14 with App Router for the web app | Accepted | 2026-05-20 |
| [0002](./0002-nestjs-backend.md) | NestJS for the API | Accepted | 2026-05-20 |
| [0003](./0003-postgres-pgvector.md) | PostgreSQL 16 with pgvector for primary DB and vector index | Accepted | 2026-05-20 |
| [0004](./0004-pwa-first.md) | PWA at launch; Capacitor wrapper in Phase 2 | Accepted | 2026-05-20 |
| [0005](./0005-mongolian-cyrillic-default.md) | Mongolian Cyrillic is the default locale | Accepted | 2026-05-20 |
| [0006](./0006-multi-tenant-middleware-scoping.md) | Multi-tenant scoping at middleware (not row-level security) | Accepted | 2026-05-20 |
| [0007](./0007-cookie-sessions.md) | HttpOnly + SameSite=Strict + Secure cookie sessions | Accepted | 2026-05-20 |
| [0008](./0008-idempotency-strategy.md) | Idempotency-Key header + domain signature for payments | Accepted | 2026-05-20 |
| [0009](./0009-ger-interior-design-system.md) | Ger Interior as the visual identity | Accepted | 2026-05-20 |
| [0010](./0010-railway-singapore-hosting.md) | Railway (Singapore region) for API hosting | Accepted | 2026-05-20 |

## When to write an ADR

A decision deserves an ADR if it:

- Constrains future code (e.g., "we always use cookies for sessions").
- Trades off two reasonable options (e.g., "Prisma vs. TypeORM").
- Is hard to reverse (e.g., "we ship PWA, not native").
- Will surprise a new engineer.

A decision does *not* need an ADR if it:

- Is small and reversible (a variable rename).
- Is fully covered by an existing ADR.
- Is a refinement that doesn't change the model.

## Writing an ADR

1. Copy [`0000-template.md`](./0000-template.md) to the next number.
2. Fill it in (5-10 minutes; ADRs are short).
3. Open a PR; tag the affected agent owner(s).
4. On merge, update this index.

## Superseding an ADR

Don't edit a superseded ADR's decision — write a new one referencing it. Update both: the new one says "Supersedes ADR-NNNN"; the old one says "Superseded by ADR-MMMM" and changes status to "Superseded".
