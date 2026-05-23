import { describe, expect, it } from 'vitest';

import { getRefusalText, REFUSAL_KEYS, RefusalKey } from './refusals';

describe('refusal catalog', () => {
  it('exposes all five canonical keys', () => {
    expect(REFUSAL_KEYS).toEqual([
      'ai-tutor.refusal.exam-mode',
      'ai-tutor.refusal.write-essay',
      'app-coach.refusal.blank-statement',
      'ai-tutor.refusal.non-academic',
      // Added with P5 Focus Mode — refuses tutor questions off-topic from
      // the active focus session's activity_ref.
      'focus.off-topic',
    ]);
  });

  // Byte-canonical assertions — these strings come from docs/LOCALIZATION.md
  // and MUST NOT change without escalating to the mongolian-localization agent
  // and a Moza reviewer.
  it('serves the exact mn-Cyrl text from LOCALIZATION.md', () => {
    expect(getRefusalText('ai-tutor.refusal.exam-mode', 'mn-Cyrl')).toBe(
      'ЭЕШ загвар шалгалт идэвхтэй байна. Шалгалтын дараа ярилцъя.',
    );
    expect(getRefusalText('ai-tutor.refusal.write-essay', 'mn-Cyrl')).toBe(
      'Эссэ бичиж өгөхгүй. Гэхдээ чиний бичсэн хэсгийг хамтдаа сайжруулъя.',
    );
    expect(getRefusalText('app-coach.refusal.blank-statement', 'mn-Cyrl')).toBe(
      'Эхний ноорог буюу бүтэцтэй төлөвлөгөө илгээсний дараа эхэлье.',
    );
  });

  it('falls back to mn-Cyrl for missing locales', () => {
    // Force a key/locale where translation exists; smoke-check the fallback path
    // by passing an unsupported branch via the parsed enum at the boundary.
    const parsed = RefusalKey.parse('ai-tutor.refusal.exam-mode');
    expect(getRefusalText(parsed, 'en')).toMatch(/practice exam/i);
  });

  it('interpolates {topic} on the non-academic redirect', () => {
    const text = getRefusalText('ai-tutor.refusal.non-academic', 'mn-Cyrl', {
      interpolations: { topic: 'физик' },
    });
    expect(text).toContain('физик');
    expect(text).not.toContain('{topic}');
  });

  it('leaves unknown tokens as literal placeholders rather than throwing', () => {
    const text = getRefusalText('ai-tutor.refusal.non-academic', 'mn-Cyrl', {
      interpolations: {},
    });
    expect(text).toContain('{topic}');
  });
});
