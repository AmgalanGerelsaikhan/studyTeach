'use client';

import { useTranslations } from 'next-intl';

import { StButton, StCard, StIcon } from '@/components/st';
import type { LocalTutorSession } from '@/lib/offline/tutorSessions';

interface Props {
  sessions: LocalTutorSession[];
  activeId: string | null;
  onSelect: (session: LocalTutorSession) => void;
  onNew: () => void;
}

export function SessionsPane({ sessions, activeId, onSelect, onNew }: Props) {
  const t = useTranslations('student.tutor');
  return (
    <aside className="hidden lg:block">
      <StCard padding="md">
        <div className="flex items-center justify-between">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('sessionsTitle')}
          </p>
          <StButton
            type="button"
            size="sm"
            variant="brass"
            onClick={onNew}
            data-testid="sessions-new"
          >
            <StIcon name="plus" size={10} />
            {t('newSession')}
          </StButton>
        </div>
        {sessions.length === 0 ? (
          <p className="mt-3 text-xs" style={{ color: 'var(--st-ink-3)' }}>
            {t('emptySessions')}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5" data-testid="sessions-list">
            {sessions.map((s) => {
              const active = s.session_id === activeId;
              return (
                <li key={s.session_id}>
                  <button
                    type="button"
                    onClick={() => onSelect(s)}
                    aria-current={active ? 'true' : undefined}
                    className="w-full rounded-st-sm px-2.5 py-2 text-left transition-colors"
                    style={
                      active
                        ? { background: 'var(--st-soot)', color: '#FBF3E2' }
                        : { background: 'transparent', color: 'var(--st-ink-2)' }
                    }
                  >
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.1em]">
                      {s.subject} · {s.grade}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px]">
                      {s.first_user_text ?? '—'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </StCard>
    </aside>
  );
}
