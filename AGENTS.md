# AGENTS.md — Sub-agent roster for studyTeach

This document explains *which* agent to dispatch for *what* work and how the agents compose. Agent specs live in [`.claude/agents/`](./.claude/agents/) — one Markdown file per agent. Each spec contains the agent's system prompt, owned files, escalation rules, and tool allowlist.

## Routing rules

A request is routed to the agent that owns the **primary artifact** being changed. If the work touches more than one slice, the main thread coordinates; do not let one agent quietly edit another's domain.

| If the work is primarily about… | Dispatch |
|---|---|
| A `.tsx` component, page, layout, or route in `apps/web/` | `frontend-architect` |
| A NestJS controller, service, module, guard, or pipe in `apps/api/` | `backend-architect` |
| A Postgres migration, DDL change, index, query plan, or `pgvector` index | `database-schema` |
| LLM prompt, RAG retrieval, guardrail, mastery model, refusal text | `ai-tutor-engineer` |
| Tokens, motifs, accessibility, prototype→component translation | `ger-design-system` |
| Mongolian/Latin/English copy, SMS, USSD, curriculum glossary | `mongolian-localization` |
| Service worker, IndexedDB schema, sync queue, content pack format | `offline-pwa-engineer` |
| QPay invoice, E-Barimt webhook, idempotency hash, surge queue | `payments-integration` |
| Auth, 2FA, RBAC, audit log, PDP Law compliance, minors' consent | `security-compliance` |
| Test strategy, fixtures, 3G/offline simulation, accessibility audit | `qa-test-engineer` |

## When to compose multiple agents

Some changes are inherently cross-cutting. Suggested patterns:

- **New PRD module from scratch** → start with `backend-architect` for API + `database-schema` for migrations, then `frontend-architect` consumes the API, with `ger-design-system` and `mongolian-localization` as reviewers.
- **AI Tutor feature** → `ai-tutor-engineer` owns prompt/RAG/refusal; `backend-architect` exposes the endpoint; `frontend-architect` builds the chat UI; `mongolian-localization` reviews all prompts and refusals.
- **Anything QPay-touching** → `payments-integration` writes the integration, `security-compliance` reviews idempotency + audit hooks, `qa-test-engineer` writes the surge-load test.
- **Offline-capable feature** → `offline-pwa-engineer` defines the sync contract; `backend-architect` exposes the idempotent endpoint; `frontend-architect` wires the UI to the queue.

## What agents must never do

- Edit `PRD.md`. The PRD is read-only for agents; product changes route to the user.
- Disable hooks (`--no-verify`), bypass signing, or use `git reset --hard` on shared branches.
- Introduce a new third-party SaaS without `security-compliance` review.
- Add a non-Cyrillic-first string to product UI without `mongolian-localization` review.
- Mock the database in integration tests. (Burned in a prior project. Real Postgres only.)

## Agent catalog

| File | Owner of |
|---|---|
| [`.claude/agents/frontend-architect.md`](./.claude/agents/frontend-architect.md) | Next.js 14 App Router, RSC boundaries, Tailwind, component composition |
| [`.claude/agents/backend-architect.md`](./.claude/agents/backend-architect.md) | NestJS modules, middleware, guards, REST/RPC API surface |
| [`.claude/agents/database-schema.md`](./.claude/agents/database-schema.md) | Postgres 16 + pgvector, migrations, multi-tenant scoping |
| [`.claude/agents/ai-tutor-engineer.md`](./.claude/agents/ai-tutor-engineer.md) | LLM + RAG + guardrails + Bayesian Knowledge Tracing |
| [`.claude/agents/ger-design-system.md`](./.claude/agents/ger-design-system.md) | Design tokens, motifs, accessibility, prototype parity |
| [`.claude/agents/mongolian-localization.md`](./.claude/agents/mongolian-localization.md) | Translation, transliteration, glossary, SMS/USSD copy |
| [`.claude/agents/offline-pwa-engineer.md`](./.claude/agents/offline-pwa-engineer.md) | Service workers, IndexedDB, sync, content packs |
| [`.claude/agents/payments-integration.md`](./.claude/agents/payments-integration.md) | QPay, E-Barimt, idempotency, surge queue |
| [`.claude/agents/security-compliance.md`](./.claude/agents/security-compliance.md) | Auth, RBAC, audit, PDP Law, minors |
| [`.claude/agents/qa-test-engineer.md`](./.claude/agents/qa-test-engineer.md) | Test strategy, fixtures, 3G/offline, accessibility |

## Escalation

If two agents disagree (e.g., `frontend-architect` wants to relax a refusal text and `ai-tutor-engineer` objects), the **owner of the affected user-visible behavior wins**. Visible behavior includes refusal text, error messages, locale defaults, and audit-log entries. If in doubt, escalate to the user.
