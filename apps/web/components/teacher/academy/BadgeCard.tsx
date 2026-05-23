import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Certification } from '@studyteach/contracts';

import { StCard, StChip, StCornerBracket, StIcon, StSoyomboFlame } from '@/components/st';

/**
 * Issued CPD badge tile. Server component — pure render off a Certification.
 * Ger Interior visual: brass corner brackets framing a felt surface with the
 * Soyombo flame motif marking the issuance. No interactivity beyond a link
 * back to the originating course.
 *
 * MoE endorsement chip is conditional — until the PRD §11.1 partnership lands,
 * most badges render the "pending" chip and a disclaimer at the page level.
 */
export async function BadgeCard({ cert }: { cert: Certification }) {
  const t = await getTranslations('teacher.academy.transcript');
  const tTracks = await getTranslations('teacher.academy.languageTrack');

  const issuedDate = new Date(cert.issued_at).toISOString().slice(0, 10);

  return (
    <StCard padding="md" className="relative flex h-full flex-col">
      <StCornerBracket corner="tl" />
      <StCornerBracket corner="tr" />
      <StCornerBracket corner="bl" />
      <StCornerBracket corner="br" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StChip tone="brass">{cert.subject}</StChip>
          {cert.language_track !== 'GENERAL' && (
            <StChip tone="sky">{tTracks(cert.language_track)}</StChip>
          )}
          <StChip tone="moss">
            <StIcon name="check" size={11} />
            {t('scoreLabel', { score: cert.score })}
          </StChip>
        </div>
        <div className="shrink-0 opacity-80">
          <StSoyomboFlame size={36} />
        </div>
      </div>

      <h3 className="mt-2 font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
        {cert.course_title}
      </h3>

      <dl
        className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]"
        style={{ color: 'var(--st-ink-3)' }}
      >
        <div className="flex items-center gap-1">
          <StIcon name="award" size={12} color="#836340" />
          <dd>{t('creditChip', { n: cert.cpd_credits })}</dd>
        </div>
        <div className="flex items-center gap-1">
          <StIcon name="clock" size={12} color="#836340" />
          <dd>
            {t('issuedAt')}: {issuedDate}
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        {cert.moe_endorsed ? (
          <StChip tone="moss">{t('moeEndorsed')}</StChip>
        ) : (
          <StChip tone="default">{t('moePending')}</StChip>
        )}
      </div>

      <div className="mt-auto pt-3">
        <Link
          href={`/teacher/personal/academy/${cert.course_id}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: 'var(--st-ember)' }}
        >
          {t('openCourse')}
          <StIcon name="chevron_r" size={12} />
        </Link>
      </div>
    </StCard>
  );
}
