# Changelog

All notable changes to studyTeach. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) with project-specific sections.

## [Unreleased]

### Planned (P0 — Q3 2026)

- AI Tutor (Mongolian) with RAG, refusals, Bayesian Knowledge Tracing.
- EGSh Prep Engine with timed mocks, score-band predictor, cohort percentile.
- Olympiad Directory with online-proctored variants.
- Signed Digital Ticket with offline rendering.
- Teacher Workspace with bulk roster + analytics matrix.
- QPay + E-Barimt + idempotent invoices + surge queue.
- PWA shell + service worker + sync queue + IndexedDB stores.
- SMS gateway (outbound + STATUS/STOP inbound).
- Auth + 2FA + multi-tenant scope + audit log + RBAC for 5 roles.
- Mongolian Cyrillic + Latin transliteration + English UI.

## [0.0.0] — 2026-05-20

### Added

- Repository documentation: PRD v2.0.0, agent definitions, architecture, design system, database schema, API conventions, localization, offline strategy, security/privacy, rollout plan, setup.
- Feature development plan with epic/sprint breakdown.
- Per-module specs for PRD §4.1–§4.10.
- Architecture Decision Records: Next.js App Router, NestJS, Postgres+pgvector, PWA-first, Mongolian Cyrillic default, multi-tenant scoping, cookie-based sessions, idempotency strategy.

---

## Version scheme

- `v0.x.y` — pre-launch builds.
- `v1.0.0` — P0 production launch.
- `v1.x.y` — P0 patches.
- `v2.0.0` — P1 launch (Teacher Academy + Focus Mode + Parent Portal + PSR + Study Abroad).
- `v3.0.0` — P2 launch (Wellbeing + Boys-at-Risk + App Coach + Alumni + Capacitor).

`x` increments per feature ship; `y` per patch.

## Entry format

```
## [vX.Y.Z] — YYYY-MM-DD

### Added
- Feature description (PRD §x.y, EPIC-NNN)

### Changed
- ...

### Deprecated
- ...

### Removed
- ...

### Fixed
- ...

### Security
- ...
```

External-facing release notes for educators and partners live separately under `docs/release-notes/` and are derived from this CHANGELOG.
