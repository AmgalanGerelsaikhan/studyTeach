# Coding Standards

> What "good code" looks like in this repo. Applies to all TypeScript across `apps/web/` and `apps/api/`.

## TypeScript

- **Strict mode everywhere.** `"strict": true` in every `tsconfig.json`. No exceptions.
- **No `any`** without an inline comment justifying it. Prefer `unknown` + narrowing.
- **No `as` casts** without an inline comment. Prefer type guards or `zod` validators.
- **Discriminated unions** for state machines and result types. Don't simulate with optional booleans.
- **`readonly`** on every array and object property that doesn't change after construction.
- **Exhaustive switches** — use `never` checks to fail compile when an enum gains a member.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Variables, functions | `camelCase` | `submitMockTest` |
| React components | `PascalCase` | `AITutor` |
| Types and interfaces | `PascalCase` | `RegistrationInput` |
| Enums (TS) | `PascalCase` + `SCREAMING_CASE` members | `enum Role { STUDENT }` |
| Files (.ts) | `kebab-case.ts` | `mock-test-service.ts` |
| Files (.tsx) | `PascalCase.tsx` for components | `AITutor.tsx` |
| Tests | `*.spec.ts` (api) or `*.test.tsx` (web) | `registrations.spec.ts` |
| i18n keys | `dotted.snake_path` | `student.home.hero.greeting` |
| DB tables | `snake_case`, plural | `mock_test_results` |
| DB columns | `snake_case`, singular | `student_id` |

## Comments

- Default: no comments. Identifiers should explain themselves.
- Write a comment only when WHY is non-obvious: a hidden constraint, a workaround for a specific bug, a surprising invariant.
- Never explain WHAT the code does — well-named identifiers already do that.
- Never reference the current task / fix / caller ("used by X", "added for the Y flow"). That rots; PR descriptions don't.
- Multi-line comment blocks: never. One short line max.

## React / Next.js (apps/web)

- **Server Components by default.** Promote to `"use client"` only for: local state driving layout, browser-only APIs (IndexedDB, MediaRecorder), or optimistic updates.
- **No prop drilling beyond 2 levels.** Use a context or route co-location.
- **No `useEffect` for derived state.** Compute during render.
- **No `useEffect` for data fetching in RSC routes.** Fetch directly in the server component.
- **Suspense boundaries at route layout level** so streaming works on 3G.
- **One component per file** for components ≥80 lines. Smaller helpers can co-exist.
- **No inline styles** except dynamic values (a width based on a percentage). Otherwise Tailwind + design tokens.
- **No `style={{ ... }}` with static values** — port to a design-system component.

## NestJS (apps/api)

- **One module per PRD §4.x feature.** Modules expose a public service via DI; private services stay private.
- **Controllers are for shape.** Validation (zod), DTO mapping, response shaping.
- **Services own invariants.** All business rules live here; controllers don't enforce idempotency or audit.
- **No DB access in controllers.** Always via service → repository.
- **Use `@Injectable()` scopes intentionally.** Default `DEFAULT`; `REQUEST` only when needed.
- **No `process.env` reads outside `lib/config/`.** Config is loaded once and typed.
- **No synchronous work over 200ms** in a request handler. Push to BullMQ.

## Database

- See [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) for naming and invariants.
- Migrations: one logical change per migration. No "big bang" migrations.
- Always reversible (or paired with a deprecation migration scheduled one release prior).
- Lock-time on a 10M-row table <30s; backfill plan if more.
- Never `SELECT *` in production code. Always enumerate columns.

## Error handling

- **At system boundaries (API ingress, external calls):** validate aggressively with zod, return RFC 7807 errors.
- **Internally:** trust internal callers. Don't double-validate at every layer.
- **Don't add error handling for impossible scenarios.** If a non-null TypeScript guarantees a value, don't add `?? defaultValue`.
- **Never swallow errors silently.** Re-throw, log structured, or surface to the user — pick one.
- **No try/catch around the entire request handler.** NestJS has global filters; use them.

## Logging

- Pino structured JSON. Never `console.log` in committed code.
- **No PII in logs.** Ever.
- **No wellbeing free-text in logs.** Ever.
- Log levels: `error` (user-visible failure), `warn` (degraded but functional), `info` (normal lifecycle), `debug` (dev-only).
- Include `requestId` + `userId` + `organizationCode` on every request log.

