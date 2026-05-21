import { z } from 'zod';

import refusalsJson from './ai-refusals.json';

import type { Locale } from './index';

export const RefusalKey = z.enum([
  'ai-tutor.refusal.exam-mode',
  'ai-tutor.refusal.write-essay',
  'app-coach.refusal.blank-statement',
  'ai-tutor.refusal.non-academic',
]);
export type RefusalKey = z.infer<typeof RefusalKey>;

type Catalog = Record<RefusalKey, Record<z.infer<typeof Locale>, string>>;

const catalog: Catalog = Object.fromEntries(
  RefusalKey.options.map((key) => {
    const entry = (refusalsJson as Record<string, Record<string, string>>)[key];
    if (!entry) throw new Error(`Refusal catalog missing key: ${key}`);
    return [key, entry];
  }),
) as Catalog;

export interface GetRefusalTextOptions {
  /** Replaces `{name}` tokens in the canonical string. Used by `non-academic` for `{topic}`. */
  interpolations?: Record<string, string>;
}

/**
 * Resolves the canonical refusal string for a given key + locale. The catalog
 * is the only sanctioned source — refusal text MUST NOT be paraphrased inline
 * (docs/LOCALIZATION.md §Refusal text). Falls back to mn-Cyrl if the requested
 * locale is missing a translation for a key.
 */
export function getRefusalText(
  key: RefusalKey,
  locale: z.infer<typeof Locale>,
  options: GetRefusalTextOptions = {},
): string {
  const entry = catalog[key];
  const raw = entry[locale] ?? entry['mn-Cyrl'];
  if (!options.interpolations) return raw;
  return raw.replace(/\{(\w+)\}/g, (_match, token: string) => {
    const value = options.interpolations?.[token];
    return value ?? `{${token}}`;
  });
}

export const REFUSAL_KEYS: readonly RefusalKey[] = RefusalKey.options;
