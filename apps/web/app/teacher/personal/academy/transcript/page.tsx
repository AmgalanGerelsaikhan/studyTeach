import { cookies } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { CpdTranscript } from '@studyteach/contracts';

import { StCard, StIcon, StSoyomboFlame } from '@/components/st';
import { BadgeCard } from '@/components/teacher/academy/BadgeCard';
import { getOwnTranscriptServer } from '@/lib/api/teacher-academy';

/**
 * Teacher's own CPD transcript page (E-026, PRD §4.5).
 *
 * Server component: fetches /teacher-academy/transcript on the Node server
 * with the HttpOnly session cookie forwarded (CLAUDE.md constraint #8).
 *
 * Headline card shows total CPD credits + MoE-endorsed subset (with disclaimer
 * until PRD §11.1 partnership lands). Badge gallery renders one BadgeCard per
 * certification. Empty-state surfaces guidance to enroll/complete a course.
 */
export const dynamic = 'force-dynamic';

export default async function TeacherCpdTranscriptPage() {
  const cookieHeader = cookies().toString();
  const t = await getTranslations('teacher.academy.transcript');

  let data: CpdTranscript | null = null;
  let error = false;
  try {
    data = await getOwnTranscriptServer(cookieHeader);
  } catch {
    error = true;
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
        <StCard padding="lg">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('loadError')}
          </p>
        </StCard>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6" data-testid="cpd-transcript">
      <Link
        href="/teacher/personal/academy"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        <StIcon name="arrow_l" size={13} />
        {t('openCourse')}
      </Link>

      <StCard padding="lg" className="st-page-enter mt-3">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
              {t('heading')}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
              {t('subtitle')}
            </p>
          </div>
          <div className="shrink-0">
            <StSoyomboFlame size={48} />
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <SummaryStat
            label={t('totalCpd')}
            value={data.total_cpd_credits.toString()}
            icon="award"
          />
          <SummaryStat
            label={t('totalCourses')}
            value={data.total_courses_completed.toString()}
            icon="book"
          />
          <SummaryStat
            label={t('moeEndorsedCredits')}
            value={data.moe_endorsed_credits.toString()}
            icon="check"
          />
        </dl>

        <p
          className="mt-3 rounded-st-md border p-2.5 text-[12px]"
          style={{
            borderColor: 'rgba(185, 132, 56, 0.4)',
            background: 'rgba(185, 132, 56, 0.1)',
            color: 'var(--st-brass-dark)',
          }}
        >
          {t('moeDisclaimer')}
        </p>
      </StCard>

      <section className="mt-4">
        {data.certifications.length === 0 ? (
          <StCard padding="lg">
            <p className="text-sm" style={{ color: 'var(--st-ink-2)' }}>
              {t('empty')}
            </p>
          </StCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.certifications.map((cert) => (
              <BadgeCard key={cert.certification_id} cert={cert} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: 'award' | 'book' | 'check';
}) {
  return (
    <div
      className="rounded-st-md border p-3"
      style={{
        borderColor: 'rgba(185, 132, 56, 0.3)',
        background: 'var(--st-felt)',
      }}
    >
      <dt
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        <StIcon name={icon} size={11} color="#8c5f22" />
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
        {value}
      </dd>
    </div>
  );
}
