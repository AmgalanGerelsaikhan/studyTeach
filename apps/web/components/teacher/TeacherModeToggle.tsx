'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

const STORAGE_KEY = 'st-teacher-mode';

type Mode = 'institutional' | 'personal';

function modeForPath(pathname: string): Mode {
  return pathname.startsWith('/teacher/personal') ? 'personal' : 'institutional';
}

export function TeacherModeToggle() {
  const router = useRouter();
  const pathname = usePathname() ?? '/teacher';
  const current = modeForPath(pathname);
  const t = useTranslations('teacher.mode');

  // Persist the most recent mode so a deep-link to /teacher/personal sticks
  // across reloads even before the user touches the toggle again.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, current);
    } catch {
      // Storage may be blocked (private mode); ignore.
    }
  }, [current]);

  function switchTo(mode: Mode) {
    if (mode === current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignored
    }
    router.push(mode === 'personal' ? '/teacher/personal' : '/teacher');
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="inline-flex rounded-full p-1"
      style={{ background: 'var(--st-paper-2)' }}
    >
      <button
        type="button"
        onClick={() => switchTo('institutional')}
        aria-pressed={current === 'institutional'}
        data-testid="teacher-mode-institutional"
        className="rounded-full px-3 py-1 text-[12px] font-semibold transition-colors"
        style={
          current === 'institutional'
            ? { background: 'var(--st-soot)', color: '#FBF3E2' }
            : { background: 'transparent', color: 'var(--st-ink-2)' }
        }
      >
        {t('institutional')}
      </button>
      <button
        type="button"
        onClick={() => switchTo('personal')}
        aria-pressed={current === 'personal'}
        data-testid="teacher-mode-personal"
        className="rounded-full px-3 py-1 text-[12px] font-semibold transition-colors"
        style={
          current === 'personal'
            ? {
                background:
                  'linear-gradient(180deg, var(--st-brass) 0%, var(--st-brass-dark) 100%)',
                color: 'var(--st-soot)',
              }
            : { background: 'transparent', color: 'var(--st-ink-2)' }
        }
      >
        {t('personal')}
      </button>
    </div>
  );
}
