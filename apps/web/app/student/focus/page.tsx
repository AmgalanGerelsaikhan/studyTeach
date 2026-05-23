import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { StCard, StSoyomboFlame } from '@/components/st';
import { FocusJoinForm } from '@/components/student/focus/FocusJoinForm';
import { FocusLockScreen } from '@/components/student/focus/FocusLockScreen';
import { getActiveFocusSessionServer } from '@/lib/api/focus';

/**
 * Student Focus Mode — server component (PRD §4.6).
 *
 * Single source of truth: `GET /focus/me/active` decides whether to render
 * the lock screen (active session) or the join surface (no active session).
 * Both branches are rendered server-side so a 3G first-load returns real
 * HTML, not a client-side loading shell.
 */
export const dynamic = 'force-dynamic';

export default async function StudentFocusPage() {
  const cookieHeader = cookies().toString();
  const t = await getTranslations('student.focus');

  let active = null;
  let loadError = false;
  try {
    active = await getActiveFocusSessionServer(cookieHeader);
  } catch {
    loadError = true;
  }

  if (active) {
    return <FocusLockScreen session={active} />;
  }

  // Empty-state + join form. Centered card layout, no nav (the StudentTopBar
  // / StudentMobileNav both early-return on /student/focus).
  return (
    <main
      className="min-h-screen w-full"
      style={{ background: 'var(--st-cream)' }}
      data-testid="student-focus-empty"
    >
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <StSoyomboFlame size={22} />
          <span className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
            MozaTeach
          </span>
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-8 pt-2 sm:max-w-lg">
        <StCard padding="lg" className="text-center">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('title')}
          </p>
          <p className="mt-3 text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('noActive')}
          </p>
          {loadError && (
            <p className="mt-2 text-xs" role="alert" style={{ color: 'var(--st-cinnabar)' }}>
              {t('joinError')}
            </p>
          )}
        </StCard>

        <StCard padding="lg">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('joinTitle')}
          </p>
          <div className="mt-4">
            <FocusJoinForm />
          </div>
        </StCard>
      </div>
    </main>
  );
}
