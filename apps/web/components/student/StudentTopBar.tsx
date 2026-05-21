'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { StAvatar, StIcon, StSoyomboFlame } from '@/components/st';
import { StOfflineBadge } from '@/components/system/StOfflineBadge';

type TabKey = 'home' | 'tutor' | 'egsh' | 'olympiad' | 'abroad';

const TABS: { key: TabKey; href: string }[] = [
  { key: 'home', href: '/' },
  { key: 'tutor', href: '/ai-tutor' },
  { key: 'egsh', href: '/egsh' },
  { key: 'olympiad', href: '/olympiad' },
  { key: 'abroad', href: '/abroad' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentTopBar() {
  const t = useTranslations('student.nav');
  const pathname = usePathname() ?? '/';

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur"
      style={{
        background: 'rgba(251, 243, 226, 0.92)',
        borderColor: 'rgba(185, 132, 56, 0.35)',
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label="studyTeach"
          className="flex items-center gap-2 font-display text-lg font-bold"
          style={{ color: 'var(--st-soot)' }}
        >
          <StSoyomboFlame size={24} />
          <span className="hidden sm:inline">studyTeach</span>
        </Link>

        <nav
          aria-label="Student"
          className="ml-2 flex flex-1 items-center gap-1 overflow-x-auto"
          data-testid="student-tabs"
        >
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
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
          className="rounded-full p-1.5"
          style={{ color: 'var(--st-ink-2)' }}
        >
          <StIcon name="bell" size={18} />
        </button>

        <StAvatar initial="С" tone="ember" size={32} />
      </div>
    </header>
  );
}
