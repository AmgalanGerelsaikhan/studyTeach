# Sprint S03 — AI Tutor MVP

**2026-07-07 → 07-20**

## Goal

A student opens AI Tutor in Mongolian, asks a Physics question, gets a cited response, and the four refusal scenarios trigger correctly. Concept mastery moves after a session.

## Active epics

| Epic | Owner | Exit |
|---|---|---|
| E-014 · AI Tutor — RAG + refusals + BKT (3 of 4 weeks) | ai-tutor-engineer | end-to-end tutor turn working in Mongolian with citations |
| E-009 · IndexedDB sync queue (continued) | offline-pwa-engineer | session transcript cached for 7 days |

## Ticket seed list

- `[E-014]` Migration: `ai_tutor_sessions`, `ai_tutor_messages`, `curriculum_chunks` (pgvector).
- `[E-014]` Ingest seed curriculum: Physics grade 11, Math grade 11, Mongolian Language grade 11 (just enough to demo).
- `[E-014]` Embedding pipeline (chunk → vector → upsert).
- `[E-014]` LLM vendor wrapper (`apps/api/src/lib/llm/`). Default vendor = mock for dev; configurable.
- `[E-014]` RAG retrieval scoped by `lang + grade + subject`.
- `[E-014]` Refusal classifier in front of LLM (lightweight, in-process).
- `[E-014]` Canonical refusal text loaded from `i18n/ai-refusals.json`.
- `[E-014]` Citation appended to every assistant turn.
- `[E-014]` Bayesian Knowledge Tracing update on `concept_mastery` after each session.
- `[E-014]` Quota enforcement (20 sessions/student/month for free tier).
- `[E-014]` Frontend chat UI (three-pane: sessions list • chat • concept panel).
- `[E-014]` Cyrillic/Latin toggle in input bar.
- `[E-014]` Practice problem card pair after tutor turn (pull from curated bank first).

## Sprint risks

- LLM vendor not yet locked. **Mitigation:** vendor wrapper allows runtime swap; mock vendor for dev.
- Embedding model choice for Mongolian. **Mitigation:** start with multilingual model; tag for re-eval after S07.
- Token budget could be exceeded by enthusiastic users in dev. **Mitigation:** mock vendor in dev; hard ceiling in code.

## Demo

- Open tutor → ask Physics question in Mongolian → see cited response.
- Trigger each of 4 refusals.
- Show concept mastery moving after session.
- Show quota counter decrementing.

## Exit criteria

- ◯ All 4 refusal scenarios pass.
- ◯ Every assistant turn has ≥1 citation.
- ◯ Quota ceiling enforced.
- ◯ Mastery update visible.
- ◯ p95 first-token latency <2s on 3G (with vendor caching).
