'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { StIcon, StSoyomboFlame, type IconName } from '@/components/st';
import { AuthStatus } from '@/components/system/AuthStatus';
import { MeAvatar } from '@/components/system/MeAvatar';
import { StOfflineBadge } from '@/components/system/StOfflineBadge';

type NavKey =
  | 'students'
  | 'personal'
  | 'academy'
  | 'transcript'
  | 'olympiads'
  | 'focus'
  | 'settings';
const NAV: { key: NavKey; href: string; icon: IconName }[] = [
  { key: 'students', href: '/teacher', icon: 'users' },
  { key: 'personal', href: '/teacher/personal', icon: 'user' },
  { key: 'academy', href: '/teacher/personal/academy', icon: 'book' },
  { key: 'transcript', href: '/teacher/personal/academy/transcript', icon: 'award' },
  { key: 'olympiads', href: '/teacher/olympiads', icon: 'trophy' },
  { key: 'focus', href: '/teacher/focus', icon: 'target' },
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
  // Refs for focus management — focus first nav link on open, return to
  // the menu button on close. Ger Interior keyboard-nav AA target.
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  // Focus the first link when the drawer opens; restore focus to the menu
  // button when it closes. Skip on first mount so we don't steal focus.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open) {
      // Defer one frame so the link is mounted in the DOM.
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

  // ESC closes the drawer. Window listener so it works regardless of focus
  // (modal-style behaviour without a full portal/focus-trap library).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

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
          ref={menuButtonRef}
          type="button"
          aria-label="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-md"
          style={{ color: 'var(--st-ink)' }}
        >
          <StIcon name={open ? 'x' : 'menu'} size={20} />
        </button>
        <Link href="/teacher" className="flex items-center gap-2">
          <StSoyomboFlame size={20} />
          <span className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
            MozaTeach
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <StOfflineBadge compact />
          <AuthStatus />
          <MeAvatar tone="brass" size={28} fallback="Б" />
        </div>
      </header>

      {open && (
        <>
          <button
            type="button"
            aria-label="close menu"
            onClick={() => setOpen(false)}
            className="st-drawer-backdrop fixed inset-0 z-30 bg-black/30 md:hidden"
          />
          <nav
            aria-label="Teacher"
            className="st-drawer-in fixed left-0 right-0 top-[52px] z-40 border-b px-4 py-3 md:hidden"
            style={{
              background: 'var(--st-paper)',
              borderColor: 'rgba(185, 132, 56, 0.35)',
              boxShadow: 'var(--st-shadow-md)',
            }}
            data-testid="teacher-mobile-drawer"
          >
            <ul className="flex flex-col gap-1">
              {NAV.map((item, idx) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.key}>
                    <Link
                      ref={idx === 0 ? firstLinkRef : undefined}
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
