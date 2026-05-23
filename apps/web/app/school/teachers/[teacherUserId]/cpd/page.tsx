import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { CpdTranscript } from '@studyteach/contracts';

import { StCard, StChip, StIcon } from '@/components/st';
import { BadgeCard } from '@/components/teacher/academy/BadgeCard';
import { getTeacherTranscriptServer } from '@/lib/api/teacher-academy';
import { ApiError } from '@/lib/api/base';

/**
 * School-admin view of a teacher's CPD transcript (E-026, PRD §4.5).
 *
 * Server component: fetches /teacher-academy/teachers/:id/transcript on the
 * Node server with the HttpOnly session cookie forwarded. The API enforces
 * the org match + writes an audit_log row on every successful read
 * (CertificationService.transcriptForRequester). 403 here means cross-org —
 * the RolesGuard / certification service rejected the read.
 */
export const dynamic = 'force-dynamic';

export default async function SchoolAdminTeacherCpdPage({
  params,
}: {
  params: { teacherUserId: string };
}) {
  const teacherId = Number(params.teacherUserId);
  if (!Number.isInteger(teacherId) || teacherId <= 0) return notFound();

  const cookieHeader = cookies().toString();
  const t = await getTranslations('teacher.academy.adminCpd');
  const tTranscript = await getTranslations('teacher.academy.transcript');

  let data: CpdTranscript | null = null;
  let forbidden = false;
  let error = false;
  try {
    data = await getTeacherTranscriptServer(teacherId, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) forbidden = true;
    else if (err instanceof ApiError && err.status === 404) return notFound();
    else error = true;
  }

  if (forbidden) {
    return (
      <main className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <StCard padding="lg">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('forbidden')}
          </p>
        </StCard>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <StCard padding="lg">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('loadError')}
          </p>
        </StCard>
      </main>
    );
  }

  return (
    <main
      className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6"
      data-testid="admin-cpd-transcript"
    >
      <Link
        href="/school"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {t('back')}
      </Link>

      <StCard padding="lg" className="mt-3">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('heading')}
        </h1>
        <p
          className="mt-2 rounded-st-md border p-2.5 text-[12px]"
          style={{
            borderColor: 'rgba(185, 132, 56, 0.4)',
            background: 'rgba(185, 132, 56, 0.1)',
            color: 'var(--st-brass-dark)',
          }}
        >
          {t('viewingAs')}
        </p>

        <dl className="mt-3 flex flex-wrap items-center gap-2">
          <StChip tone="brass">
            <StIcon name="award" size={11} />
            {tTranscript('totalCpd')}: {data.total_cpd_credits}
          </StChip>
          <StChip tone="default">
            <StIcon name="book" size={11} />
            {tTranscript('totalCourses')}: {data.total_courses_completed}
          </StChip>
          <StChip tone="moss">
            <StIcon name="check" size={11} />
            {tTranscript('moeEndorsedCredits')}: {data.moe_endorsed_credits}
          </StChip>
        </dl>
      </StCard>

      <section className="mt-4">
        {data.certifications.length === 0 ? (
          <StCard padding="lg">
            <p className="text-sm" style={{ color: 'var(--st-ink-2)' }}>
              {tTranscript('empty')}
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
