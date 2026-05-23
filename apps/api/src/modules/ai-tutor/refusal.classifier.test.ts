import { describe, expect, it } from 'vitest';

import { classifyRefusal } from './refusal.classifier';

describe('classifyRefusal', () => {
  it('hard-locks on exam mode regardless of user text', () => {
    expect(
      classifyRefusal({
        userText: 'Ньютоны хоёрдугаар хууль гэж юу вэ?',
        inActiveMockTest: true,
      }),
    ).toBe('ai-tutor.refusal.exam-mode');
  });

  it('refuses write-my-essay (en)', () => {
    expect(
      classifyRefusal({
        userText: 'Please write my essay about Mongolian history',
        inActiveMockTest: false,
      }),
    ).toBe('ai-tutor.refusal.write-essay');
  });

  it('refuses write-my-essay (mn-Cyrl)', () => {
    expect(
      classifyRefusal({
        userText: 'Монголын түүхийн талаар эссэ бичээч.',
        inActiveMockTest: false,
      }),
    ).toBe('ai-tutor.refusal.write-essay');
  });

  it('refuses blank personal-statement requests (en)', () => {
    expect(
      classifyRefusal({
        userText: 'Can you write my personal statement for me?',
        inActiveMockTest: false,
      }),
    ).toBe('app-coach.refusal.blank-statement');
  });

  it('refuses blank personal-statement requests (mn-Cyrl)', () => {
    expect(
      classifyRefusal({
        userText: 'Хувийн мэдэгдлээ бичээч.',
        inActiveMockTest: false,
      }),
    ).toBe('app-coach.refusal.blank-statement');
  });

  it('refuses bare greetings as non-academic chitchat', () => {
    for (const greeting of ['Сайн уу', 'Сайн байна уу!', 'hello', 'hey', "what's up?"]) {
      expect(
        classifyRefusal({ userText: greeting, inActiveMockTest: false }),
        `greeting: ${greeting}`,
      ).toBe('ai-tutor.refusal.non-academic');
    }
  });

  it('does NOT refuse legitimate academic questions', () => {
    const allowed = [
      'Ньютоны хоёрдугаар хууль гэж юу вэ?',
      'Квадрат тэгшитгэлийг яаж бодох вэ?',
      'Vieta теоремыг тайлбарлаарай.',
      'Эссэ бичих ямар бүтэцтэй байх ёстой вэ?', // about essay structure — not "write my essay"
      'Хувийн мэдэгдэл гэж юу вэ?', // explains the concept — not "write my personal statement"
      'Сайн уу, надад квадрат тэгшитгэлийн жишээ хэрэгтэй байна.', // greeting WITH follow-up
    ];
    for (const text of allowed) {
      expect(classifyRefusal({ userText: text, inActiveMockTest: false }), text).toBeNull();
    }
  });

  it('returns null on empty input', () => {
    expect(classifyRefusal({ userText: '', inActiveMockTest: false })).toBeNull();
    expect(classifyRefusal({ userText: '   ', inActiveMockTest: false })).toBeNull();
  });
});
