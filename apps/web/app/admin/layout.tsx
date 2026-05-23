import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import { PersonaShell, type PersonaNavItem } from '@/components/system/PersonaShell';

const NAV: { key: string; href: string; icon: PersonaNavItem['icon'] }[] = [
  { key: 'home', href: '/admin', icon: 'home' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const tNav = await getTranslations('admin.nav');
  const tShell = await getTranslations('admin');
  const nav: PersonaNavItem[] = NAV.map((n) => ({ ...n, label: tNav(n.key) }));
  return (
    <PersonaShell
      ariaLabel={tShell('navLabel')}
      nav={nav}
      homeHref="/admin"
      avatar={{ tone: 'brass', fallback: 'П', roleLabel: tShell('roleLabel') }}
      desktopTestId="admin-sidebar"
      mobileTestId="admin-mobile-bar"
    >
      {children}
    </PersonaShell>
  );
}
