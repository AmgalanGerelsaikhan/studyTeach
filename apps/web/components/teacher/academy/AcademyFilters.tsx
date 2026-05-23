'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { StCard, StDivider } from '@/components/st';

/**
 * Filter island for the Academy catalog. Filters drive URL search params so
 * the catalog stays a server component (cards render on the server). The
 * client cost here is just the form controls — no data fetching, no list
 * rendering. Mirrors OlympiadDirectory's filter aside, but the navigation is
 * delegated to the router so the RSC re-fetches on the server.
 */

const SUBJECTS = ['Физик', 'Математик', 'Монгол хэл', 'Хими', 'Биологи', 'Англи хэл'];
const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const METHODOLOGIES = ['Формативе үнэлгээ', 'Ялгавартай заах арга', 'Харилцааны хэл заах арга'];
const LANGUAGE_TRACKS = [
  'GENERAL',
  'ENGLISH_A1',
  'ENGLISH_A2',
  'ENGLISH_B1',
  'ENGLISH_B2',
] as const;

export function AcademyFilters() {
  const t = useTranslations('teacher.academy');
  const router = useRouter();
  const params = useSearchParams();

  const subject = params.get('subject') ?? '';
  const grade = params.get('grade') ?? '';
  const methodology = params.get('methodology') ?? '';
  const languageTrack = params.get('language_track') ?? '';

  function apply(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // A filter change resets pagination.
    next.delete('cursor');
    const qs = next.toString();
    router.push(qs ? `/teacher/personal/academy?${qs}` : '/teacher/personal/academy');
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
        {t('filterEyebrow')}
      </p>

      <label className="mt-3 block">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--st-ink-2)' }}>
          {t('filterSubject')}
        </span>
        <select
          value={subject}
          onChange={(e) => apply({ subject: e.target.value })}
          className="mt-1 w-full rounded-st-sm border px-2 py-1.5 text-sm"
          style={selectStyle}
          data-testid="academy-filter-subject"
        >
          <option value="">{t('filterAny')}</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--st-ink-2)' }}>
          {t('filterGrade')}
        </span>
        <select
          value={grade}
          onChange={(e) => apply({ grade: e.target.value })}
          className="mt-1 w-full rounded-st-sm border px-2 py-1.5 text-sm"
          style={selectStyle}
          data-testid="academy-filter-grade"
        >
          <option value="">{t('filterAny')}</option>
          {GRADES.map((g) => (
            <option key={g} value={String(g)}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <StDivider />

      <label className="block">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--st-ink-2)' }}>
          {t('filterMethodology')}
        </span>
        <select
          value={methodology}
          onChange={(e) => apply({ methodology: e.target.value })}
          className="mt-1 w-full rounded-st-sm border px-2 py-1.5 text-sm"
          style={selectStyle}
          data-testid="academy-filter-methodology"
        >
          <option value="">{t('filterAny')}</option>
          {METHODOLOGIES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--st-ink-2)' }}>
          {t('filterLanguage')}
        </span>
        <select
          value={languageTrack}
          onChange={(e) => apply({ language_track: e.target.value })}
          className="mt-1 w-full rounded-st-sm border px-2 py-1.5 text-sm"
          style={selectStyle}
          data-testid="academy-filter-language"
        >
          <option value="">{t('filterAny')}</option>
          {LANGUAGE_TRACKS.map((track) => (
            <option key={track} value={track}>
              {t(`languageTrack.${track}`)}
            </option>
          ))}
        </select>
      </label>
    </StCard>
  );
}
