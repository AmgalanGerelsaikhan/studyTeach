import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { SmsTemplateKey } from '@studyteach/contracts';

/**
 * Loads the mn-Cyrl SMS template catalog from
 * `apps/api/messages/sms/mn-Cyrl.json`. Templates use `{name}` placeholders.
 *
 * UCS-2 segmenting: at 70 chars per segment (with 67-char continuation),
 * a rendered template must compile to ≤2 segments (140 chars). Tested by
 * sms.templates.test.ts.
 */
let cache: Record<SmsTemplateKey, string> | null = null;

export function loadTemplates(): Record<SmsTemplateKey, string> {
  if (cache) return cache;
  const path = join(process.cwd(), 'messages', 'sms', 'mn-Cyrl.json');
  cache = JSON.parse(readFileSync(path, 'utf8')) as Record<SmsTemplateKey, string>;
  return cache;
}

export function renderTemplate(
  key: SmsTemplateKey,
  params: Record<string, string | number>,
): string {
  const tmpl = loadTemplates()[key];
  if (!tmpl) throw new Error(`unknown SMS template: ${key}`);
  return tmpl.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = params[name];
    if (v === undefined) throw new Error(`SMS template ${key}: missing placeholder {${name}}`);
    return String(v);
  });
}

/**
 * UCS-2 segment counter per GSM 03.38 + 3GPP TS 23.040 §9.2.3.16.
 * Mongolian Cyrillic is outside the GSM-7 default alphabet so every char
 * costs 2 bytes. Single segment = 70 chars; multi = 67 chars/segment.
 */
export function segmentsForUcs2(text: string): number {
  // Use Array.from to count code points (not UTF-16 units) — Cyrillic + Latin
  // are BMP so a length count works, but Array.from is safer for future emoji.
  const cp = Array.from(text).length;
  if (cp <= 70) return 1;
  return Math.ceil(cp / 67);
}

/** Test-only — clear the cache so a test can swap the file mid-suite. */
export function __resetTemplateCacheForTests(): void {
  cache = null;
}
