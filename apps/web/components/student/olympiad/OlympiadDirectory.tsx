'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { OlympiadCard } from '@studyteach/contracts';

import { StButton, StCard, StChip, StDivider, StIcon } from '@/components/st';
import { listOlympiads, registerForOlympiad } from '@/lib/api/olympiad';

type Tab = 'all' | 'registered' | 'saved';
const SAVED_KEY = 'st.olympiad.saved';

const SUBJECT_CHIPS = ['math', 'physics', 'chem', 'bio', 'info', 'mongolian', 'english', 'history'];
const AIMAGS = ['Улаанбаатар', 'Хэнтий', 'Дархан-Уул', 'Орхон', 'Сэлэнгэ', 'Хөвсгөл'];

export function OlympiadDirectory() {
  const t = useTranslations('student.olympiad');
  const [tab, setTab] = useState<Tab>('all');
  const [subject, setSubject] = useState<string | null>(null);
  const [aimag, setAimag] = useState<string | null>(null);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [cards, setCards] = useState<OlympiadCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [registering, setRegistering] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSavedIds(new Set(JSON.parse(raw) as number[]));
    } catch {
      // ignore
    }
  }, []);

  const persistSaved = (next: Set<number>) => {
    setSavedIds(next);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
    } catch {
      // ignore
    }
  };

  const load = useCallback(
    async (replace: boolean) => {
      setLoading(true);
      try {
        const filter: Parameters<typeof listOlympiads>[0] = { limit: 12 };
        if (subject) filter.subject = [subject];
        if (aimag) filter.aimag = aimag;
        if (onlineOnly) filter.is_online = true;
        if (openOnly) filter.window = 'open';
        if (!replace && cursor) filter.cursor = cursor;
        const res = await listOlympiads(filter);
        setCursor(res.next_cursor);
        setCards((prev) => (replace ? res.items : [...prev, ...res.items]));
      } finally {
        setLoading(false);
      }
    },
    [subject, aimag, onlineOnly, openOnly, cursor],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  async function handleRegister(id: number) {
    setRegistering(id);
    try {
      await registerForOlympiad(id);
      setCards((prev) => prev.map((c) => (c.olympiad_id === id ? { ...c, registered: true } : c)));
    } finally {
      setRegistering(null);
    }
  }

  const visible = useMemo(() => {
    if (tab === 'registered') return cards.filter((c) => c.registered);
    if (tab === 'saved') return cards.filter((c) => savedIds.has(c.olympiad_id));
    return cards;
  }, [cards, tab, savedIds]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6" data-testid="olympiad-directory">
      <StCard padding="lg">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>
      </StCard>

      <nav className="mt-4 flex flex-wrap items-center gap-1.5" data-testid="olympiad-tabs">
        {(['all', 'registered', 'saved'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={tab === k}
            onClick={() => setTab(k)}
            className="rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors"
            style={
              tab === k
                ? { background: 'var(--st-soot)', color: '#FBF3E2', borderColor: 'var(--st-soot)' }
                : {
                    background: 'transparent',
                    color: 'var(--st-ink-2)',
                    borderColor: 'rgba(185, 132, 56, 0.4)',
                  }
            }
            data-testid={`olympiad-tab-${k}`}
          >
            {t(`tab${k.charAt(0).toUpperCase()}${k.slice(1)}`)}
          </button>
        ))}
      </nav>

      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside>
          <StCard padding="md">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {t('filterSubject')}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUBJECT_CHIPS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={subject === s}
                  onClick={() => setSubject((cur) => (cur === s ? null : s))}
                  className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                  style={
                    subject === s
                      ? {
                          background: 'var(--st-soot)',
                          color: '#FBF3E2',
                          borderColor: 'var(--st-soot)',
                        }
                      : {
                          background: 'transparent',
                          color: 'var(--st-ink-2)',
                          borderColor: 'rgba(185, 132, 56, 0.4)',
                        }
                  }
                >
                  {s}
                </button>
              ))}
            </div>

            <StDivider />

            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {t('filterAimag')}
            </p>
            <select
              value={aimag ?? ''}
              onChange={(e) => setAimag(e.target.value || null)}
              className="mt-2 w-full rounded-st-sm border px-2 py-1 text-sm"
              style={{ borderColor: 'rgba(185, 132, 56, 0.4)', background: 'var(--st-paper)' }}
              data-testid="filter-aimag"
            >
              <option value="">—</option>
              {AIMAGS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <StDivider />

            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
                data-testid="filter-online"
              />
              {t('filterOnline')}
            </label>
            <label
              className="mt-2 flex items-center gap-2 text-sm"
              style={{ color: 'var(--st-ink-2)' }}
            >
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                data-testid="filter-window"
              />
              {t('filterWindow')}
            </label>
          </StCard>
        </aside>

        <section>
          {visible.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
              {t('empty')}
            </p>
          ) : (
            <ul className="flex flex-col gap-3" data-testid="olympiad-cards">
              {visible.map((c) => {
                const saved = savedIds.has(c.olympiad_id);
                return (
                  <li key={c.olympiad_id}>
                    <StCard padding="md">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <StChip tone="brass">{c.subject}</StChip>
                            {c.is_online && (
                              <StChip tone="sky">
                                <StIcon name="globe" size={11} />
                                {t('online')}
                              </StChip>
                            )}
                          </div>
                          <h3
                            className="mt-1 font-display text-base font-bold"
                            style={{ color: 'var(--st-soot)' }}
                          >
                            {c.title}
                          </h3>
                          <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
                            {c.organizer} · {c.aimag ?? '—'} ·{' '}
                            {new Date(c.exam_date).toISOString().slice(0, 10)}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--st-ink-2)' }}>
                            {c.base_fee_mnt === 0
                              ? t('feeFree')
                              : t('feeMnt', { amount: c.base_fee_mnt.toLocaleString() })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {c.registered ? (
                            <StChip tone="moss">
                              <StIcon name="check" size={11} />
                              {t('registered')}
                            </StChip>
                          ) : (
                            <StButton
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={registering === c.olympiad_id}
                              onClick={() => handleRegister(c.olympiad_id)}
                              data-testid={`olympiad-register-${c.olympiad_id}`}
                            >
                              {registering === c.olympiad_id ? t('registering') : t('register')}
                            </StButton>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const next = new Set(savedIds);
                              if (saved) next.delete(c.olympiad_id);
                              else next.add(c.olympiad_id);
                              persistSaved(next);
                            }}
                            className="text-[11px] font-semibold"
                            style={{ color: 'var(--st-brass-dark)' }}
                          >
                            {saved ? t('unsaveToggle') : t('saveToggle')}
                          </button>
                        </div>
                      </div>
                      {c.registered && (
                        <p className="mt-2 text-[10px]" style={{ color: 'var(--st-cinnabar)' }}>
                          {t('pendingPayment')}
                        </p>
                      )}
                    </StCard>
                  </li>
                );
              })}
            </ul>
          )}
          {tab === 'all' && cursor && (
            <div className="mt-4">
              <StButton
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading}
                onClick={() => load(false)}
              >
                {t('loadMore')}
              </StButton>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
