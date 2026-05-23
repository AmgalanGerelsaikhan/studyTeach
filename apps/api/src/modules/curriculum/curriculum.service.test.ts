/**
 * Integration test — hits the real local Postgres (CLAUDE.md: no mocks for DB).
 * Requires the dev stack: `docker compose up -d` and `pnpm db:migrate`.
 *
 * Test isolation: fixtures use source_ref prefix `TEST/` so they collide
 * neither with the seeded G11 corpus nor with each other across test runs.
 */
import 'dotenv/config';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';
import { LlmService } from '../../lib/llm/llm.module';
import { MockLlmVendor } from '../../lib/llm/mock.vendor';

import { CurriculumService } from './curriculum.service';

const QUERY_PHYSICS = 'TEST_QUERY_PHYSICS_NEWTON';
const QUERY_MATH = 'TEST_QUERY_MATH_QUADRATIC';

interface Fixture {
  strand: string;
  subject: 'physics' | 'math' | 'mongolian';
  grade: number;
  lang: 'mn-Cyrl' | 'en';
  body: string;
  source_ref: string;
}

const FIXTURES: Fixture[] = [
  // Physics @ grade 11, mn-Cyrl — one matches the physics query exactly so it must rank first.
  {
    strand: 'TEST/Mechanics',
    subject: 'physics',
    grade: 11,
    lang: 'mn-Cyrl',
    body: QUERY_PHYSICS,
    source_ref: 'TEST/PHYS/01',
  },
  {
    strand: 'TEST/Mechanics',
    subject: 'physics',
    grade: 11,
    lang: 'mn-Cyrl',
    body: 'TEST physics unrelated body about magnetism',
    source_ref: 'TEST/PHYS/02',
  },
  // Math @ grade 11, mn-Cyrl — separate subject namespace.
  {
    strand: 'TEST/Algebra',
    subject: 'math',
    grade: 11,
    lang: 'mn-Cyrl',
    body: QUERY_MATH,
    source_ref: 'TEST/MATH/01',
  },
  {
    strand: 'TEST/Algebra',
    subject: 'math',
    grade: 11,
    lang: 'mn-Cyrl',
    body: 'TEST math unrelated body about geometry',
    source_ref: 'TEST/MATH/02',
  },
  // Mongolian @ grade 11, mn-Cyrl — third subject.
  {
    strand: 'TEST/Syntax',
    subject: 'mongolian',
    grade: 11,
    lang: 'mn-Cyrl',
    body: 'TEST mongolian unrelated body about word forms',
    source_ref: 'TEST/MON/01',
  },
  // Different grade — must be invisible to grade=11 queries.
  {
    strand: 'TEST/Mechanics',
    subject: 'physics',
    grade: 10,
    lang: 'mn-Cyrl',
    body: QUERY_PHYSICS,
    source_ref: 'TEST/PHYS/G10',
  },
  // Different lang — must be invisible to mn-Cyrl queries.
  {
    strand: 'TEST/Mechanics',
    subject: 'physics',
    grade: 11,
    lang: 'en',
    body: QUERY_PHYSICS,
    source_ref: 'TEST/PHYS/EN',
  },
];

describe('CurriculumService.retrieve (integration)', () => {
  let db: Db;
  let service: CurriculumService;
  const vendor = new MockLlmVendor();

  beforeAll(async () => {
    const env = loadEnv();
    db = new Db(env);
    service = new CurriculumService(db, new LlmService(vendor));
  });

  afterAll(async () => {
    await db.query(`DELETE FROM curriculum_chunks WHERE source_ref LIKE 'TEST/%'`);
    await db.end();
  });

  beforeEach(async () => {
    await db.query(`DELETE FROM curriculum_chunks WHERE source_ref LIKE 'TEST/%'`);
    const bodies = FIXTURES.map((f) => f.body);
    const vectors = await vendor.embed(bodies);
    for (let i = 0; i < FIXTURES.length; i += 1) {
      const f = FIXTURES[i]!;
      const v = vectors[i]!;
      await db.query(
        `INSERT INTO curriculum_chunks (strand, grade, subject, lang, body, embedding, source_ref)
         VALUES ($1, $2, $3, $4, $5, $6::vector, $7)`,
        [f.strand, f.grade, f.subject, f.lang, f.body, `[${v.join(',')}]`, f.source_ref],
      );
    }
  });

  it('returns only chunks whose subject matches the filter', async () => {
    const results = await service.retrieve({
      lang: 'mn-Cyrl',
      grade: 11,
      subject: 'physics',
      query: QUERY_PHYSICS,
      k: 10,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.subject === 'physics')).toBe(true);
    // The TEST/PHYS/G10 (wrong grade) and TEST/PHYS/EN (wrong lang) must be excluded.
    const refs = new Set(results.map((r) => r.source_ref));
    expect(refs.has('TEST/PHYS/G10')).toBe(false);
    expect(refs.has('TEST/PHYS/EN')).toBe(false);
  });

  it('ranks the exact-body match first (distance ≈ 0)', async () => {
    const results = await service.retrieve({
      lang: 'mn-Cyrl',
      grade: 11,
      subject: 'physics',
      query: QUERY_PHYSICS,
      k: 5,
    });
    expect(results[0]?.source_ref).toBe('TEST/PHYS/01');
    expect(results[0]?.distance).toBeLessThan(1e-6);
    // The unrelated physics chunk should be further away.
    expect(results[1]?.distance ?? Infinity).toBeGreaterThan(results[0]!.distance);
  });

  it('does not leak chunks from other subjects', async () => {
    const results = await service.retrieve({
      lang: 'mn-Cyrl',
      grade: 11,
      subject: 'math',
      query: QUERY_PHYSICS, // physics query against math scope
      k: 10,
    });
    expect(results.every((r) => r.subject === 'math')).toBe(true);
    // None of the physics fixtures (which use the matching embedding) should appear.
    expect(results.some((r) => r.source_ref.startsWith('TEST/PHYS/'))).toBe(false);
  });

  it('does not leak chunks from other grades or langs', async () => {
    const wrongGrade = await service.retrieve({
      lang: 'mn-Cyrl',
      grade: 12, // no fixtures at this grade
      subject: 'physics',
      query: QUERY_PHYSICS,
      k: 10,
    });
    expect(wrongGrade).toHaveLength(0);

    const wrongLang = await service.retrieve({
      lang: 'en',
      grade: 11,
      subject: 'physics',
      query: QUERY_PHYSICS,
      k: 10,
    });
    expect(wrongLang).toHaveLength(1);
    expect(wrongLang[0]?.source_ref).toBe('TEST/PHYS/EN');
  });

  it('rejects out-of-range k', async () => {
    await expect(
      service.retrieve({
        lang: 'mn-Cyrl',
        grade: 11,
        subject: 'physics',
        query: QUERY_PHYSICS,
        k: 0,
      }),
    ).rejects.toThrow(/k must be in/);
    await expect(
      service.retrieve({
        lang: 'mn-Cyrl',
        grade: 11,
        subject: 'physics',
        query: QUERY_PHYSICS,
        k: 51,
      }),
    ).rejects.toThrow(/k must be in/);
  });
});
