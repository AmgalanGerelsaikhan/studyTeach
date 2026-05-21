import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

import type { Locale } from '@studyteach/contracts';

const SUPPORTED: Locale[] = ['mn-Cyrl', 'mn-Latn', 'en'];
const DEFAULT_LOCALE: Locale = 'mn-Cyrl';

function resolveLocale(): Locale {
  const cookieStore = cookies();
  const fromCookie = cookieStore.get('st-locale')?.value;
  if (fromCookie && SUPPORTED.includes(fromCookie as Locale)) return fromCookie as Locale;

  const acceptLanguage = headers().get('accept-language') ?? '';
  for (const part of acceptLanguage.split(',')) {
    const tag = part.split(';')[0]?.trim();
    if (tag && SUPPORTED.includes(tag as Locale)) return tag as Locale;
  }
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = resolveLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
