# Contributing

> Internal contributor guide. External contributions are not accepted in v2.0.0.

## Before you start

1. Read [`CLAUDE.md`](../CLAUDE.md) for the hard constraints. They are not optional.
2. Read the [`PRD.md`](../PRD.md) section that covers your area.
3. Read the relevant agent spec in [`.claude/agents/`](../.claude/agents/) — this defines who owns your slice and what they will reject.
4. Check [`FEATURE_DEVELOPMENT_PLAN.md`](../FEATURE_DEVELOPMENT_PLAN.md) — confirm your work matches an active epic.

## Branching

- `main` is always deployable to staging.
- `release/vX.Y` is the production branch; only release-managers merge here.
- Feature branches: `feat/EPIC-NNN-short-name`.
- Fix branches: `fix/short-name` or `fix/INC-NNN-short-name` for incidents.

Branch from `main`. Rebase, don't merge, before opening a PR.

## Commits

Conventional Commits:

```
feat(ai-tutor): add Mongolian curriculum citations to assistant turns

Adds RAG citation chip after every assistant turn. Pulls strand and
grade level from curriculum_chunks. Required to pass refusal layer
output validation.

Refs: PRD §4.1, EPIC-014
```

Header forms allowed: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `build:`, `ci:`, `revert:`.

The body explains the *why*. The diff explains the *what*. Always reference the PRD section and epic ID in the footer.

## Pull requests

Open a PR against `main`. Use the [PR template](../.github/PULL_REQUEST_TEMPLATE.md). The template asks for:

- Linked epic and PRD section.
- Which agent's territory the PR touches (determines review).
- Equity/non-functional targets affected.
- Test plan (manual + automated).
- Localization status (any new strings → `mongolian-localization` review).
- Security/privacy considerations (any new trust-boundary work → `security-compliance` review).

PR title format: `<type>(<scope>): <description>` matching the commit header.

### Required approvals

- One peer approval (matching agent territory).
- For trust-boundary changes: `security-compliance` approval.
- For new user-visible strings: `mongolian-localization` approval.
- For schema changes: `database-schema` approval.
- For payment paths: `payments-integration` approval.

### Required green checks

- Lint + typecheck.
- Unit + integration tests.
- A11y axe-core sweep on changed routes.
- Bundle size budget (initial JS ≤200KB per route).
- 3G perf budget on changed routes (p95 page load <3s).

## Code style

- TypeScript strict; no `any` without an inline comment.
- Function components, hooks only.
- Server Components by default; `"use client"` only when interactivity demands it.
- No emoji in product UI (allowed in commits, docs, and code comments).
- No inline strings in `.tsx`/`.ts` for user-visible text — use the i18n catalog.
- No hard-coded hex colors — use design tokens.
- Tests use real Postgres, never mocks.

Full standards: [`CODING_STANDARDS.md`](./CODING_STANDARDS.md).

## Tests

Every PR includes tests at the appropriate layer:

| Change type | Required tests |
|---|---|
| New endpoint | Integration (happy + auth + tenant + idempotency) |
| New UI screen | Component test + visual snapshot + a11y |
| New offline-capable flow | Playwright offline E2E |
| New write path that touches money | Integration + idempotency + surge-load smoke |
| New refusal/wellbeing text | Refusal scenario test + sensitivity review |

Real Postgres for integration tests, never mocks. ([Past incident: mocks diverged from prod, broke a migration.](./CODING_STANDARDS.md#testing))

## Documentation

If you change behavior, you update the doc. Same PR, no follow-up.

- Schema change → `docs/DATABASE_SCHEMA.md`.
- API change → `docs/API_CONVENTIONS.md` + the contract file in `apps/api/src/contracts/`.
- Token change → `docs/DESIGN_SYSTEM.md`.
- Trust-boundary change → `docs/SECURITY_PRIVACY.md`.
- New decision → file an ADR in `docs/adr/`.

## Localization

User-visible strings ship via the i18n catalog:

1. Add the key with an `i18n.todo` placeholder.
2. `mongolian-localization` translates in the same PR or the next.
3. PR is not approved-by-default until the placeholder is replaced.

Refusal text and wellbeing prompts require additional user + AIAA reviewer sign-off.

## Security disclosures

Don't open public issues for security problems. See [`SECURITY_PRIVACY.md`](./SECURITY_PRIVACY.md) for the disclosure channel.

## Reviews

When you're the reviewer:

- Check against the spec, not the diff. The diff shows *what changed*; the spec defines *what should be*.
- Run the change locally for non-trivial PRs.
- Flag missing tests as blocking, not as nits.
- Be specific. "This refusal text could be misread" beats "rephrase".

When you're the author:

- Address review comments by either fixing or pushing back with reasoning. "I'll think about it later" is not a response.
- Don't squash before review; squash on merge if the reviewer requested it.
- Don't ship with an unresolved blocking comment.

## Release

See `docs/DEPLOYMENT.md` for the release procedure.

## Communication

- Async by default. Most decisions can be made in a PR thread.
- Synchronous for: incident response, security disclosures, escalations, sprint retros.
- If a PR thread crosses 20 comments without a decision, schedule a 15-minute call.

Welcome aboard.
