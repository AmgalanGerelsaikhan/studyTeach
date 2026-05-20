# ADR-0003: PostgreSQL 16 with pgvector for primary DB and vector index

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** database-schema, ai-tutor-engineer
- **Affects:** `apps/api/migrations/`, AI Tutor RAG path

## Context

We need:

- Relational primary DB with strong transactional guarantees (payments, registrations, audit log integrity).
- Vector search for AI Tutor RAG over Mongolian curriculum chunks.
- pgcrypto for PII encryption at rest.
- Mature partitioning + PITR for the 7-year audit log retention.

## Decision

Use **PostgreSQL 16** as the primary database. Use the **`pgvector` extension** for vector embeddings, not a separate vector store.

## Consequences

### Positive

- One database to operate, back up, and secure.
- Cross-references between relational tables and vector matches in a single query.
- `pgvector` is mature enough at our scale (curriculum is ~hundreds of thousands of chunks, not billions).
- pgcrypto solves PII encryption at rest natively.
- BRIN indexes give us 7-year audit-log retention without painful index sizes.

### Negative

- `pgvector` is slower than purpose-built vector DBs at very large scales. We accept this; revisit at P2.
- IVFFlat index parameters (lists) need tuning as the corpus grows.
- Postgres ops complexity is non-trivial; we rely on Railway managed DB.

### Neutral

- We can swap to a dedicated vector store later; the abstraction in `apps/api/src/lib/rag/` is provider-agnostic.

## Alternatives considered

### Postgres + dedicated vector DB (Pinecone, Weaviate, Qdrant)

- Pros: better vector recall at scale, purpose-built indexes.
- Cons: two systems to operate, cross-data-source joins manual, monthly vendor cost.
- Why rejected: our corpus fits in one DB; complexity isn't justified at v2.0.0.

### MySQL / MariaDB

- Pros: ubiquity.
- Cons: weaker JSON support, no native vector extension, weaker partitioning.
- Why rejected: schema features we want are first-class in Postgres.

### MongoDB

- Pros: schema flexibility.
- Cons: weak transactional guarantees on multi-document writes (which we need for audit log + payment paths), Atlas vector is fine but not relational.
- Why rejected: payment idempotency + audit-log integrity argue for a strict relational core.

## References

- PRD §7.1, §7.3.
- `docs/DATABASE_SCHEMA.md`.
- `.claude/agents/database-schema.md`.
- ADR-0008 (idempotency).
