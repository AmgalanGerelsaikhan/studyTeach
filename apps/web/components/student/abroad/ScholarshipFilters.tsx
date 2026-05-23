'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { StCard, StDivider } from '@/components/st';

/**
 * Filter island for the scholarship aggregator. Filters drive URL search
 * params so the catalog stays a server component (cards render on the
 * server, no client list state). Mirrors the academy AcademyFilters island
 * — the dropdown set is hardcoded to the closed enums in
 * `packages/contracts/src/study-abroad.ts`, no facet endpoint required.
 *
 * Deadline window is expressed as a select of {30, 90, 180, any} days;
 * "any" clears the URL param so the server returns the full catalog.
 */

const DESTINATIONS = ['US', 'JP', 'KR', 'CN', 'RU', 'DE', 'UK', 'AU'] as const;
const LEVELS = ['UG', 'PG', 'PHD'] as const;
const FUNDING = ['FULL', 'PARTIAL', 'TUITION_ONLY'] as const;
const DEADLINE_WINDOWS = ['30', '90', '180'] as const;

export function ScholarshipFilters() {
  const t = useTranslations('student.abroad');
  const router = useRouter();
  const params = useSearchParams();

  const destination = params.get('destination_code') ?? '';
  const level = params.get('level') ?? '';
  const funding = params.get('funding_type') ?? '';
  const deadline = params.get('deadline_within_days') ?? '';

  function apply(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.push(qs ? `/student/abroad/scholarships?${qs}` : '/student/abroad/scholarships');
  }

  const selectStyle = {
    borderColor: 'rgba(185, 132, 56, 0.4)',
    background: 'var(--st-paper)',
    color: 'var(--st-ink)',
  };

  return (
    <StCard padding="md">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {t('filter.eyebrow')}
      </p>

      <label className="mt-3 block">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--st-ink-2)' }}>
          {t('filter.destination')}
        </span>
        <select
          value={destination}
          onChange={(e) => apply({ destination_code: e.target.value })}
          className="mt-1 w-full rounded-st-sm border px-2 py-1.5 text-sm"
          style={selectStyle}
          data-testid="scholarship-filter-destination"
        >
          <option value="">{t('filter.any')}</option>
          {DESTINATIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--st-ink-2)' }}>
          {t('filter.level')}
        </span>
        <select
          value={level}
          onChange={(e) => apply({ level: e.target.value })}
          className="mt-1 w-full rounded-st-sm border px-2 py-1.5 text-sm"
          style={selectStyle}
          data-testid="scholarship-filter-level"
        >
          <option value="">{t('filter.any')}</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {t(`level.${l}`)}
            </option>
          ))}
        </select>
      </label>

      <StDivider />

      <label className="block">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--st-ink-2)' }}>
          {t('filter.funding')}
        </span>
        <select
          value={funding}
          onChange={(e) => apply({ funding_type: e.target.value })}
          className="mt-1 w-full rounded-st-sm border px-2 py-1.5 text-sm"
          style={selectStyle}
          data-testid="scholarship-filter-funding"
        >
          <option value="">{t('filter.any')}</option>
          {FUNDING.map((f) => (
            <option key={f} value={f}>
              {t(`funding.${f}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--st-ink-2)' }}>
          {t('filter.deadline')}
        </span>
        <select
          value={deadline}
          onChange={(e) => apply({ deadline_within_days: e.target.value })}
          className="mt-1 w-full rounded-st-sm border px-2 py-1.5 text-sm"
          style={selectStyle}
          data-testid="scholarship-filter-deadline"
        >
          <option value="">{t('filter.any')}</option>
          {DEADLINE_WINDOWS.map((d) => (
            <option key={d} value={d}>
              {t(`filter.deadlineWindow.${d}`)}
            </option>
          ))}
        </select>
      </label>
    </StCard>
  );
}
