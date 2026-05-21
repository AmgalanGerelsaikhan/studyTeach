# Module: AI Tutor (PRD §4.1)

> Free, adaptive, Mongolian-language tutor. Owner: `ai-tutor-engineer`. Frontend: `frontend-architect`. Localization: `mongolian-localization`.

## Purpose

Give every Mongolian K-12 student a free, adaptive tutor that explains concepts in clear Mongolian, generates practice problems, and tracks mastery against the national curriculum.

## Scope

- Subjects at launch: Mathematics (1-12), Mongolian Language, Physics, Chemistry, Biology, History, English.
- Conversational interface in Mongolian Cyrillic; Latin transliteration toggle for keyboard-constrained devices.
- Adaptive remediation hook from EGSh Prep — missed concepts open a tutor session on that strand.

## Behavior

- Every response cites the curriculum strand and grade level.
- Practice problem generator returns 5-10 problems/session; curated bank first, LLM fallback with human-validated keys.
- Per-concept mastery tracked via Bayesian Knowledge Tracing; surfaces remediation when mastery <threshold.

## Refusals (canonical, non-negotiable)

1. No exam answers during active mock-test sessions. → `ai-tutor.refusal.exam-mode`.
2. No writing essays for students. → `ai-tutor.refusal.write-essay`.
3. No non-academic chitchat — redirect to current topic, not refuse.

Refusal text is owned with `mongolian-localization`; see [`docs/LOCALIZATION.md`](../LOCALIZATION.md).

## Quotas (free tier)

- 20 sessions / student / month for verified school code.
- Unlimited for students at Moza partner schools.
- ~50K tokens / session ceiling (server-enforced before vendor call).

## Architecture

```
[client chat input]
    ↓
[refusal classifier] ─── refuse → canonical Mongolian refusal
    ↓ accept
[RAG: pgvector over curriculum_chunks, scoped by lang + grade + subject]
    ↓
[LLM call with retrieved context + persona prompt]
    ↓
[response with citation: "БНХ 11.4.2" or "ЭЕШ 2024 · Физик · #14"]
    ↓
[optional: pull practice from bank or generate via LLM]
    ↓
[BKT update on concept_mastery]
```

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/ai-tutor/sessions` | Start a session. Idempotent. Returns session_id. |
| `POST` | `/ai-tutor/sessions/:id/messages` | Turn-by-turn. Returns assistant turn with citations. |
| `GET` | `/ai-tutor/sessions/:id` | Session transcript (retained 90d). |
| `DELETE` | `/ai-tutor/sessions/:id` | Immediate purge (user-initiated). |
| `GET` | `/ai-tutor/mastery?strand=…` | Per-concept mastery for the calling student. |
| `GET` | `/ai-tutor/quota` | Remaining sessions this month. |

## Data

- Reads: `curriculum_chunks` (pgvector), `concept_mastery`, `students`.
- Writes: `ai_tutor_sessions`, `ai_tutor_messages`, `concept_mastery`.
- Retention: messages 90 days, then auto-purge.

## UI (per prototype)

- Three-pane: sessions list • chat • concept panel (right).
- Topic header shows curriculum strand badge (moss chip "Сургалтын хөтөлбөртэй уялдсан").
- Citations rendered as brass chips below assistant turn.
- Concept panel shows per-concept mastery bars and related sources.
- Practice problems appear as card pair under the tutor turn.
- Input bar shows Cyrillic/Latin toggle and a persistent reminder: "AI Багш шалгалтын хариу өгөхгүй".

See `studyTeach (2)/student.jsx` → `AITutor` for the source prototype.

## Tests

- `apps/api/test/ai-tutor/refusals.spec.ts` — all 4 refusal scenarios trigger.
- `apps/api/test/ai-tutor/citations.spec.ts` — every response carries ≥1 citation.
- `apps/api/test/ai-tutor/quota.spec.ts` — quota enforcement at boundary.
- `apps/api/test/ai-tutor/mastery.spec.ts` — BKT update converges on a known sequence.
- Curated regression set: 50 Mongolian + 20 English curriculum queries, run on every prompt change.

## P0 acceptance

- [ ] Refusal scenarios pass 100%.
- [ ] Mongolian Cyrillic UI; Latin toggle works.
- [ ] Cited strand visible on every assistant turn.
- [ ] Quota enforced server-side.
- [ ] Mastery updates after a session.
- [ ] p95 first-token latency <2s on 3G with vendor caching.

## Open questions (route to user)

- LLM vendor: Claude vs. GPT-4-class vs. Mongolian-finetuned candidate? (PRD §11.2)
- Practice-problem human-review SLA — who, where, how fast?
