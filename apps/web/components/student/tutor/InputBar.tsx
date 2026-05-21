'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import { StButton, StChip, StIcon } from '@/components/st';
import { latnToCyrl } from '@/lib/translit';

type Script = 'mn-Cyrl' | 'mn-Latn';

interface Props {
  disabled: boolean;
  onSubmit: (text: string) => void;
}

const LS_KEY = 'st.tutor.inputScript';

export function InputBar({ disabled, onSubmit }: Props) {
  const t = useTranslations('student.tutor');
  const [script, setScript] = useState<Script>('mn-Cyrl');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored === 'mn-Cyrl' || stored === 'mn-Latn') setScript(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, script);
  }, [script]);

  const rendered = useMemo(
    () => (script === 'mn-Latn' ? latnToCyrl(draft) : draft),
    [script, draft],
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = rendered.trim();
    if (!text || disabled) return;
    onSubmit(text);
    setDraft('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t px-4 py-3"
      style={{ borderColor: 'rgba(185, 132, 56, 0.35)', background: 'var(--st-paper)' }}
      data-testid="tutor-input"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('scriptToggle')}
        </span>
        <ScriptToggle
          value={script}
          onChange={setScript}
          cyrlLabel={t('scriptCyrl')}
          latnLabel={t('scriptLatn')}
        />
      </div>
      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent);
            }
          }}
          rows={2}
          disabled={disabled}
          placeholder={t('inputPlaceholder')}
          className="w-full resize-none rounded-st-md px-3 py-2 text-sm focus:outline-none"
          style={{
            background: 'var(--st-paper)',
            color: 'var(--st-ink)',
            border: '1px solid rgba(185, 132, 56, 0.4)',
          }}
          data-testid="tutor-textarea"
          aria-label={t('inputPlaceholder')}
        />
        <StButton type="submit" variant="brass" size="md" disabled={disabled || !rendered.trim()}>
          <StIcon name="arrow_r" size={14} />
          {disabled ? t('sending') : t('send')}
        </StButton>
      </div>
      {script === 'mn-Latn' && draft.length > 0 && (
        <div className="mt-2 flex items-start gap-2">
          <StChip tone="default">{t('previewLabel')}</StChip>
          <p
            className="flex-1 text-sm"
            style={{ color: 'var(--st-ink-2)' }}
            data-testid="tutor-preview"
          >
            {rendered}
          </p>
        </div>
      )}
    </form>
  );
}

function ScriptToggle({
  value,
  onChange,
  cyrlLabel,
  latnLabel,
}: {
  value: Script;
  onChange: (next: Script) => void;
  cyrlLabel: string;
  latnLabel: string;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex overflow-hidden rounded-full border"
      style={{ borderColor: 'rgba(185, 132, 56, 0.4)' }}
    >
      {(['mn-Cyrl', 'mn-Latn'] as const).map((s) => {
        const active = s === value;
        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-pressed={active}
            data-testid={`script-${s === 'mn-Cyrl' ? 'cyrl' : 'latn'}`}
            onClick={() => onChange(s)}
            className="px-3 py-1 text-[12px] font-semibold transition-colors"
            style={
              active
                ? { background: 'var(--st-soot)', color: '#FBF3E2' }
                : { background: 'transparent', color: 'var(--st-ink-2)' }
            }
          >
            {s === 'mn-Cyrl' ? cyrlLabel : latnLabel}
          </button>
        );
      })}
    </div>
  );
}
