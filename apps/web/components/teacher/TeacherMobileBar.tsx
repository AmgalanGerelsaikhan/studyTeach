'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { StAvatar, StIcon, StSoyomboFlame, type IconName } from '@/components/st';
import { AuthStatus } from '@/components/system/AuthStatus';
import { StOfflineBadge } from '@/components/system/StOfflineBadge';

type NavKey = 'students' | 'personal' | 'academy' | 'olympiads' | 'settings';
const NAV: { key: NavKey; href: string; icon: IconName }[] = [
  { key: 'students', href: '/teacher', icon: 'users' },
  { key: 'personal', href: '/teacher/personal', icon: 'user' },
  { key: 'academy', href: '/teacher/academy', icon: 'book' },
  { key: 'olympiads', href: '/teacher/olympiads', icon: 'trophy' },
  { key: 'settings', href: '/teacher/settings', icon: 'settings' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/teacher') return pathname === '/teacher';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Mobile-only top bar + drawer for teacher persona. Shown md:hidden;
 * mirrors TeacherSidebar's nav as a tappable drawer (44px touch targets).
 */
export function TeacherMobileBar() {
  const t = useTranslations('teacher.nav');
  const pathname = usePathname() ?? '/teacher';
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center gap-2 border-b px-4 py-2 md:hidden"
        style={{
          background: 'var(--st-paper)',
          borderColor: 'rgba(185, 132, 56, 0.35)',
        }}
        data-testid="teacher-mobile-bar"
      >
        <button
          type="button"
          aria-label="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-md"
          style={{ color: 'var(--st-ink)' }}
        >
          <StIcon name={open ? 'x' : 'chevron_d'} size={18} />
        </button>
        <Link href="/teacher" className="flex items-center gap-2">
          <StSoyomboFlame size={20} />
          <span className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
            studyTeach
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <StOfflineBadge compact />
          <AuthStatus />
          <StAvatar initial="Б" tone="brass" size={28} />
        </div>
      </header>

      {open && (
        <>
          <button
            type="button"
            aria-label="close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
          />
          <nav
            aria-label="Teacher"
            className="fixed left-0 right-0 top-[52px] z-40 border-b px-4 py-3 md:hidden"
            style={{
              background: 'var(--st-paper)',
              borderColor: 'rgba(185, 132, 56, 0.35)',
              boxShadow: 'var(--st-shadow-md)',
            }}
            data-testid="teacher-mobile-drawer"
          >
            <ul className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                      className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold"
                      style={
                        active
                          ? { background: 'var(--st-soot)', color: '#FBF3E2' }
                          : { background: 'transparent', color: 'var(--st-ink-2)' }
                      }
                    >
                      <StIcon name={item.icon} size={16} />
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
