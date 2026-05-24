import type { PublicDestination } from '@studyteach/contracts';

/**
 * Gadaad destinations carousel — horizontally scrollable on mobile,
 * grid on desktop. Each card shows the destination, the primary pathway
 * blurb, and the live scholarship count from /public/stats.
 *
 * Server-rendered (no client state needed). Anonymous.
 */
export function DestinationsCarousel({
  destinations,
  totalScholarships,
}: {
  destinations: PublicDestination[];
  totalScholarships: number;
}) {
  return (
    <section
      id="abroad"
      className="py-16 sm:py-20"
      style={{ background: 'var(--st-cream)' }}
      data-testid="landing-destinations"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          № 05b · Гадаад
        </p>
        <h2
          className="mt-2 font-display font-bold leading-tight tracking-[-0.02em]"
          style={{ color: 'var(--st-soot)', fontSize: 'clamp(26px, 3.4vw, 44px)' }}
        >
          {destinations.length} чиглэл.{' '}
          <span style={{ color: 'var(--st-ember)' }}>{totalScholarships} тэтгэлэг</span>.
        </h2>
        <p
          className="mt-3 max-w-[60ch] text-[15px] leading-relaxed"
          style={{ color: 'var(--st-ink-2)' }}
        >
          Бүх чиглэл, замналыг нэг газар. Хүүхэд бүрт боломж — нэрстэй сургуулиас эхлээд тэтгэлэгт
          хөтөлбөр хүртэл, монгол хэлээр.
        </p>

        <div
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="landing-destinations-grid"
        >
          {destinations.map((d) => (
            <article
              key={d.destination_code}
              className="flex flex-col rounded-st-md border p-4 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              style={{
                background: 'var(--st-paper)',
                borderColor: 'rgba(185, 132, 56, 0.4)',
                boxShadow: 'var(--st-shadow-sm)',
              }}
              data-testid={`landing-destination-${d.destination_code}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="rounded-md px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.1em]"
                  style={{ background: 'var(--st-soot)', color: '#D4A24C' }}
                >
                  {d.destination_code}
                </span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--st-brass-dark)' }}
                >
                  {d.scholarship_count} тэтгэлэг
                </span>
              </div>
              <h3
                className="mt-2 font-display text-lg font-bold leading-tight"
                style={{ color: 'var(--st-soot)' }}
              >
                {d.name_mn}
              </h3>
              <p
                className="mt-1 flex-1 text-[13px] leading-snug"
                style={{ color: 'var(--st-ink-2)' }}
              >
                {d.pathway_mn}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
