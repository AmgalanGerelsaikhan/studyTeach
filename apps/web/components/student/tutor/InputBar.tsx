'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import { StButton, StIcon } from '@/components/st';

interface Props {
  disabled: boolean;
  onSubmit: (text: string) => void;
}

/**
 * Tutor chat input. mn-Cyrl only — the Latn-input toggle and the
 * latnToCyrl preview were removed when the platform was scoped to
 * Mongolian only.
 */
export function InputBar({ disabled, onSubmit }: Props) {
  const t = useTranslations('student.tutor');
  const [draft, setDraft] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
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
        <StButton type="submit" variant="primary" size="md" disabled={disabled || !draft.trim()}>
          <StIcon name="arrow_r" size={14} />
          {disabled ? t('sending') : t('send')}
        </StButton>
      </div>
    </form>
  );
}
