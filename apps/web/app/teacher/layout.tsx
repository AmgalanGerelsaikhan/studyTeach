import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { PersonaShell, type PersonaNavItem } from '@/components/system/PersonaShell';
import { TeacherModeToggle } from '@/components/teacher/TeacherModeToggle';

const NAV: { key: string; href: string; icon: PersonaNavItem['icon'] }[] = [
  { key: 'students', href: '/teacher', icon: 'users' },
  { key: 'personal', href: '/teacher/personal', icon: 'user' },
  { key: 'academy', href: '/teacher/personal/academy', icon: 'book' },
  { key: 'transcript', href: '/teacher/personal/academy/transcript', icon: 'award' },
  { key: 'olympiads', href: '/teacher/olympiads', icon: 'trophy' },
  { key: 'focus', href: '/teacher/focus', icon: 'target' },
  { key: 'settings', href: '/teacher/settings', icon: 'settings' },
];

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('teacher.nav');
  const nav: PersonaNavItem[] = NAV.map((n) => ({ ...n, label: t(n.key) }));
  return (
    <PersonaShell
      ariaLabel="Teacher"
      nav={nav}
      homeHref="/teacher"
      avatar={{ tone: 'brass', fallback: 'Б', roleLabel: 'Багш' }}
      belowLogo={<TeacherModeToggle />}
      desktopTestId="teacher-sidebar"
      mobileTestId="teacher-mobile-bar"
    >
      {children}
    </PersonaShell>
  );
}
