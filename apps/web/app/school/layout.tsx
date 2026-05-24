import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { PersonaShell, type PersonaNavItem } from '@/components/system/PersonaShell';

const NAV: { key: string; href: string; icon: PersonaNavItem['icon'] }[] = [
  { key: 'home', href: '/school', icon: 'home' },
  { key: 'teachers', href: '/school/teachers', icon: 'users' },
];

export default async function SchoolLayout({ children }: { children: ReactNode }) {
  const tNav = await getTranslations('school.nav');
  const tShell = await getTranslations('school');
  const nav: PersonaNavItem[] = NAV.map((n) => ({ ...n, label: tNav(n.key) }));
  return (
    <PersonaShell
      ariaLabel={tShell('navLabel')}
      nav={nav}
      homeHref="/school"
      avatar={{ tone: 'moss', fallback: 'А', roleLabel: tShell('roleLabel') }}
      desktopTestId="school-sidebar"
      mobileTestId="school-mobile-bar"
    >
      {children}
    </PersonaShell>
  );
}
