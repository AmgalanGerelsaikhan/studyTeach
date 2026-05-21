import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'studyTeach · Боловсролын эко систем',
  description: 'Mongolia Unified Educational Portal — AI Tutor, EGSh, Olympiad, Teacher Academy.',
  applicationName: 'studyTeach',
};

export const viewport: Viewport = {
  themeColor: '#2A1810',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
