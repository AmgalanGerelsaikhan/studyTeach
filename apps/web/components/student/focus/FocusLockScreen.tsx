import { getTranslations } from 'next-intl/server';
import type { ActiveFocusSession, FocusActivityRef } from '@studyteach/contracts';

import { StCard, StChip, StIcon, StLinkButton, StSoyomboFlame } from '@/components/st';

import { FocusExitButton } from './FocusExitButton';

// Student lock screen — server component. Renders the active activity card,
// a single CTA into the assigned surface, and the small "Гарах" exit.
//
// `activity_ref` is a discriminated union: we narrow on `kind` to build both
// the human-readable detail line and the right deep-link target.

function detailFor(ref: FocusActivityRef): string {
  switch (ref.kind) {
    case 'AI_TUTOR':
      return ref.topic;
    case 'EGSH_PRACTICE':
      return `${ref.subject} · ${ref.strand}`;
    case 'ACADEMY_LESSON':
      return `#${ref.lesson_id}`;
    case 'CURRICULUM_READING':
      return `#${ref.chunk_id}`;
  }
}

function ctaHref(ref: FocusActivityRef): string {
  switch (ref.kind) {
    case 'AI_TUTOR':
      return `/student/ai-tutor?focus_topic=${encodeURIComponent(ref.topic)}`;
    case 'EGSH_PRACTICE':
      return `/student/egsh?subject=${encodeURIComponent(ref.subject)}`;
    case 'ACADEMY_LESSON':
      // No student-side academy surface yet (P1 follow-up).
      return '#';
    case 'CURRICULUM_READING':
      // No chunk view yet (P1 follow-up).
      return '#';
  }
}

function formatEndsAt(iso: string): string {
  // Mongolian locale isn't critical for a timestamp; we render it as
  // YYYY-MM-DD HH:mm in the viewer's local clock. The contract is UTC ISO.
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function FocusLockScreen({ session }: { session: ActiveFocusSession }) {
  const t = await getTranslations('student.focus');
  const tActivity = await getTranslations('student.focus.activity');

  return (
    <main
      className="min-h-screen w-full"
      style={{ background: 'var(--st-cream)' }}
      data-testid="student-focus-lock"
    >
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <StSoyomboFlame size={22} />
          <span className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
            MozaTeach
          </span>
        </div>
        <FocusExitButton />
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-8 pt-2 sm:max-w-lg">
        <StCard
          padding="lg"
          style={{
            background: 'var(--st-paper)',
            borderColor: 'var(--st-brass-dark)',
            borderWidth: 2,
            boxShadow: 'var(--st-shadow-md)',
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <StChip tone="brass">
              <StIcon name="target" size={12} />
              {tActivity(session.activity_kind)}
            </StChip>
            <StChip tone="ember">
              <StIcon name="lock" size={12} />
              {t('title')}
            </StChip>
          </div>

          <h1
            className="mt-3 font-display text-xl font-bold sm:text-2xl"
            style={{ color: 'var(--st-soot)' }}
          >
            {detailFor(session.activity_ref)}
          </h1>

          <p className="mt-3 text-xs" style={{ color: 'var(--st-ink-3)' }}>
            {t('endsAt', { time: formatEndsAt(session.scheduled_end) })}
          </p>

          <div className="mt-5">
            <StLinkButton
              href={ctaHref(session.activity_ref)}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {t('startCta')}
            </StLinkButton>
          </div>
        </StCard>
      </div>
    </main>
  );
}
