# CLAUDE.md — studyTeach / Unified Educational Portal (Mongolia)

This file is loaded automatically by Claude Code. It is the entry point for any agent or coding session that touches this repo.

## What this project is

**studyTeach** is the national-scale Unified Educational Portal for Mongolian K-12 students, teachers, parents, and school admins. It is framed as a **four-asymmetry equity engine**: closing the access, quality, information, and tooling gaps between Ulaanbaatar and the rest of the country.

Authoritative product spec: [`PRD.md`](./PRD.md) (v2.0.0). Read it before non-trivial work.
Design system reference: [`studyTeach (2)/`](./studyTeach%20%282%29/) — HTML/JSX/CSS prototype of all 13 screens across 4 personas (Student, Teacher, Family/Admin, Pathway).

## Hard constraints (do not violate)

These are load-bearing and surprise newcomers. Treat any change here as PRD-level.

1. **Mongolian Cyrillic is the primary UI language.** Latin transliteration and English exist as toggles, never as defaults. All copy, errors, validation, SMS templates must ship in Mongolian first.
2. **Offline-first PWA.** The app must work for ≥7 days with no connection. All writes are queued locally with idempotency keys and replay on reconnect. Never assume the network is available.
3. **3G is the baseline.** p95 page load <3s and p95 form submit <2s on 3G. Heavy assets, blocking JS, and uncached fonts are bugs, not optimizations.
4. **Multi-tenant row separation at middleware.** Every query is scoped by `organization_code`. Cross-tenant reads are forbidden except for `PLATFORM_ADMIN` and must write an `audit_log` entry.
5. **Idempotent QPay invoices.** Invoice creation is keyed by `SHA256(school_id || student_ids_sorted || olympiad_ids_sorted || registration_window_id)`. Repeated submissions return the existing invoice — never create duplicates.
6. **Wellbeing data is sacrosanct.** Crisis-phrase de-anonymization is the only de-anonymization path. It is disclosed at consent. Wellbeing data is never used to train AI models. Never log it outside the audit trail.
7. **AI Tutor refusals are non-negotiable.** It refuses to (a) answer questions during active mock tests, (b) write personal statements from scratch, (c) engage in non-academic chitchat at scale. Refusal text is part of the product, not a fallback.
8. **HttpOnly + SameSite=Strict + Secure cookies only.** No client-readable session tokens, ever. 2FA mandatory for Teacher / SchoolAdmin / PlatformAdmin.
9. **Ger Interior design system is the visual identity.** Felt cream surfaces, lacquered ember red, brass accents, warm shadows. Soyombo flame, Khamar khee meander, Ulzii eternal knot are the only sanctioned motifs. No emoji in product UI. See [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md).
10. **Five roles, not three.** STUDENT, TEACHER, PARENT, SCHOOL_ADMIN, PLATFORM_ADMIN. Teacher is dual-profile (institutional + personal competitor + CPD learner).
11. **Verify the render, not the diff.** After any code change, start the dev server, `curl` the affected route, and confirm the response is real rendered HTML — not a loading shell, not a 500, not a redirect that masks the actual page. If the feature requires env vars, confirm each one loads (`process.env.X !== undefined` inside the running process). A passing diff with a broken runtime is not done.

## Session conduct (Claude-specific)

These rules govern how a Claude Code session should engage with this project. They sit alongside the hard constraints above but are about *how to work*, not *what to build*.

1. **Clarify scope and mode before starting non-trivial work.** Ask the user two things first: (a) which file or scope this targets, (b) whether the turn is plan-only or implement. Don't enter plan mode and don't spawn sub-agents (Agent tool) until the user confirms. Trivial direct asks ("read this", "what does X mean") don't need clarification — answer them directly. Ambiguous asks always need it.
2. **Verify, then declare done.** See hard constraint #11.
3. **Reference, don't paraphrase.** When citing project rules in chat, link to the source doc (CLAUDE.md, PRD section, ADR number) rather than restating from memory.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind |
| Mobile | PWA at launch; Capacitor wrapper Phase 2 |
| Backend | NestJS + TypeScript |
| DB | PostgreSQL 16 + `pgvector` extension |
| Cache / Queue | Redis 7 (Streams for surge queue, standard cache) |
| Object store | S3-compatible (Cloudflare R2 or AWS S3) |
| SMS | Mobicom / Unitel / G-Mobile via aggregator |
| Payments | QPay |
| E-receipts | ebarimt.mn API |
| Hosting | Railway (Singapore region) — confirm UB latency before lock-in |

