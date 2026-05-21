# ADR-0009: Ger Interior as the visual identity

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** ger-design-system, Moza leadership
- **Affects:** Every visual surface

## Context

A national educational platform's visual identity carries cultural weight. The platform serves Mongolian students from herder families in remote soums to UB-based families. An identity that says "we are global SaaS" excludes; one that says "we are Mongolian heritage" risks being read as ethnic decoration over generic SaaS.

We need an identity that is _quiet, considered, and culturally grounded_ — that feels like an interior its users belong to.

## Decision

The visual identity is **Ger Interior**: a Mongolian ger at warm lamplight. Wool felt surfaces (cream), lacquered ember red action color, brass accents, warm shadows. Motif inventory closed in v2.0.0 to Soyombo flame, Khamar khee meander, Ulzii eternal knot, and brass corner brackets/tacks.

Typography: Bitter (serif display) + Manrope (sans body) + Noto Serif Mongolian (script fallback).

No emoji in product UI. No pure white. No pure black.

## Consequences

### Positive

- Cohesive across personas (Student, Teacher, Parent, Admin, Pathway) — they share a room.
- Decoration is toggleable; functionality never depends on it.
- Distinctive — not interchangeable with generic SaaS.
- Honors cultural elements without literal reproduction.

### Negative

- Higher implementation cost than a generic Tailwind theme.
- Designers entering the team need a brief; ramp-up is real.
- Motif inventory closure constrains creative impulses; we accept this for cohesion.

### Neutral

- Future motifs can be added — but only with user approval, not casually.
- An English-only-locale-only screen still uses Ger Interior; we don't switch identity by locale.

## Alternatives considered

### Generic Tailwind + Mongolian color accent

- Pros: lowest implementation cost.
- Cons: indistinguishable from any other SaaS; misses the platform's mission.
- Why rejected: undersells the platform's cultural alignment.

### Photographic / illustrative (real ger photography, traditional art)

- Pros: maximum cultural specificity.
- Cons: heavy assets clash with 3G budget; risk of folkloric decoration over function.
- Why rejected: function-first; abstract geometric primitives suit performance and tooling.

### Material 3 / iOS HIG defaults

- Pros: familiar.
- Cons: imports a foreign vocabulary; no cultural anchoring.
- Why rejected: platform identity matters here.

## References

- `docs/DESIGN_SYSTEM.md`.
- `studyTeach (2)/tokens.css`, `studyTeach (2)/motifs.jsx`.
- `.claude/agents/ger-design-system.md`.
