# ADR-0002: NestJS for the API

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** backend-architect
- **Affects:** `apps/api/`

## Context

The platform has ~10 PRD modules at P0+P1 with strong inter-module isolation requirements. We need:

- Clear module boundaries (one per PRD §4.x).
- Strong DI for testability.
- TypeScript-native.
- Mature ecosystem for guards, interceptors, pipes, queues.
- Easy alignment with controller/service/repository discipline.
- Stack continuity with v1.2.0 (PRD Appendix B).

## Decision

Use NestJS with TypeScript strict. One module per PRD feature; shared utilities in `apps/api/src/lib/`.

## Consequences

### Positive

- DI + Modules map cleanly to the PRD's modular structure.
- Guards/Interceptors/Middleware enforce cross-cutting concerns (tenant scope, audit, rate limit) in idiomatic ways.
- BullMQ integration is well-supported for the surge queue.
- Same language across frontend and backend reduces context switching.
- Decorators provide good documentation-by-code for controllers.

### Negative

- Heavier abstraction than Express/Fastify alone.
- Decorator-heavy style can hide control flow from newcomers.
- TypeORM/Prisma decisions need their own ADR.

### Neutral

- Migrating off NestJS later is a large project; we're committing to its module pattern.

## Alternatives considered

### Fastify-only

- Pros: lighter, faster.
- Cons: we'd rebuild module boundaries, DI, guards.
- Why rejected: a team of this size benefits from NestJS's structure.

### Hono

- Pros: edge-friendly, lightweight.
- Cons: not designed for the kind of long-lived stateful workloads we need (BullMQ, Postgres pools).
- Why rejected: poor fit for our hosting model.

### Express + custom

- Pros: maximum control.
- Cons: zero structure; every team member would invent their own pattern.
- Why rejected: structure is a feature for a long-lived national platform.

## References

- PRD §7.1, Appendix B.
- `docs/ARCHITECTURE.md`.
- `.claude/agents/backend-architect.md`.
