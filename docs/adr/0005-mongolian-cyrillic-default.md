# ADR-0005: Mongolian Cyrillic is the default locale

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** mongolian-localization, frontend-architect, AIAA leadership
- **Affects:** All user-visible code paths

## Context

The platform serves Mongolian K-12 students, teachers, and parents. Cyrillic Mongolian is the dominant written form in education. Some users with keyboard-constrained devices or international schooling prefer Latin transliteration. Study Abroad Hub content and Teacher Academy English track need English.

We must avoid the trap many "international" platforms fall into: defaulting to English and bolting on Mongolian as an option.

## Decision

The default locale is **`mn-Cyrl`**. `mn-Latn` is a per-user toggle that generates Latin from `mn-Cyrl` via the MNS 5217:2012 table. `en` exists for Study Abroad Hub destinations and Teacher Academy English track only — it is **not** a complete UI locale.

Every user-visible string lives in the i18n catalog. No inline strings in `.tsx` / `.ts` files.

## Consequences

### Positive

- Aligns the platform with its target users.
- Forces translation discipline from day 1; no "we'll add Mongolian later" debt.
- Keyboard-constrained users have a toggle; they aren't excluded.
- English content is intentional and bounded, not accidental.

### Negative

- Every PR adding a user-visible string requires localization review.
- Latin transliteration must be deterministic; ad-hoc transliteration is forbidden.
- Some library defaults (e.g., date pickers) need overriding.

### Neutral

- Future locales (Mongolian script for ceremonial UI?) fit the same pattern.

## Alternatives considered

### English-first with Mongolian as locale option

- Pros: lower friction for engineers; faster initial PRs.
- Cons: every non-default locale becomes second-class.
- Why rejected: directly contradicts the platform's mission.

### Mongolian script (traditional vertical Mongol bichig) as default

- Pros: cultural alignment.
- Cons: not used in Mongolian K-12 education today; would frustrate students.
- Why rejected: usability over symbolism. Reserve traditional script for ceremonial use cases (certificates, branding).

### Server-rendered localization only (no client locale switching)

- Pros: simpler.
- Cons: locale toggle UX is core to the product.
- Why rejected: usability.

## References

- PRD §6.3 (localization).
- `docs/LOCALIZATION.md`.
- `.claude/agents/mongolian-localization.md`.
