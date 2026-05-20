# studyTeach

**Unified Educational Portal — Mongolia.** A national-scale platform for K-12 students, teachers, parents, and school admins, framed as a four-asymmetry equity engine: closing the access, quality, information, and tooling gaps between Ulaanbaatar and the rest of the country.

> Status: pre-development. P0 build kicks off **2026-06-01**, target P0 launch **Q3 2026**.

## What's here

| File | What it is |
|---|---|
| [`PRD.md`](./PRD.md) | Product Requirements Document v2.0.0. Read this first. |
| [`CLAUDE.md`](./CLAUDE.md) | Project context for the Claude Code session — hard constraints, stack, conventions. |
| [`AGENTS.md`](./AGENTS.md) | Sub-agent roster and dispatch rules. |
| [`FEATURE_DEVELOPMENT_PLAN.md`](./FEATURE_DEVELOPMENT_PLAN.md) | Epic-by-epic build plan with dependencies and sprint mapping. |
| [`CHANGELOG.md`](./CHANGELOG.md) | Release notes. |
| [`docs/`](./docs/) | Architecture, design system, schema, security, localization, offline strategy, modules, sprints, ADRs. |
| [`.claude/agents/`](./.claude/agents/) | One Markdown file per sub-agent. |
| [`studyTeach (2)/`](./studyTeach%20%282%29/) | Design prototype (HTML/JSX/CSS) — read-only reference. |

## Getting started

```bash
git clone <repo>
cd teachstudy
pnpm install
docker compose up -d postgres redis
cp .env.example .env.local   # fill in sandbox keys
pnpm --filter @studyteach/api migrate
pnpm dev
```

Full guide: [`docs/SETUP.md`](./docs/SETUP.md). New-engineer guide: [`docs/ONBOARDING.md`](./docs/ONBOARDING.md).

## What this is (and isn't)

This platform delivers **Learning** (AI Tutor + EGSh prep) + **Competition** (Olympiad directory + signed digital tickets) + **Profession** (Teacher Academy) + **Pathway** (Study Abroad Hub + AI Application Coach + Alumni Network) + **Visibility** (Parent Portal with SMS fallback + Portable Student Record + Wellbeing Pulse).

It is **not** a school information system, not an LMS, not a social network, not a content marketplace. (PRD §2.2.)

## Operating principles

1. **Mongolian Cyrillic first** — Latin and English exist as toggles, never as defaults.
2. **Offline-first PWA** — must work ≥7 days disconnected.
3. **3G is the baseline** — p95 page load <3s, p95 form submit <2s.
4. **Multi-tenant isolation at middleware** — cross-tenant reads forbidden except for PLATFORM_ADMIN (audited).
5. **Idempotent payments** — QPay invoice signature deduplicates duplicate submissions.
6. **Wellbeing data is sacrosanct** — crisis-flag de-anonymization is the only path, disclosed at consent.

Full list in [`CLAUDE.md`](./CLAUDE.md).

## Tech stack

Next.js 14 (App Router) · NestJS · TypeScript strict · PostgreSQL 16 + pgvector · Redis 7 · Tailwind · PWA · QPay · ebarimt.mn · SMS aggregator (Mobicom/Unitel/G-Mobile) · Railway (Singapore).

Reasoning: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) and [`docs/adr/`](./docs/adr/).

## License & access

Internal — Moza. Code is closed-source for v2.0.0; content (curriculum chunks, refusal templates) under separate license arrangements with the Moza pedagogy team.

## Contact

- Product: Moza.
- Engineering: see [`AGENTS.md`](./AGENTS.md) for routing.
- Security disclosure: see [`docs/SECURITY_PRIVACY.md`](./docs/SECURITY_PRIVACY.md).
