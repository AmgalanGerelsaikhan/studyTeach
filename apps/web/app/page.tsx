import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('home');
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div
        className="rounded-st-lg border bg-paper p-8 shadow-md"
        style={{
          borderColor: 'rgba(185, 132, 56, 0.35)',
          boxShadow: 'var(--st-shadow-md)',
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-ember)' }}
        >
          {t('eyebrow')}
        </p>
        <h1
          className="mt-2 font-display text-4xl font-bold"
          style={{ color: 'var(--st-soot)', lineHeight: 1.1 }}
        >
          {t('greeting')}
        </h1>
        <p className="mt-4 text-base" style={{ color: 'var(--st-ink-2)' }}>
          {t('tagline')}
        </p>

        <div
          className="mt-6 inline-flex h-12 items-center justify-center rounded-st-md px-5 text-sm font-semibold text-white"
          style={{
            background:
              'linear-gradient(180deg, var(--st-ember-bright) 0%, var(--st-ember) 50%, var(--st-ember-deep) 100%)',
            border: '1px solid var(--st-cinnabar)',
            boxShadow: 'var(--st-shadow-sm)',
          }}
        >
          {t('phase')}
        </div>

        <hr
          className="my-6"
          style={{
            border: 0,
            height: 1,
            background:
              'linear-gradient(90deg, transparent, rgba(185, 132, 56, 0.5) 20%, rgba(185, 132, 56, 0.5) 80%, transparent)',
          }}
        />

        <p
          className="text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('stackEyebrow')}
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('stack')}
        </p>
        <p className="mt-4 text-xs" style={{ color: 'var(--st-ink-3)' }}>
          {t('kickoff')}
        </p>
      </div>
    </main>
  );
}
