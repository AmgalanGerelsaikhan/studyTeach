'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { StIcon, type IconName } from '@/components/st';
import { AuthStatus } from '@/components/system/AuthStatus';
import { MeAvatar } from '@/components/system/MeAvatar';
import { MozaLogo } from '@/components/system/MozaLogo';
import { StOfflineBadge } from '@/components/system/StOfflineBadge';

export type PersonaNavItem = {
  key: string;
  href: string;
  icon: IconName;
  label: string;
};

export type PersonaAvatarTone = 'ember' | 'brass' | 'sky' | 'moss';

export interface PersonaShellProps {
  /** Translated nav label shown on the sidebar's `<nav aria-label>`. */
  ariaLabel: string;
  /** Nav items rendered identically in the desktop sidebar and mobile drawer. */
  nav: PersonaNavItem[];
  /** Top-of-sidebar link target (logo). */
  homeHref: string;
  /** Avatar shown bottom-left of sidebar / top-right of mobile bar. */
  avatar: { tone: PersonaAvatarTone; fallback: string; roleLabel: string };
  /** Optional slot under the logo (e.g. TeacherModeToggle). */
  belowLogo?: ReactNode;
  /** Pathname prefixes where the chrome must hide entirely (e.g. focus lock). */
  hideOn?: string[];
  /** data-testid on the desktop sidebar — kept stable for tests. */
  desktopTestId?: string;
  /** data-testid on the mobile bar — kept stable for tests. */
  mobileTestId?: string;
  children: ReactNode;
}

/**
 * Persona chrome — desktop left sidebar + mobile top bar with drawer.
 * One shell, five personas: Student, Teacher, Parent, School, Admin.
 *
 * Desktop (≥ md): 256px sticky sidebar with logo, optional slot, nav,
 * offline badge, avatar. Mobile (< md): top bar with hamburger that
 * opens a slide-down drawer mirroring the nav.
 *
 * If the current pathname matches any `hideOn` prefix the entire shell
 * (and content padding) collapses to nothing — used for student Focus
 * Mode lock screen which owns the full viewport.
 */
export function PersonaShell({
  ariaLabel,
  nav,
  homeHref,
  avatar,
  belowLogo,
  hideOn,
  desktopTestId,
  mobileTestId,
  children,
}: PersonaShellProps) {
  const pathname = usePathname() ?? '/';
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hidden = (hideOn ?? []).some((p) => pathname.startsWith(p));

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (hidden) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileBar
        homeHref={homeHref}
        avatar={avatar}
        open={drawerOpen}
        onToggle={() => setDrawerOpen((v) => !v)}
        testId={mobileTestId}
      />
      <DesktopSidebar
        ariaLabel={ariaLabel}
        nav={nav}
        homeHref={homeHref}
        avatar={avatar}
        belowLogo={belowLogo}
        pathname={pathname}
        testId={desktopTestId}
      />
      {drawerOpen && (
        <MobileDrawer
          ariaLabel={ariaLabel}
          nav={nav}
          pathname={pathname}
          onClose={() => setDrawerOpen(false)}
        />
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}

/**
 * Returns the key of the single nav item that should be marked active.
 * Picks the LONGEST `href` that the current pathname matches — otherwise
 * nested routes like /teacher/personal, /teacher/personal/academy, and
 * /teacher/personal/academy/transcript would all highlight at once.
 */
function resolveActiveKey(pathname: string, nav: PersonaNavItem[]): string | null {
  let best: { key: string; len: number } | null = null;
  for (const item of nav) {
    const isMatch = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!isMatch) continue;
    const len = item.href.length;
    if (!best || len > best.len) best = { key: item.key, len };
  }
  return best?.key ?? null;
}

function DesktopSidebar({
  ariaLabel,
  nav,
  homeHref,
  avatar,
  belowLogo,
  pathname,
  testId,
}: {
  ariaLabel: string;
  nav: PersonaNavItem[];
  homeHref: string;
  avatar: PersonaShellProps['avatar'];
  belowLogo: ReactNode;
  pathname: string;
  testId?: string;
}) {
  const activeKey = resolveActiveKey(pathname, nav);
  return (
    <aside
      className="hidden w-64 shrink-0 flex-col border-r p-4 md:flex md:min-h-screen md:sticky md:top-0"
      style={{
        background: 'var(--st-paper)',
        borderColor: 'rgba(185, 132, 56, 0.35)',
      }}
      data-testid={testId}
    >
      <MozaLogo href={homeHref} size="md" showTagline={false} className="px-1 py-1" />

      {belowLogo && <div className="mt-4">{belowLogo}</div>}

      <nav aria-label={ariaLabel} className="mt-4 flex flex-col gap-1">
        {nav.map((item) => {
          const active = item.key === activeKey;
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
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <StOfflineBadge />
        <div className="flex items-center gap-2">
          <MeAvatar tone={avatar.tone} size={32} fallback={avatar.fallback} />
          <span className="text-xs" style={{ color: 'var(--st-ink-2)' }}>
            {avatar.roleLabel}
          </span>
          <span className="ml-auto">
            <AuthStatus />
          </span>
        </div>
      </div>
    </aside>
  );
}

function MobileBar({
  homeHref,
  avatar,
  open,
  onToggle,
  testId,
}: {
  homeHref: string;
  avatar: PersonaShellProps['avatar'];
  open: boolean;
  onToggle: () => void;
  testId?: string;
}) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-2 border-b px-4 py-2 md:hidden"
      style={{
        background: 'var(--st-paper)',
        borderColor: 'rgba(185, 132, 56, 0.35)',
      }}
      data-testid={testId}
    >
      <button
        type="button"
        aria-label="menu"
        aria-expanded={open}
        onClick={onToggle}
        className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-md"
        style={{ color: 'var(--st-ink)' }}
      >
        <StIcon name={open ? 'x' : 'menu'} size={20} />
      </button>
      <MozaLogo href={homeHref} size="sm" />
      <div className="ml-auto flex items-center gap-1.5">
        <StOfflineBadge compact />
        <AuthStatus />
        <MeAvatar tone={avatar.tone} size={28} fallback={avatar.fallback} />
      </div>
    </header>
  );
}

function MobileDrawer({
  ariaLabel,
  nav,
  pathname,
  onClose,
}: {
  ariaLabel: string;
  nav: PersonaNavItem[];
  pathname: string;
  onClose: () => void;
}) {
  const activeKey = resolveActiveKey(pathname, nav);
  return (
    <>
      <button
        type="button"
        aria-label="close menu"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/30 md:hidden"
      />
      <nav
        aria-label={ariaLabel}
        className="fixed left-0 right-0 top-[52px] z-40 border-b px-4 py-3 md:hidden"
        style={{
          background: 'var(--st-paper)',
          borderColor: 'rgba(185, 132, 56, 0.35)',
          boxShadow: 'var(--st-shadow-md)',
        }}
      >
        <ul className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = item.key === activeKey;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={onClose}
                  className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold"
                  style={
                    active
                      ? { background: 'var(--st-soot)', color: '#FBF3E2' }
                      : { background: 'transparent', color: 'var(--st-ink-2)' }
                  }
                >
                  <StIcon name={item.icon} size={16} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
