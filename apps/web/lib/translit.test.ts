import { describe, expect, it } from 'vitest';

import { cyrlToLatn, latnToCyrl } from './translit';

describe('latnToCyrl (input preview)', () => {
  it('renders core digraphs', () => {
    expect(latnToCyrl('zhin')).toContain('ж');
    expect(latnToCyrl('chuluu')).toContain('ч');
    expect(latnToCyrl('shal')).toContain('ш');
    expect(latnToCyrl('khan')).toContain('х');
    expect(latnToCyrl('tsogt')).toContain('ц');
  });

  it('renders single letters letter-by-letter', () => {
    // Per-letter map (s→с, a→а, i→и, n→н). The preview is intentionally not
    // context-aware — that's a publication-grade transliteration concern.
    expect(latnToCyrl('sain uu')).toBe('саин уу');
  });

  it('preserves whitespace and punctuation', () => {
    const got = latnToCyrl('Sain uu, bagsh!');
    expect(got).toContain(',');
    expect(got).toContain('!');
    expect(got.startsWith('С')).toBe(true);
  });
});

describe('cyrlToLatn (symmetric preview)', () => {
  it('renders core letters', () => {
    expect(cyrlToLatn('сайн уу')).toBe('sayn uu');
    expect(cyrlToLatn('Ньютон')).toContain('N');
  });

  it('preserves casing on digraph maps', () => {
    expect(cyrlToLatn('Чонос')).toMatch(/^Ch/);
    expect(cyrlToLatn('Шар')).toMatch(/^Sh/);
  });
});
