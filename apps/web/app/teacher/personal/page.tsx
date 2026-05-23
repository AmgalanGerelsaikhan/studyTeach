import { getTranslations } from 'next-intl/server';

import { StCard, StChip, StIcon } from '@/components/st';

export default async function TeacherPersonalHome() {
  const t = await getTranslations('teacher.personalHome');
  const tMode = await getTranslations('teacher.mode');
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <StCard padding="lg">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>
        <div className="mt-4">
          <StChip tone="brass">
            <StIcon name="user" size={11} />
            {tMode('personal')}
          </StChip>
        </div>
      </StCard>
    </main>
  );
}
