'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { StButton, StCard, StDivider } from '@/components/st';
import { submitPulse } from '@/lib/api/wellbeing';

/**
 * 5-question weekly pulse (PRD §4.7a). Anonymous-by-default — the only
 * identifier sent is an anon_token derived client-side from a per-student
 * secret + the ISO week. The server can verify dedup without identifying.
 *
 * The freetext question is the only path that can trigger a crisis flag.
 * If the student writes something matching the lexicon, the response gets
 * de-anonymised and a counselor at their school is notified. This is
 * disclosed in the consent text rendered above the form.
 */
export function PulseForm({ pulseWeek, anonToken }: { pulseWeek: number; anonToken: string }) {
  const t = useTranslations('student.wellbeing');
  const router = useRouter();
  const [q1, setQ1] = useState(3);
  const [q2, setQ2] = useState(3);
  const [q3, setQ3] = useState(3);
  const [q4, setQ4] = useState(3);
  const [q5, setQ5] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ safety_resources_shown: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitPulse({
        pulse_week: pulseWeek,
        anon_token: anonToken,
        q1_mood: q1,
        q2_sleep: q2,
        q3_connection: q3,
        q4_safety: q4,
        q5_freetext: q5.trim() || null,
      });
      setDone({ safety_resources_shown: result.safety_resources_shown });
    } catch (err) {
      setError(t('submitError'));
      console.error('[wellbeing] submit failed', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <StCard padding="lg" data-testid="wellbeing-thanks">
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('thanksTitle')}
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('thanksBody')}
        </p>
        {done.safety_resources_shown && (
          <>
            <StDivider />
            <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
              {t('safetyTitle')}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
              {t('safetyBody')}
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--st-soot)' }}>
              {t('safetyHotline')}
            </p>
          </>
        )}
      </StCard>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="wellbeing-pulse-form"
      className="flex flex-col gap-4"
    >
      <Likert label={t('q1_mood')} value={q1} onChange={setQ1} />
      <Likert label={t('q2_sleep')} value={q2} onChange={setQ2} />
      <Likert label={t('q3_connection')} value={q3} onChange={setQ3} />
      <Likert label={t('q4_safety')} value={q4} onChange={setQ4} />

      <label className="block">
        <span className="text-sm font-semibold" style={{ color: 'var(--st-ink-2)' }}>
          {t('q5_freetext')}
        </span>
        <textarea
          value={q5}
          onChange={(e) => setQ5(e.target.value)}
          rows={4}
          maxLength={2000}
          className="mt-1 w-full rounded-st-sm border px-3 py-2 text-sm"
          style={{
            borderColor: 'rgba(185, 132, 56, 0.4)',
            background: 'var(--st-paper)',
            color: 'var(--st-ink)',
          }}
        />
      </label>

      {error && (
        <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <StButton type="submit" variant="primary" disabled={submitting}>
          {submitting ? t('submitting') : t('submit')}
        </StButton>
        <button
          type="button"
          onClick={() => router.push('/student')}
          className="text-sm"
          style={{ color: 'var(--st-ink-2)' }}
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

function Likert({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}): JSX.Element {
  return (
    <div>
      <p className="text-sm font-semibold" style={{ color: 'var(--st-ink-2)' }}>
        {label}
      </p>
      <div className="mt-2 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className="flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold"
            style={
              value === n
                ? { background: 'var(--st-soot)', color: '#FBF3E2', borderColor: 'var(--st-soot)' }
                : { color: 'var(--st-ink-2)', borderColor: 'rgba(185, 132, 56, 0.4)' }
            }
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