## Testing

- **Integration tests use real Postgres**, never mocks. (Past incident: mocked tests passed but prod migration failed.)
- **One assertion per behavioral test**, but multiple assertions on a single behavior are fine.
- **Test fixtures use Mongolian Cyrillic** by default. Latin-only fixtures hide Cyrillic-only bugs.
- **No flaky tests.** A test that fails 1/20 is broken; quarantine and root-cause, don't retry.
- **No `it.only` / `describe.only` in committed code.** Pre-commit hook blocks.
- **A11y tests are blocking**, not advisory.
- **Visual regression failures are blocking** — if a snapshot changed, the change is intentional and the snapshot updates in the same PR.

## Imports

```ts
// 1. Node built-ins
import { readFileSync } from 'node:fs';

// 2. External packages
import { z } from 'zod';
import { Injectable } from '@nestjs/common';

// 3. Internal absolute imports (workspace packages)
import { Registration } from '@studyteach/contracts/registrations';

// 4. Internal relative imports
import { mockTestRepository } from './mock-test.repository';

// 5. CSS / asset imports (web only)
import styles from './AITutor.module.css';
```

Empty line between groups. eslint enforces.

## Performance

- **Initial JS budget per route: ≤200KB gzipped.** Enforced in CI.
- **No client-side data fetching for static content.** Use RSC.
- **Code-split heavy components** (chart libraries, rich text editors).
- **Image budget: ≤100KB per image, served via Next.js `<Image>`** with `priority` only on LCP candidates.

## Security

- **No client-side secrets.** Anything touching QPay, ebarimt, SMS, LLM lives behind a server route.
- **No `document.cookie` for session state.** Sessions are HttpOnly.
- **No `dangerouslySetInnerHTML`.** Single exception: sanitized Mongolian rich-text content from the Moza pedagogy team; sanitize with DOMPurify + allowlist.
- **No `eval` / `Function()` / `setTimeout(string)`.** Linter blocks.
- **Every state-changing endpoint accepts `Idempotency-Key`.**

## Accessibility

- **Semantic HTML first.** ARIA only when HTML doesn't suffice.
- **All interactive elements have accessible names** in Mongolian Cyrillic.
- **Focus rings always visible** on `:focus-visible` (ember 3px outer ring, 15% opacity).
- **Touch targets ≥44px** on mobile.
- **`prefers-reduced-motion`** disables Soyombo pulse and other animation.
- **Color contrast** ≥4.5:1 for body, ≥3:1 for large text / CTAs.

## File and folder shape

```
apps/web/app/student/tutor/
  page.tsx              # RSC route
  AITutor.tsx           # main client component
  ChatMsg.tsx           # subcomponent
  PracticeCard.tsx
  AITutor.test.tsx
```

Component co-located with its tests. No `__tests__/` folders for non-shared tests.

## Git

- Conventional Commits.
- Reference PRD section and epic in commit body footer.
- Rebase, don't merge.
- Don't amend pushed commits; create a new commit.
- Don't force-push to shared branches.
- Don't skip pre-commit hooks with `--no-verify` — if a hook fails, fix the issue.

## Reviews

- Review against the spec, not the diff.
- Block on missing tests for trust-boundary or money-touching code.
- Block on missing localization for user-visible strings.
- Flag, don't fix: in a review comment, propose; don't push commits to someone else's branch unless asked.

## What "done" means

A task is done when:

- [ ] Code compiles with `strict`.
- [ ] All tests at the appropriate layer pass.
- [ ] Linter and formatter clean.
- [ ] Localization complete (no `i18n.todo`).
- [ ] Documentation updated in the same PR.
- [ ] Reviewed by the agent owner.
- [ ] Verified manually on the target device profile (mobile 3G for student/parent screens).
- [ ] **Runtime verified** — dev server started, route `curl`ed, response inspected to confirm real rendered HTML (not a loading shell, not a 500, not a redirect masking the page). For backend changes, JSON shape validated, not just a 200. Env vars confirmed loaded inside the running process, not just present in the shell.
