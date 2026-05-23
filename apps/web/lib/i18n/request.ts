import { getRequestConfig } from 'next-intl/server';

/**
 * Mongolian Cyrillic is the only supported UI language (CLAUDE.md
 * constraint #1, tightened from "primary with Latn/en toggles" to
 * "Cyrl only" in S06). The mn-Latn + en catalogs were removed; no
 * locale negotiation is needed.
 */
const LOCALE = 'mn-Cyrl' as const;

export default getRequestConfig(async () => {
  const messages = (await import(`../../messages/${LOCALE}.json`)).default;
  return { locale: LOCALE, messages };
});
