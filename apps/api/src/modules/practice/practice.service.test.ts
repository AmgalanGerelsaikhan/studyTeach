/**
 * Integration — real PG. Uses TEST-PR-/ source fixtures so it doesn't
 * collide with the curated G11 seed.
 */
import 'dotenv/config';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';

import { PracticeService } from './practice.service';

describe('PracticeService.find (integration)', () => {
  let db: Db;
  let service: PracticeService;

  beforeAll(() => {
    db = new Db(loadEnv());
    service = new PracticeService(db);
  });

  afterAll(async () => {
    await db.query(`DELETE FROM practice_problems WHERE prompt LIKE 'TEST-PR-%'`);
    await db.end();
  });

  beforeEach(async () => {
    await db.query(`DELETE FROM practice_problems WHERE prompt LIKE 'TEST-PR-%'`);
    await db.query(
      `INSERT INTO practice_problems (strand, grade, subject, lang, prompt, answer_key, difficulty)
       VALUES
         ('TEST-Mech', 11, 'physics',  'mn-Cyrl', 'TEST-PR-P1', 'a', 1),
         ('TEST-Mech', 11, 'physics',  'mn-Cyrl', 'TEST-PR-P2', 'a', 3),
         ('TEST-Alg',  11, 'math',     'mn-Cyrl', 'TEST-PR-M1', 'a', 2),
         ('TEST-Alg',  11, 'math',     'en',      'TEST-PR-M1en','a', 2),
         ('TEST-Mech', 10, 'physics',  'mn-Cyrl', 'TEST-PR-G10', 'a', 1)`,
    );
  });

  it('returns only problems matching lang+subject+grade', async () => {
    const got = await service.find({ lang: 'mn-Cyrl', subject: 'physics', grade: 11, k: 10 });
    expect(got.map((p) => p.prompt).sort()).toEqual(
      expect.arrayContaining(['TEST-PR-P1', 'TEST-PR-P2']),
    );
    expect(
      got.every((p) => p.lang === 'mn-Cyrl' && p.subject === 'physics' && p.grade === 11),
    ).toBe(true);
  });

  it('honors strand filter when present', async () => {
    const got = await service.find({
      lang: 'mn-Cyrl',
      subject: 'physics',
      grade: 11,
      strand: 'TEST-Mech',
      k: 10,
    });
    expect(got.every((p) => p.strand === 'TEST-Mech')).toBe(true);
    expect(got.length).toBe(2);
  });

  it('orders by difficulty ascending', async () => {
    const got = await service.find({ lang: 'mn-Cyrl', subject: 'physics', grade: 11, k: 5 });
    const ourRows = got.filter((p) => p.prompt.startsWith('TEST-PR-'));
    expect(ourRows.map((p) => p.difficulty)).toEqual([...ourRows.map((p) => p.difficulty)].sort());
  });

  it('caps results at k', async () => {
    const got = await service.find({ lang: 'mn-Cyrl', subject: 'physics', grade: 11, k: 1 });
    expect(got).toHaveLength(1);
  });

  it('rejects out-of-range k', async () => {
    await expect(
      service.find({ lang: 'mn-Cyrl', subject: 'physics', grade: 11, k: 0 }),
    ).rejects.toThrow(/k must be in/);
  });
});
