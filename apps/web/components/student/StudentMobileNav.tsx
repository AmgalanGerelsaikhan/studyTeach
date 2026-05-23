'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Me } from '@studyteach/contracts';

import { StAvatar, StIcon, StSoyomboFlame, type IconName } from '@/components/st';
import { StOfflineBadge } from '@/components/system/StOfflineBadge';
import { logout, me as fetchMe } from '@/lib/api/auth';

type TabKey = 'home' | 'tutor' | 'egsh' | 'olympiad' | 'abroad' | 'psr' | 'focus';

const TABS: { key: TabKey; href: string; icon: IconName }[] = [
  { key: 'home', href: '/student', icon: 'home' },
  { key: 'tutor', href: '/student/ai-tutor', icon: 'chat' },
  { key: 'egsh', href: '/student/egsh', icon: 'target' },
  { key: 'olympiad', href: '/student/olympiad', icon: 'trophy' },
  { key: 'abroad', href: '/student/abroad', icon: 'globe' },
  { key: 'psr', href: '/student/psr', icon: 'shield' },
  { key: 'focus', href: '/student/focus', icon: 'lock' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/student') return pathname === '/student';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Mobile-only top bar + slide-down drawer for the student persona. Shown
 * sm:hidden — at sm+, StudentTopBar's full layout takes over.
 *
 * Right cluster on mobile is intentionally minimal: hamburger + logo +
 * avatar. Tabs, offline status, and auth controls live in the drawer
 * so the bar fits a 320 px viewport without overflow.
 */
export function StudentMobileNav() {
  const t = useTranslations('student.nav');
  const tAuth = useTranslations('auth');
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [authState, setAuthState] = useState<'unknown' | 'guest' | 'authed'>('unknown');
  // Focus management — drop into the first link on open, restore focus to
  // the menu button on close. ESC closes (separate effect below).
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const wasOpenRef = useRef(false);

  // Focus mode is a lock screen — no persona nav while a session is active or
  // the student is on the join surface. The lock screen owns the entire viewport.
  const inFocusMode = pathname.startsWith('/student/focus');

  useEffect(() => {
    fetchMe().then((m) => {
      if (m) {
        setMe(m);
        setAuthState('authed');
      } else {
        setAuthState('guest');
      }
    });
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Focus the first link when the drawer opens; restore focus to the menu
  // button when it closes. Skip on first mount so we don't steal focus.
  useEffect(() => {
    if (open) {
      const id = window.requestAnimationFrame(() => {
        firstLinkRef.current?.focus();
      });
      wasOpenRef.current = true;
      return () => window.cancelAnimationFrame(id);
    }
    if (wasOpenRef.current) {
      menuButtonRef.current?.focus();
      wasOpenRef.current = false;
    }
    return undefined;
  }, [open]);

  // ESC closes the drawer. Window listener so a focused link inside still triggers.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function handleLogout() {
    await logout().catch(() => undefined);
    setMe(null);
    setAuthState('guest');
    setOpen(false);
    router.refresh();
  }

  if (inFocusMode) return null;

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center gap-2 border-b px-3 py-2 sm:hidden"
        style={{
          background: 'rgba(251, 243, 226, 0.95)',
          borderColor: 'rgba(185, 132, 56, 0.35)',
          backdropFilter: 'blur(8px)',
        }}
        data-testid="student-mobile-nav"
      >
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-ml-1 inline-flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ color: 'var(--st-ink)' }}
          data-testid="student-mobile-menu"
        >
          <StIcon name={open ? 'x' : 'menu'} size={20} />
        </button>
        <Link href="/student" aria-label="MozaTeach" className="flex items-center gap-2">
          <StSoyomboFlame size={22} />
          <span className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
            MozaTeach
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <StAvatar initial={me?.primary_role?.[0] ?? 'С'} tone="ember" size={30} />
        </div>
      </header>

      {open && (
        <>
          <button
            type="button"
            aria-label="close menu"
            onClick={() => setOpen(false)}
            className="st-drawer-backdrop fixed inset-0 z-30 bg-black/30 sm:hidden"
          />
          <nav
            aria-label="Student"
            className="st-drawer-in fixed left-0 right-0 top-[52px] z-40 border-b px-3 py-3 sm:hidden"
            style={{
              background: 'var(--st-paper)',
              borderColor: 'rgba(185, 132, 56, 0.4)',
              boxShadow: 'var(--st-shadow-md)',
            }}
            data-testid="student-mobile-drawer"
          >
            <ul className="flex flex-col gap-1">
              {TABS.map((tab, idx) => {
                const active = isActive(pathname, tab.href);
                return (
                  <li key={tab.key}>
                    <Link
                      ref={idx === 0 ? firstLinkRef : undefined}
                      href={tab.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                      className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold"
                      style={
                        active
                          ? { background: 'var(--st-soot)', color: '#FBF3E2' }
                          : { background: 'transparent', color: 'var(--st-ink-2)' }
                      }
                    >
                      <StIcon name={tab.icon} size={16} />
                      {t(tab.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div
              className="mt-3 flex items-center justify-between gap-2 border-t pt-3"
              style={{ borderColor: 'rgba(185, 132, 56, 0.25)' }}
            >
              <StOfflineBadge />
              {authState === 'guest' && (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border px-3 py-1 text-[12px] font-semibold"
                  style={{
                    color: 'var(--st-ink-2)',
                    borderColor: 'rgba(185, 132, 56, 0.4)',
                  }}
                >
                  {tAuth('title')}
                </Link>
              )}
              {authState === 'authed' && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border px-3 py-1 text-[12px] font-semibold"
                  style={{
                    color: 'var(--st-ink-2)',
                    borderColor: 'rgba(185, 132, 56, 0.4)',
                  }}
                >
                  {tAuth('logout')}
                </button>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
