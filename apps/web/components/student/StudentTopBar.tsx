'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { StIcon, StSoyomboFlame } from '@/components/st';
import { AuthStatus } from '@/components/system/AuthStatus';
import { MeAvatar } from '@/components/system/MeAvatar';
import { StOfflineBadge } from '@/components/system/StOfflineBadge';

type TabKey = 'home' | 'tutor' | 'egsh' | 'olympiad' | 'abroad' | 'psr' | 'focus';

const TABS: { key: TabKey; href: string }[] = [
  { key: 'home', href: '/student' },
  { key: 'tutor', href: '/student/ai-tutor' },
  { key: 'egsh', href: '/student/egsh' },
  { key: 'olympiad', href: '/student/olympiad' },
  { key: 'abroad', href: '/student/abroad' },
  { key: 'psr', href: '/student/psr' },
  { key: 'focus', href: '/student/focus' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/student') return pathname === '/student';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentTopBar() {
  const t = useTranslations('student.nav');
  const pathname = usePathname() ?? '/';

  // Focus mode owns the entire viewport — no persona top bar.
  if (pathname.startsWith('/student/focus')) return null;

  return (
    <header
      className="sticky top-0 z-20 hidden border-b backdrop-blur sm:block"
      style={{
        background: 'rgba(251, 243, 226, 0.92)',
        borderColor: 'rgba(185, 132, 56, 0.35)',
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
        <Link
          href="/student"
          aria-label="MozaTeach"
          className="flex items-center gap-2 font-display text-lg font-bold"
          style={{ color: 'var(--st-soot)' }}
        >
          <StSoyomboFlame size={24} />
          <span className="hidden sm:inline">MozaTeach</span>
        </Link>

        <nav
          aria-label="Student"
          className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-testid="student-tabs"
        >
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="inline-flex min-h-9 whitespace-nowrap items-center rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors sm:px-3.5"
                style={
                  active
                    ? {
                        background: 'var(--st-soot)',
                        color: '#FBF3E2',
                        borderColor: 'var(--st-soot)',
                      }
                    : {
                        background: 'transparent',
                        color: 'var(--st-ink-2)',
                        borderColor: 'transparent',
                      }
                }
              >
                {t(tab.key)}
              </Link>
            );
          })}
        </nav>

        <StOfflineBadge compact />

        <button
          type="button"
          aria-label="Notifications"
          className="hidden h-10 w-10 items-center justify-center rounded-full sm:inline-flex"
          style={{ color: 'var(--st-ink-2)' }}
        >
          <StIcon name="bell" size={18} />
        </button>

        <AuthStatus />

        <MeAvatar tone="ember" size={32} fallback="С" />
      </div>
    </header>
  );
}
