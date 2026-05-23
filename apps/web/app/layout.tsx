import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';

import { ContentPackInstaller } from '@/components/system/ContentPackInstaller';
import { ServiceWorkerRegistrar } from '@/components/system/ServiceWorkerRegistrar';
import { ToastProvider } from '@/components/system/ToastProvider';

import './globals.css';

export const metadata: Metadata = {
  title: 'MozaTeach · Боловсролын эко систем',
  description: 'Mongolia Unified Educational Portal — AI Tutor, EGSh, Olympiad, Teacher Academy.',
  applicationName: 'MozaTeach',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MozaTeach',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#2A1810',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
        <ServiceWorkerRegistrar />
        <ContentPackInstaller />
      </body>
    </html>
  );
}
