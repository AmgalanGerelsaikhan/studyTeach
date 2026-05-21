'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Me } from '@studyteach/contracts';

import { logout, me as fetchMe } from '@/lib/api/auth';

/**
 * Top-bar auth chip. Single fetch of /me on mount so persona routes know
 * whether to surface "Нэвтрэх" or "Гарах". The fetch is fire-and-forget —
 * we don't block the page render on it.
 */
export function AuthStatus() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [state, setState] = useState<'unknown' | 'guest' | 'authed'>('unknown');
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetchMe().then((m) => {
      if (m) {
        setMe(m);
        setState('authed');
      } else {
        setState('guest');
      }
    });
  }, []);

  async function handleLogout() {
    await logout().catch(() => undefined);
    setMe(null);
    setState('guest');
    router.refresh();
  }

  if (state === 'unknown') {
    return <span aria-hidden className="h-5 w-12" data-testid="auth-status-loading" />;
  }
  if (state === 'guest') {
    return (
      <Link
        href="/login"
        className="rounded-full border px-3 py-1 text-[12px] font-semibold"
        style={{
          color: 'var(--st-ink-2)',
          borderColor: 'rgba(185, 132, 56, 0.4)',
        }}
        data-testid="auth-login-link"
      >
        {t('title')}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border px-3 py-1 text-[12px] font-semibold"
      style={{
        color: 'var(--st-ink-2)',
        borderColor: 'rgba(185, 132, 56, 0.4)',
      }}
      data-testid="auth-logout-button"
      aria-label={`${t('logout')} (${me?.primary_role ?? ''})`}
    >
      {t('logout')}
    </button>
  );
}
