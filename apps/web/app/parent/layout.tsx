import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { ParentChrome } from '@/components/parent/ParentChrome';
import { PersonaShell, type PersonaNavItem } from '@/components/system/PersonaShell';

const NAV: { key: string; href: string; icon: PersonaNavItem['icon'] }[] = [
  { key: 'home', href: '/parent', icon: 'home' },
  { key: 'link', href: '/parent/link', icon: 'plus' },
  { key: 'settings', href: '/parent/settings', icon: 'settings' },
  { key: 'audit', href: '/parent/audit', icon: 'eye' },
];

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const tNav = await getTranslations('parent.nav');
  const tShell = await getTranslations('parent');
  const nav: PersonaNavItem[] = NAV.map((n) => ({ ...n, label: tNav(n.key) }));
  return (
    <PersonaShell
      ariaLabel={tShell('navLabel')}
      nav={nav}
      homeHref="/parent"
      avatar={{ tone: 'sky', fallback: 'Э', roleLabel: tShell('roleLabel') }}
      desktopTestId="parent-sidebar"
      mobileTestId="parent-mobile-bar"
    >
      <ParentChrome>{children}</ParentChrome>
    </PersonaShell>
  );
}
