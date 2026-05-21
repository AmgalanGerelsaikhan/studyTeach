/**
 * Catalog parity gate (L-8). Every key present in the primary mn-Cyrl
 * catalog MUST exist in mn-Latn and en — next-intl falls back silently
 * otherwise, which would ship English on a Mongolian phone.
 *
 * Test fixture: read all three JSON files and compare flattened key sets.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

function flatten(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    out.push(...flatten(v, key));
  }
  return out;
}

const ROOT = join(__dirname, '..', '..', 'messages');

function load(name: string): Set<string> {
  const raw = readFileSync(join(ROOT, name), 'utf8');
  return new Set(flatten(JSON.parse(raw)));
}

describe('i18n catalog parity', () => {
  const primary = load('mn-Cyrl.json');
  const latin = load('mn-Latn.json');
  const english = load('en.json');

  it('mn-Latn covers every mn-Cyrl key', () => {
    const missing = [...primary].filter((k) => !latin.has(k)).sort();
    expect(missing, `mn-Latn is missing keys:\n${missing.join('\n')}`).toEqual([]);
  });

  it('en covers every mn-Cyrl key', () => {
    const missing = [...primary].filter((k) => !english.has(k)).sort();
    expect(missing, `en is missing keys:\n${missing.join('\n')}`).toEqual([]);
  });

  it('does not include keys missing from the primary catalog (catches drift the other way)', () => {
    const extraLatn = [...latin].filter((k) => !primary.has(k)).sort();
    const extraEn = [...english].filter((k) => !primary.has(k)).sort();
    expect(extraLatn, `mn-Latn has keys absent from mn-Cyrl:\n${extraLatn.join('\n')}`).toEqual([]);
    expect(extraEn, `en has keys absent from mn-Cyrl:\n${extraEn.join('\n')}`).toEqual([]);
  });
});
