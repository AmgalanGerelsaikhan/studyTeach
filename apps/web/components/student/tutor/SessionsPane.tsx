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

function isToday(ms: number): boolean {
  const d = new Date(ms);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function SessionsPane({ sessions, activeId, onSelect, onNew }: Props) {
  const t = useTranslations('student.tutor');
  const today = sessions.filter((s) => isToday(s.started_at));
  const earlier = sessions.filter((s) => !isToday(s.started_at));

  return (
    <aside className="hidden lg:block">
      <StCard padding="md">
        <StButton
          type="button"
          size="sm"
          variant="primary"
          onClick={onNew}
          className="w-full"
          data-testid="sessions-new"
        >
          <StIcon name="plus" size={12} />
          {t('newSession')}
        </StButton>

        {sessions.length === 0 ? (
          <p className="mt-3 text-xs" style={{ color: 'var(--st-ink-3)' }}>
            {t('emptySessions')}
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3" data-testid="sessions-list">
            {today.length > 0 && (
              <Section label={t('sessionsToday')}>
                {today.map((s) => (
                  <SessionRow
                    key={s.session_id}
                    session={s}
                    active={s.session_id === activeId}
                    onSelect={() => onSelect(s)}
                  />
                ))}
              </Section>
            )}
            {earlier.length > 0 && (
              <Section label={t('sessionsYesterday')}>
                {earlier.map((s) => (
                  <SessionRow
                    key={s.session_id}
                    session={s}
                    active={s.session_id === activeId}
                    onSelect={() => onSelect(s)}
                  />
                ))}
              </Section>
            )}
          </div>
        )}
      </StCard>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {label}
      </p>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  );
}

function SessionRow({
  session,
  active,
  onSelect,
}: {
  session: LocalTutorSession;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className="w-full rounded-st-sm border px-2.5 py-2 text-left transition-colors"
        style={
          active
            ? {
                background: 'var(--st-paper)',
                color: 'var(--st-ink)',
                borderColor: 'var(--st-ember)',
              }
            : {
                background: 'transparent',
                color: 'var(--st-ink-2)',
                borderColor: 'transparent',
              }
        }
      >
        <span
          className="block text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--st-ink-3)' }}
        >
          {session.subject} · {session.grade}
        </span>
        <span className="mt-0.5 block truncate text-[12px] font-semibold">
          {session.first_user_text ?? '—'}
        </span>
      </button>
    </li>
  );
}
