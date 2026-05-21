import { describe, expect, it } from 'vitest';

import { loadTemplates, renderTemplate, segmentsForUcs2 } from './sms.templates';

describe('SMS templates · UCS-2 segments', () => {
  // Per R-2 / R-10: every Mongolian Cyrillic template must compile to
  // ≤2 segments. This test runs against the rendered worst-case form
  // (long realistic placeholder values).
  const WORST_CASE_PARAMS: Record<string, string> = {
    olympiad: 'XLI Улсын Математикийн Олимпиад',
    student: 'Цэрэн-Очирын Дашдондог-Очиржав',
    child: 'Цэрэн-Очирын Дашдондог-Очиржав',
    time: '09:30',
    venue: 'МУИС-ийн төв байрны 213 тоот',
    score: '745',
    next: 'XLI Улсын Математикийн Олимпиад 2026.06.12',
  };

  it('every template loads', () => {
    const cat = loadTemplates();
    expect(Object.keys(cat).length).toBeGreaterThanOrEqual(7);
  });

  it('every rendered template is ≤2 UCS-2 segments', () => {
    const cat = loadTemplates();
    for (const key of Object.keys(cat) as Array<keyof typeof cat>) {
      const body = renderTemplate(key, WORST_CASE_PARAMS);
      const segs = segmentsForUcs2(body);
      expect(segs, `${key} → "${body}" (${Array.from(body).length} chars)`).toBeLessThanOrEqual(2);
    }
  });

  it('renderTemplate throws on missing placeholder', () => {
    expect(() => renderTemplate('registration-paid', {} as Record<string, string>)).toThrow(
      /missing placeholder/,
    );
  });

  it('segmentsForUcs2 boundaries', () => {
    expect(segmentsForUcs2('а'.repeat(70))).toBe(1);
    expect(segmentsForUcs2('а'.repeat(71))).toBe(2);
    expect(segmentsForUcs2('а'.repeat(134))).toBe(2);
    expect(segmentsForUcs2('а'.repeat(135))).toBe(3);
  });
});
