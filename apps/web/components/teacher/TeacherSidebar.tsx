'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { StAvatar, StDivider, StIcon, StSoyomboFlame, type IconName } from '@/components/st';
import { StOfflineBadge } from '@/components/system/StOfflineBadge';

import { TeacherModeToggle } from './TeacherModeToggle';

type NavKey = 'students' | 'personal' | 'academy' | 'transcript' | 'olympiads' | 'settings';
const NAV: { key: NavKey; href: string; icon: IconName }[] = [
  { key: 'students', href: '/teacher', icon: 'users' },
  { key: 'personal', href: '/teacher/personal', icon: 'user' },
  { key: 'academy', href: '/teacher/personal/academy', icon: 'book' },
  { key: 'transcript', href: '/teacher/personal/academy/transcript', icon: 'award' },
  { key: 'olympiads', href: '/teacher/olympiads', icon: 'trophy' },
  { key: 'settings', href: '/teacher/settings', icon: 'settings' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/teacher') return pathname === '/teacher';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TeacherSidebar() {
  const t = useTranslations('teacher.nav');
  const pathname = usePathname() ?? '/teacher';
  return (
    <aside
      className="hidden w-64 shrink-0 flex-col border-r p-4 md:flex md:min-h-screen"
      style={{
        background: 'var(--st-paper)',
        borderColor: 'rgba(185, 132, 56, 0.35)',
      }}
      data-testid="teacher-sidebar"
    >
      <Link href="/teacher" className="flex items-center gap-2 px-1 py-1">
        <StSoyomboFlame size={24} />
        <span className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
          MozaTeach
        </span>
      </Link>

      <div className="mt-4">
        <TeacherModeToggle />
      </div>

      <StDivider />

      <nav aria-label="Teacher" className="mt-2 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold"
              style={
                active
                  ? { background: 'var(--st-soot)', color: '#FBF3E2' }
                  : { background: 'transparent', color: 'var(--st-ink-2)' }
              }
            >
              <StIcon name={item.icon} size={14} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <StOfflineBadge />
        <div className="flex items-center gap-2">
          <StAvatar initial="Б" tone="brass" size={32} />
          <span className="text-xs" style={{ color: 'var(--st-ink-2)' }}>
            Багш
          </span>
        </div>
      </div>
    </aside>
  );
}
