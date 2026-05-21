import { getTranslations } from 'next-intl/server';

import { ChildSelector } from '@/components/parent/ChildSelector';
import { SmsPreview } from '@/components/parent/SmsPreview';
import { StCard, StChip, StIcon } from '@/components/st';

export default async function ParentHome() {
  const t = await getTranslations('parent.home');
  const tChild = await getTranslations('parent.child');
  return (
    <div className="flex flex-col gap-4" data-testid="parent-home">
      <div>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-ember)' }}
        >
          P1 · USSD-ready
        </p>
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>
      </div>

      <ChildSelector
        label={tChild('selectLabel')}
        defaultId="ch-1"
        children={[
          { id: 'ch-1', name: 'Чимгээ', initial: 'Ч', grade: '10а' },
          { id: 'ch-2', name: 'Болор', initial: 'Б', grade: '7в' },
        ]}
      />

      <StCard padding="md">
        <div className="flex items-center gap-2">
          <StChip tone="moss">
            <StIcon name="award" size={11} />
            92 / 100
          </StChip>
          <StChip tone="brass">
            <StIcon name="calendar" size={11} />
            2026-06-10
          </StChip>
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--st-ink-2)' }}>
          Математикийн дунд шалгалт · ахиц 12%
        </p>
      </StCard>

      <SmsPreview title={t('smsPreview')} body={t('smsBody')} />
    </div>
  );
}
