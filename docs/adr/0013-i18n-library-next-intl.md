# ADR-0013: i18n library — next-intl

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** mongolian-localization, frontend-architect, user (D-3 resolved)
- **Affects:** `apps/web/lib/i18n/`, every user-visible string
- **Supersedes:** open decision D-3 in `FEATURE_DEVELOPMENT_PLAN.md`

## Context

ADR-0005 fixed `mn-Cyrl` as the default locale, with `mn-Latn` as a generated transliteration and `en` as a partial locale. Catalog layout already specified in `docs/LOCALIZATION.md`.

We need an i18n library that:

- Works with Next.js 14 App Router and React Server Components (ADR-0001).
- Supports server-side locale detection from cookie + `Accept-Language`.
- Allows the client locale toggle (Cyrillic ↔ Latin) without a full page reload.
- Supports message-format pluralization and ICU number/date formatting (relevant for Mongolian Tögrög currency formatting and date strings).
- Doesn't ship a huge client runtime — we have a strict 3G perf budget.

## Decision

Use **`next-intl`** for i18n in `apps/web/`.

## Consequences

### Positive

- First-class App Router support, including locale-scoped routing (`/[locale]/...`) and server-component message access.
- Server components can read messages without shipping the catalog to the client.
- ICU MessageFormat support — handles Mongolian Cyrillic pluralization, date formats, and Tögrög currency conventions natively.
- Small client runtime; tree-shakable.
- Active maintenance, broad community usage in Next.js 14 setups.

### Negative

- App Router locale routing pattern (`/[locale]/...`) influences route file layout. We accept this; aligns with how persona chromes already work.
- Catalog format is JSON; we maintain a CI step to validate completeness across locales.
- Cyrillic ↔ Latin toggle requires custom plumbing — `next-intl` doesn't generate transliteration. We own that (table from ADR-0005, MNS 5217:2012).

### Neutral

- Migration to a different library later is non-trivial but bounded — messages are plain JSON files; the binding to library APIs is in `apps/web/lib/i18n/`.

## Implementation notes

- Catalog at `apps/web/lib/i18n/{mn-Cyrl,mn-Latn,en}/`.
- Build-time generation of `mn-Latn` from `mn-Cyrl` via `pnpm i18n:translit` (MNS 5217:2012 mapping in `apps/web/lib/i18n/translit/mns-5217.ts`).
- CI step `pnpm i18n:validate` fails on:
  - Missing keys across locales.
  - Orphan keys (in catalog, not referenced in code).
  - `i18n.todo` placeholders in any committed catalog.
- Server-side default locale resolution: signed cookie > `Accept-Language` > `mn-Cyrl`.
- Client-side toggle: writes the cookie; `router.refresh()` re-fetches RSC with the new locale.
- ICU number format: `formatNumber(180000, {style: 'currency', currency: 'MNT'})` → `180 000 ₮` (non-breaking space, symbol-after with thin space — handled via custom formatter wrapping `next-intl`'s `useFormatter`).

## Required follow-ups

| Item                                                   | Owner                                       | Due        |
| ------------------------------------------------------ | ------------------------------------------- | ---------- |
| Scaffold `next-intl` in `apps/web/`                    | frontend-architect                          | Sprint S00 |
| Seed `mn-Cyrl/common.json` with baseline strings (~20) | mongolian-localization                      | Sprint S00 |
| Implement MNS 5217:2012 transliteration table          | mongolian-localization                      | Sprint S00 |
| Wire CI `i18n:validate` step                           | qa-test-engineer                            | Sprint S00 |
| Currency / number / date formatter wrappers            | frontend-architect + mongolian-localization | Sprint S01 |

## Alternatives considered

### lingui

- Pros: macro-based extraction; type-safe message references.
- Cons: macro setup adds build complexity; less mature App Router integration; the macro pattern is unfamiliar to engineers not coming from a Lingui project.
- Why rejected: `next-intl` covers our needs without macro overhead.

### react-intl (FormatJS)

- Pros: industry standard; battle-tested.
- Cons: heavier client runtime than `next-intl`; App Router story is more manual.
- Why rejected: `next-intl` is leaner and App-Router-native.

### Hand-rolled i18n via context

- Pros: zero dependency.
- Cons: re-invents ICU MessageFormat, locale routing, plural rules. Yak-shaving.
- Why rejected: not worth the surface area.

## References

- ADR-0001 (Next.js App Router).
- ADR-0005 (Mongolian Cyrillic default).
- `docs/LOCALIZATION.md`.
- `.claude/agents/mongolian-localization.md`.
- `FEATURE_DEVELOPMENT_PLAN.md` — D-3 now closed.
