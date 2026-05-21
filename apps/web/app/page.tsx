import { getTranslations } from 'next-intl/server';

import {
  StButton,
  StCard,
  StChip,
  StDivider,
  StIcon,
  StMeander,
  StProgress,
  StSoyomboFlame,
  StSubjectGlyph,
} from '@/components/st';

export default async function HomePage() {
  const t = await getTranslations('home');
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <StCard variant="ember" padding="lg" tacked className="overflow-hidden">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: '#F4C99A' }}
        >
          {t('eyebrow')}
        </p>
        <div className="mt-2 flex items-start gap-3">
          <StSoyomboFlame size={32} color="#F4C99A" />
          <h1
            className="font-display text-3xl font-bold leading-tight"
            style={{ color: '#FBF3E2' }}
          >
            {t('greeting')}
          </h1>
        </div>
        <p className="mt-3 max-w-xl text-sm" style={{ color: '#F4E8D1', opacity: 0.9 }}>
          {t('tagline')}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <StButton variant="brass" size="md">
            <StIcon name="play" size={14} />
            {t('phase')}
          </StButton>
          <StChip tone="soot">
            <StIcon name="calendar" size={11} />
            {t('kickoff')}
          </StChip>
        </div>
        <div className="-mb-7 mt-5 -ml-7 -mr-7">
          <StMeander tone="ember" height={12} />
        </div>
      </StCard>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <StCard padding="md">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('stackEyebrow')}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('stack')}
          </p>
          <StDivider />
          <div className="flex flex-wrap gap-2">
            <StChip tone="ember">
              <StIcon name="sparkle" size={11} />
              Next.js 14
            </StChip>
            <StChip tone="brass">NestJS 10</StChip>
            <StChip tone="moss">Postgres 16</StChip>
            <StChip tone="sky">pgvector</StChip>
            <StChip>Redis 7</StChip>
          </div>
        </StCard>

        <StCard padding="md">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--st-ember)' }}
          >
            S00 · SCAFFOLDING
          </p>
          <p
            className="mt-1 font-display text-lg font-semibold"
            style={{ color: 'var(--st-soot)' }}
          >
            E-001 + E-002 + E-006 + E-007
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--st-ink-3)' }}>
            Monorepo · DB · Design system · i18n
          </p>
          <div className="mt-3">
            <StProgress value={50} />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
            4 / 8 sprints planned
          </p>
        </StCard>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3">
        {(['math', 'physics', 'chem', 'mongolian'] as const).map((subject) => (
          <StCard key={subject} padding="tight" className="flex items-center justify-center">
            <StSubjectGlyph subject={subject} size={28} />
          </StCard>
        ))}
      </div>
    </main>
  );
}
