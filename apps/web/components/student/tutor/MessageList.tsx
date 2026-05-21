'use client';

import { useTranslations } from 'next-intl';

import { StCard, StChip, StIcon } from '@/components/st';

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'assistant';
      text: string;
      citations: { source_ref: string; strand: string }[];
    }
  | { id: string; role: 'refusal'; refusal_key: string; text: string }
  | { id: string; role: 'pending' };

interface Props {
  messages: ChatMessage[];
}

export function MessageList({ messages }: Props) {
  const t = useTranslations('student.tutor');
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-12">
        <p className="text-center text-sm" style={{ color: 'var(--st-ink-3)' }}>
          {t('starterPrompt')}
        </p>
      </div>
    );
  }
  return (
    <ol className="flex flex-col gap-4 px-4 py-4" data-testid="tutor-messages">
      {messages.map((m) => (
        <li key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
          {m.role === 'user' ? (
            <UserBubble text={m.text} />
          ) : m.role === 'assistant' ? (
            <AssistantBubble
              text={m.text}
              citations={m.citations}
              citationsLabel={t('citationsLabel')}
            />
          ) : m.role === 'refusal' ? (
            <RefusalBubble
              text={m.text}
              refusalKey={m.refusal_key}
              refusalLabel={t('refusalLabel')}
            />
          ) : (
            <PendingBubble label={t('sending')} />
          )}
        </li>
      ))}
    </ol>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div
      className="max-w-[80%] rounded-st-md px-3.5 py-2.5 text-sm"
      style={{
        background: 'var(--st-soot)',
        color: '#FBF3E2',
        boxShadow: 'var(--st-shadow-sm)',
      }}
    >
      {text}
    </div>
  );
}

function AssistantBubble({
  text,
  citations,
  citationsLabel,
}: {
  text: string;
  citations: { source_ref: string; strand: string }[];
  citationsLabel: string;
}) {
  return (
    <div className="max-w-[88%]">
      <StCard padding="md">
        <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--st-ink)' }}>
          {text}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {citationsLabel}
          </span>
          {citations.map((c) => (
            <StChip key={c.source_ref} tone="brass">
              <StIcon name="file" size={10} />
              {c.source_ref}
            </StChip>
          ))}
        </div>
      </StCard>
    </div>
  );
}

function RefusalBubble({
  text,
  refusalKey,
  refusalLabel,
}: {
  text: string;
  refusalKey: string;
  refusalLabel: string;
}) {
  return (
    <div className="max-w-[88%]">
      <StCard padding="md">
        <div className="flex items-center gap-2">
          <StChip tone="ember">
            <StIcon name="shield" size={10} />
            {refusalLabel}
          </StChip>
          <span className="font-mono text-[10px]" style={{ color: 'var(--st-ink-3)' }}>
            {refusalKey}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {text}
        </p>
      </StCard>
    </div>
  );
}

function PendingBubble({ label }: { label: string }) {
  return (
    <div className="max-w-[88%]">
      <StCard padding="md">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 animate-pulse rounded-full"
            style={{ background: 'var(--st-brass)' }}
          />
          <span className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
            {label}
          </span>
        </div>
      </StCard>
    </div>
  );
}
