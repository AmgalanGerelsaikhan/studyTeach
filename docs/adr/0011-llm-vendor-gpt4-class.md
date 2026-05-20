# ADR-0011: LLM vendor — GPT-4-class

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** ai-tutor-engineer, AIAA leadership, user (D-1 resolved)
- **Affects:** `apps/api/src/modules/ai-tutor/`, `apps/api/src/modules/application-coach/`, `apps/api/src/lib/llm/`
- **Supersedes:** open decision D-1 in `FEATURE_DEVELOPMENT_PLAN.md`

## Context

The AI Tutor (PRD §4.1), EGSh adaptive remediation hook (§4.2), and AI Application Coach (§4.10c) all depend on a Mongolian-capable LLM. Three candidate families were on the table:

- **Claude (Anthropic)** — strong refusal fidelity, multilingual competence including Mongolian, but less mature ecosystem tooling on Anthropic SDK side compared to OpenAI.
- **GPT-4-class** (OpenAI's GPT-4 family or Azure OpenAI) — broadly competent in Mongolian Cyrillic, mature ecosystem, well-documented refusal behavior, large vendor presence.
- **Mongolian-finetuned candidate** — local models tuned specifically for Mongolian language tasks. Strongest cultural/linguistic specificity but unknown refusal fidelity, unknown availability, and unknown long-term support guarantees.

PRD §6.2 caps free-tier usage at 20 sessions/student/month × ~50K tokens/session, with ~60% expected cache hit rate. Heavier reasoning is reserved for the Application Coach (lower volume, higher value).

## Decision

The **primary LLM vendor is GPT-4-class** (OpenAI or Azure OpenAI; specific deployment choice deferred to a follow-on ops decision but defaults to OpenAI direct).

The **Mongolian-finetuned candidate is preserved as the offline-pack option** for AI Tutor content pre-generated into content packs (PRD §5.1) where vendor reachability cannot be assumed.

## Consequences

### Positive

- Mature SDK, predictable rate limits, well-documented refusal patterns help the in-process refusal classifier coexist with the LLM cleanly.
- OpenAI ecosystem tooling (embeddings, function-calling) is broad — useful for RAG over `curriculum_chunks` and for structured outputs in the AI Application Coach.
- Cost is predictable per the published OpenAI pricing tiers; the per-session token budget is enforceable server-side before the vendor call.
- Azure OpenAI deployment available if data-residency concerns escalate post-launch (Singapore region offered).

### Negative

- Mongolian Cyrillic competence varies by GPT-4-class model variant; we must evaluate (gpt-4o, gpt-4-turbo, or successor) against the 50-Mongolian-query regression suite before lock-in to a specific model name.
- Pricing is vendor-driven; cost spikes due to vendor pricing change are a budget risk. Mitigation: cache hit-rate target ≥60%; quota ceiling per user.
- Vendor outage = AI Tutor degraded. Mitigation: cached responses + practice papers fallback (PRD §5.1, RUNBOOK incident #7).
- Possible regulatory friction around Mongolian Personal Data Protection Law (2021) — student conversational data leaving Mongolia. DPIA mandatory (`docs/compliance/dpia-openai.md`) before P0 launch.

### Neutral

- Vendor wrapper in `apps/api/src/lib/llm/` is provider-agnostic; future swap (e.g., to Claude or local) is a config change, not a rewrite.
- We may add Claude as a secondary vendor for the Application Coach later if its narrative-critique outputs measurably outperform GPT-4-class.

## Implementation notes

- Default vendor for development: **mock** (deterministic responses, no network); no developer needs vendor credentials to run `pnpm dev`.
- Default vendor for staging + prod: **GPT-4-class via OpenAI API**, with provider-side data-retention disabled (zero-retention contract).
- Embeddings: `text-embedding-3-large` (1024 dim) → matches `curriculum_chunks.embedding vector(1024)` in `DATABASE_SCHEMA.md`.
- All vendor calls go through `apps/api/src/lib/llm/openai.ts`; controllers never call the OpenAI SDK directly.
- Token budgets enforced in `apps/api/src/modules/ai-tutor/quota.guard.ts` *before* the vendor call.
- Caching key: `SHA256(prompt + retrieved_context_ids + model_version)`.

## Required follow-ups

| Item | Owner | Due |
|---|---|---|
| Sign zero-retention contract with OpenAI / Azure OpenAI | AIAA Leadership + security-compliance | Before S03 (2026-07-13) |
| DPIA in `docs/compliance/dpia-openai.md` | security-compliance | Before S03 |
| Lock specific GPT-4-class model name after Mongolian regression eval | ai-tutor-engineer | During S03 |
| Provision OpenAI org account + spend cap | AIAA Ops | Before S03 |

## Alternatives considered

### Claude (Anthropic)

- Pros: refusal fidelity, strong following-instructions behavior, multilingual including Mongolian; aligns culturally with Anthropic's safety posture.
- Cons: smaller ecosystem; less mature embedding offering; smaller Mongolian-specific eval data publicly available.
- Why rejected: user picked GPT-4-class. Claude remains a candidate for a future secondary vendor on the Application Coach path if benchmark results warrant.

### Mongolian-finetuned candidate (e.g., MN-LLM, local providers)

- Pros: highest cultural/linguistic specificity; addresses data residency concerns natively.
- Cons: unknown refusal fidelity (no public evaluation), no guaranteed availability, limited tooling, smaller engineering surface.
- Why rejected: too much delivery risk for P0. Preserved as the **offline content pack** option — pre-generated content baked into monthly packs where vendor reachability can't be assumed.

### Multi-vendor active/active

- Pros: vendor-outage resilience by design.
- Cons: doubles eval, contract, and DPIA work; refusal-text drift across vendors is hard to control.
- Why rejected: P0 prefers simpler. Add later if outage risk justifies it.

## References

- PRD §4.1 (AI Tutor), §4.10c (App Coach), §6 (AI layer), §11.2 (decisions to lock).
- `.claude/agents/ai-tutor-engineer.md`.
- `docs/modules/ai-tutor.md`.
- `FEATURE_DEVELOPMENT_PLAN.md` — D-1 now closed.
