# ADR-0001: Next.js 14 with App Router for the web app

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** frontend-architect, ger-design-system
- **Affects:** `apps/web/`

## Context

The PRD requires a Progressive Web App, Mongolian Cyrillic-first UI, 3G performance budget (p95 page load <3s), and offline-first behavior for ≥7 days. The team is small; maintenance cost matters. Hosting is Railway + Cloudflare.

## Decision

Use Next.js 14 with the App Router. Use React Server Components by default; promote to `"use client"` only when interactivity demands it.

## Consequences

### Positive

- RSC reduces shipped JavaScript, helping the 3G budget.
- Streaming + Suspense provides perceived performance on slow networks.
- App Router supports route layout patterns that map cleanly to our persona chromes (Student/Teacher/Parent/Admin/Pathway).
- Server actions reduce API surface for non-public mutations.
- Mature i18n via `next-intl` (or similar) on App Router.
- Strong ecosystem; well-known to most TypeScript engineers.

### Negative

- App Router learning curve relative to Pages Router; some engineers may need ramp-up.
- Some libraries don't yet support RSC; we'll need to wrap them in client boundaries.
- ISR semantics differ from Pages Router; cache invalidation must be planned.

### Neutral

- We commit to Next.js's deployment model; if we leave the framework, the migration is non-trivial.

## Alternatives considered

### Remix

- Pros: simpler mental model, strong forms story.
- Cons: smaller ecosystem; less mature i18n on the route level; PWA support requires more glue.
- Why rejected: ecosystem maturity tips it to Next.js for a team of this size.

### Astro

- Pros: extreme performance defaults, MPA-style.
- Cons: heavy interactivity in the AI Tutor and EGSh mock screens is awkward in Astro.
- Why rejected: persona dashboards demand richer client interactivity.

### Vite + React Router

- Pros: maximum control, smallest framework footprint.
- Cons: we'd rebuild SSR, streaming, route layouts, i18n bindings ourselves.
- Why rejected: maintenance cost too high for a small team.

## References

- PRD §7.1 (stack), §8.4 (non-functional targets).
- `docs/ARCHITECTURE.md`.
- ADR-0004 (PWA-first).