## Repository map

```
.
├── CLAUDE.md                # this file
├── AGENTS.md                # agent roster & how to dispatch
├── PRD.md                   # product requirements (v2.0.0)
├── .claude/
│   └── agents/              # individual agent specs
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DESIGN_SYSTEM.md     # Ger Interior tokens, motifs, components
│   ├── DATABASE_SCHEMA.md
│   ├── API_CONVENTIONS.md
│   ├── LOCALIZATION.md
│   ├── OFFLINE_STRATEGY.md
│   ├── SECURITY_PRIVACY.md
│   ├── ROLLOUT_PLAN.md
│   ├── SETUP.md
│   └── modules/             # one .md per PRD §4.x module
└── studyTeach (2)/          # design prototype (read-only reference)
```

## Working with agents

Sub-agents are defined in `.claude/agents/`. Each owns a slice of the system:

| Agent | Use when… |
|---|---|
| `frontend-architect` | Next.js / App Router / Tailwind / RSC / Ger Interior component work |
| `backend-architect` | NestJS modules, controllers, services, middleware |
| `database-schema` | PostgreSQL DDL, migrations, pgvector, indexes, RLS-equivalent multi-tenant scoping |
| `ai-tutor-engineer` | LLM integration, RAG over curriculum, guardrails, Bayesian Knowledge Tracing |
| `ger-design-system` | Tokens, motifs, accessibility, design-prototype-to-component translation |
| `mongolian-localization` | Cyrillic↔Latin, English, SMS/USSD copy, curriculum glossary |
| `offline-pwa-engineer` | Service workers, IndexedDB, sync queues, content packs |
| `payments-integration` | QPay, E-Barimt, idempotency, surge handling |
| `security-compliance` | Auth, RBAC, audit log, Mongolian PDP Law (2021), minors' data |
| `qa-test-engineer` | Test strategy, fixtures, 3G/offline simulation, accessibility audits |

See [`AGENTS.md`](./AGENTS.md) for routing rules.

## Conventions

- **Language:** TypeScript strict mode everywhere. No `any` without an inline comment justifying it.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Reference the PRD section in the body, e.g. `Refs: PRD §4.2`.
- **PRs:** Must list which PRD section(s) they implement and which equity / non-functional targets they affect.
- **No emoji in product UI.** Brass-line `<Icon>` glyphs from `motifs.jsx` only.
- **No third-party fonts beyond** Bitter (display), Manrope (body), Noto Serif Mongolian (script fallback).
- **No client-side secrets.** Anything that touches QPay, ebarimt, SMS aggregator, or LLM vendor lives behind a server route.
- **Tests:** integration tests must hit a real Postgres, never a mock. (Mongolian-language test fixtures live in `apps/api/test/fixtures/mn/`.)

## Non-goals (do not build these)

- School Information System (timetabling, payroll, asset management).
- LMS replacement (Bagsh.ai et al. coexist via link-out).
- Social network (no public profiles, no feed, no follower graph).
- Third-party content marketplace in v2.0.0.

If a request edges into any non-goal, push back and reference this section.

## Phasing (see [`docs/ROLLOUT_PLAN.md`](./docs/ROLLOUT_PLAN.md) for detail)

- **P0 — Q3 2026:** AI Tutor, EGSh Prep, Olympiad Directory + Ticket, Teacher Workspace + Bulk Roster, offline PWA + SMS infra, auth/RBAC, QPay, E-Barimt.
- **P1 — Q1 2027:** Teacher Academy (20 courses), Focus Mode, full Parent Portal incl. USSD, Portable Student Record, Study Abroad Hub v2 (8 destinations), Scholarship Aggregator.
- **P2 — Q3 2027:** Wellbeing Pulse, Boys-at-Risk, AI Application Coach, Alumni Network, Capacitor wrapper.
- **P3 — optional:** Boarding Bus Tracker, third-party Olympiad publishers, SIS API.

## Quick references

- Equity metrics & success targets: PRD §10
- Database schema (source of truth): PRD §7.3 → mirrored in [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md)
- Open partnership dependencies: PRD §11.1
- Glossary (EGSh, MEXT, KGSP, aimag, soum, …): PRD Appendix A
