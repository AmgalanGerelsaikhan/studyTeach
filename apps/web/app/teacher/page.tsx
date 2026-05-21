import { getTranslations } from 'next-intl/server';

import { StCard, StChip, StIcon } from '@/components/st';

export default async function TeacherHome() {
  const t = await getTranslations('teacher.home');
  const tMode = await getTranslations('teacher.mode');
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <StCard padding="lg">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-ember)' }}
        >
          S06
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>
        <div className="mt-4">
          <StChip tone="soot">
            <StIcon name="users" size={11} />
            {tMode('institutional')}
          </StChip>
        </div>
      </StCard>
    </main>
  );
}
