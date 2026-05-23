import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { PersonaShell, type PersonaNavItem } from '@/components/system/PersonaShell';

const NAV: { key: string; href: string; icon: PersonaNavItem['icon'] }[] = [
  { key: 'home', href: '/student', icon: 'home' },
  { key: 'tutor', href: '/student/ai-tutor', icon: 'chat' },
  { key: 'egsh', href: '/student/egsh', icon: 'target' },
  { key: 'olympiad', href: '/student/olympiad', icon: 'trophy' },
  { key: 'abroad', href: '/student/abroad', icon: 'globe' },
  { key: 'psr', href: '/student/psr', icon: 'shield' },
  { key: 'focus', href: '/student/focus', icon: 'lock' },
];

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('student.nav');
  const nav: PersonaNavItem[] = NAV.map((n) => ({ ...n, label: t(n.key) }));
  return (
    <PersonaShell
      ariaLabel="Student"
      nav={nav}
      homeHref="/student"
      avatar={{ tone: 'ember', fallback: 'С', roleLabel: 'Сурагч' }}
      hideOn={['/student/focus']}
      desktopTestId="student-sidebar"
      mobileTestId="student-mobile-nav"
    >
      {children}
    </PersonaShell>
  );
}
