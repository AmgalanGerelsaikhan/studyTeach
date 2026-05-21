'use client';

import { useState } from 'react';

import { StAvatar } from '@/components/st';

export interface ChildOption {
  id: string;
  name: string;
  initial: string;
  grade: string;
}

export function ChildSelector({
  children,
  label,
  defaultId,
}: {
  children: ChildOption[];
  label: string;
  defaultId?: string;
}) {
  const [selected, setSelected] = useState(defaultId ?? children[0]?.id ?? '');
  return (
    <div role="group" aria-label={label} data-testid="parent-child-selector">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--st-ink-3)' }}
      >
        {label}
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {children.map((child) => {
          const active = child.id === selected;
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => setSelected(child.id)}
              aria-pressed={active}
              data-child-id={child.id}
              className="flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5"
              style={{
                background: active ? 'var(--st-soot)' : 'var(--st-paper)',
                color: active ? '#FBF3E2' : 'var(--st-ink-2)',
                borderColor: active ? 'var(--st-soot)' : 'rgba(185,132,56,0.35)',
              }}
            >
              <StAvatar initial={child.initial} tone={active ? 'ember' : 'brass'} size={26} />
              <span className="text-[12px] font-semibold">
                {child.name}
                <span
                  className="ml-1 text-[10px] font-normal"
                  style={{ opacity: active ? 0.7 : 0.6 }}
                >
                  · {child.grade}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
