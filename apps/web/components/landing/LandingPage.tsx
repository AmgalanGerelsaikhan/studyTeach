import Link from 'next/link';
import type { PublicStats } from '@studyteach/contracts';

import { StLinkButton } from '@/components/st';
import { MozaLogo } from '@/components/system/MozaLogo';

import { DestinationsCarousel } from './DestinationsCarousel';
import { EgshShowcase } from './EgshShowcase';

/**
 * MozaTeach public landing one-pager — the home screen at `/`.
 * Faithful reproduction of `landingpage/Тест/landing/index.html` in the
 * Ger Interior design system. mn-Cyrl only; marketing copy hardcoded.
 *
 * The only login affordance is the nav "Нэвтрэх" → /login. No login
 * section/forms inside the page body — it stays a marketing one-pager.
 *
 * Motion: subtle, CSS-only (see globals.css `.st-rise/.st-reveal/.st-bar`).
 * Scroll-reveal uses the view-timeline API so this stays a server component.
 */
export function LandingPage({ stats }: { stats?: PublicStats | null }) {
  return (
    <div style={{ background: 'var(--st-cream)', color: 'var(--st-ink)' }}>
      <div
        aria-hidden
        style={{
          height: 4,
          background:
            'repeating-linear-gradient(90deg, var(--st-brass-dark) 0 18px, var(--st-ember-deep) 18px 20px, var(--st-brass-dark) 20px 40px, var(--st-brass-bright) 40px 42px)',
        }}
      />
      <LandingNav />
      <Hero stats={stats ?? null} />
      <div
        aria-hidden
        style={{
          height: 6,
          marginTop: 64,
          background:
            'repeating-linear-gradient(90deg, var(--st-brass-dark) 0 16px, var(--st-ember-deep) 16px 18px, var(--st-brass-dark) 18px 36px, var(--st-brass-bright) 36px 38px)',
        }}
      />
      <Portals />
      <Features />
      {stats?.sample_question && <EgshShowcase question={stats.sample_question} />}
      {stats && stats.destinations.length > 0 && (
        <DestinationsCarousel
          destinations={stats.destinations}
          totalScholarships={stats.totals.scholarships}
        />
      )}
      <Stats />
      <Quote />
      <Cta />
      <LandingFooter />
    </div>
  );
}

// ── shared bits ──────────────────────────────────────────────────────────────

function Eyebrow({
  children,
  color,
  className,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <p
      className={`font-mono text-[11px] uppercase tracking-[0.16em]${className ? ` ${className}` : ''}`}
      style={{ color: color ?? 'var(--st-ember)', ...style }}
    >
      {children}
    </p>
  );
}

// Button styling lives in StLinkButton — see docs/DESIGN_SYSTEM.md.
// Next 14's <Link> handles hash anchors natively, so callers pass either
// "#cta" or "/login" as href without further branching.

// ── Nav ──────────────────────────────────────────────────────────────────────

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '#portals', label: 'Хэрэглэгчид' },
  { href: '#student', label: 'Бүтээгдэхүүн' },
  { href: '#stats', label: 'Хүрээ' },
  { href: '#quote', label: 'Туршлага' },
];

function LandingNav() {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{
        background: 'rgba(251, 243, 226, 0.92)',
        borderColor: 'rgba(185, 132, 56, 0.3)',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <MozaLogo href="/" size="lg" />

        <nav
          aria-label="Үндсэн цэс"
          className="hidden items-center gap-7 text-sm font-medium md:flex"
          style={{ color: 'var(--st-ink-2)' }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="transition-colors duration-200 hover:text-ember"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <StLinkButton href="/login" variant="secondary" size="md">
            Нэвтрэх
          </StLinkButton>
          <span className="hidden sm:inline-flex">
            <StLinkButton href="#cta" variant="primary" size="md">
              Туршиж үзэх
            </StLinkButton>
          </span>
        </div>
      </div>
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function heroMeta(stats: PublicStats | null): { num: React.ReactNode; lbl: string }[] {
  const tile = (n: number) => <span style={{ color: 'var(--st-ember)' }}>{n}</span>;
  if (!stats) {
    // API down — degrade to honest "live" badges rather than fake numbers.
    return [
      { num: '·', lbl: 'ЕЭШ материал' },
      { num: '·', lbl: 'Гадаад тэтгэлэг' },
      { num: '·', lbl: 'Сургууль' },
      { num: 'Кирилл', lbl: 'Эх хэлээр' },
    ];
  }
  return [
    { num: tile(stats.totals.egsh_papers), lbl: 'ЕЭШ материал' },
    { num: tile(stats.totals.scholarships), lbl: 'Гадаад тэтгэлэг' },
    { num: tile(stats.totals.destinations), lbl: 'Гадаад чиглэл' },
    { num: 'Кирилл', lbl: 'Эх хэлээр' },
  ];
}

function Hero({ stats }: { stats: PublicStats | null }) {
  const heroStats = heroMeta(stats);
  return (
    <section className="mx-auto max-w-6xl px-5 pt-12 sm:px-8 sm:pt-16">
      <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_1fr]">
        {/* copy */}
        <div className="min-w-0">
          <Eyebrow className="st-rise" style={{ animationDelay: '0.05s' }}>
            № 01 · Боловсролын нэгдсэн платформ
          </Eyebrow>
          <h1
            className="st-rise mt-4 font-display font-extrabold leading-[0.98] tracking-[-0.025em]"
            style={{
              color: 'var(--st-soot)',
              fontSize: 'clamp(40px, 7vw, 76px)',
              animationDelay: '0.12s',
            }}
          >
            Нэг сурагч.
            <br />
            Олон <span style={{ color: 'var(--st-ember)' }}>багш</span>.
            <br />
            <span
              style={{
                backgroundImage:
                  'linear-gradient(transparent 70%, rgba(212,162,76,.55) 70%, rgba(212,162,76,.55) 92%, transparent 92%)',
              }}
            >
              Бодит ур чадвар
            </span>
            <br />
            Гэрэлт ирээдүй.
          </h1>
          <p
            className="st-rise mt-6 max-w-[54ch] text-base leading-relaxed sm:text-[17px]"
            style={{ color: 'var(--st-ink-2)', animationDelay: '0.19s' }}
          >
            MozaTeach нь сурагч, багш, эцэг эх, сургуулийн захиргааг холбосон{' '}
            <strong>боловсролын цогц систем</strong> юм. AI багш, ЕЭШ, багш, сурагчдад зориулсан
            уралдаан, олимпиад, тэтгэлгийн нэгдсэн сан — энэ бүхнийг нэг дор нэгтгэнэ.
          </p>

          <div className="st-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '0.26s' }}>
            <StLinkButton href="#cta" variant="primary" size="md">
              Сургуулиа холбох →
            </StLinkButton>
            <StLinkButton href="#student" variant="secondary" size="md">
              Хэрхэн ажилладгийг үзэх
            </StLinkButton>
          </div>

          <dl
            className="st-rise mt-9 flex flex-wrap gap-7 border-t pt-6"
            style={{
              borderColor: 'rgba(140,95,34,.35)',
              borderStyle: 'dashed',
              animationDelay: '0.33s',
            }}
          >
            {heroStats.map((m, i) => (
              <div key={i}>
                <dt
                  className="font-display text-[32px] font-bold leading-none"
                  style={{ color: 'var(--st-soot)' }}
                >
                  {m.num}
                </dt>
                <dd
                  className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.15em]"
                  style={{ color: 'var(--st-ink-3)' }}
                >
                  {m.lbl}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* preview stack */}
        <HeroPreviews />
      </div>
    </section>
  );
}

function HeroPreviews() {
  return (
    <div className="st-rise flex flex-col gap-4" style={{ animationDelay: '0.3s' }} aria-hidden>
      {/* student today */}
      <PreviewCard barLabel="Сурагчийн хэсэг · 9А" barRight="ӨНӨӨДӨР">
        <p className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
          Өнөөдрийн хичээл
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['4 хичээл', '2 даалгавар', '1 пульс'].map((c) => (
            <span
              key={c}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: 'var(--st-felt)', color: 'var(--st-ink-2)' }}
            >
              {c}
            </span>
          ))}
        </div>
        <ul className="mt-3 flex flex-col gap-1.5">
          {[
            { t: 'Математик · 4-р бүлэг шалгалт', done: true },
            { t: 'Монгол хэл · уншлагын тэмдэглэл', done: true },
            { t: 'Физик · даалгавар №7 (15 мин)', done: false },
            { t: 'Сэтгэл санааны пульс', done: false },
          ].map((task) => (
            <li
              key={task.t}
              className="flex items-center gap-2 text-[12.5px]"
              style={{ color: 'var(--st-ink-2)' }}
            >
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full border"
                style={{
                  background: task.done ? 'var(--st-moss)' : 'transparent',
                  borderColor: task.done ? 'var(--st-moss)' : 'rgba(140,95,34,.5)',
                }}
              />
              {task.t}
            </li>
          ))}
        </ul>
      </PreviewCard>

      {/* teacher dual board */}
      <PreviewCard barLabel="Багшийн самбар" barDot="#5B8AA3">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          10Б · АНГИЙН ХАЛУУН
        </p>
        <p className="mt-1 font-display text-sm font-bold" style={{ color: 'var(--st-soot)' }}>
          Сэтгэл санааны пульс
        </p>
        <div className="mt-2 flex items-end gap-1" style={{ height: 56 }}>
          {[30, 55, 75, 88, 62, 25, 50, 80, 68, 92, 45, 18].map((h, i) => (
            <span
              key={i}
              className="st-bar flex-1 rounded-t-sm"
              style={{
                height: `${h}%`,
                background:
                  h >= 75 ? 'var(--st-moss)' : h <= 25 ? 'var(--st-ember)' : 'var(--st-brass)',
                animationDelay: `${0.5 + i * 0.03}s`,
              }}
            />
          ))}
        </div>
        <p
          className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          2 сурагчид анхаарал хандуулах хэрэгтэй
        </p>
      </PreviewCard>

      {/* digital ticket */}
      <div
        className="flex overflow-hidden rounded-[10px] border"
        style={{
          borderColor: 'rgba(185,132,56,.5)',
          background: 'var(--st-paper)',
          boxShadow: 'var(--st-shadow-md)',
        }}
      >
        <div
          className="flex w-12 flex-shrink-0 items-center justify-center font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{
            background: 'linear-gradient(180deg, var(--st-ember), var(--st-ember-deep))',
            color: '#F4C99A',
            writingMode: 'vertical-rl',
          }}
        >
          БҮРТГҮҮЛЭХ
        </div>
        <div className="flex-1 p-3.5">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            ОЛИМПИАД · ФИЗИК
          </p>
          <p
            className="mt-1 font-display text-[18px] font-bold"
            style={{ color: 'var(--st-soot)' }}
          >
            Б. Энхтайван
          </p>
          <p className="text-[11.5px]" style={{ color: 'var(--st-ink-3)' }}>
            № ST-2026-04812 · 11-р анги
          </p>
          <div
            className="mt-2 flex items-center gap-2.5 border-t pt-2"
            style={{ borderColor: 'rgba(140,95,34,.4)', borderStyle: 'dashed' }}
          >
            <span
              className="font-display text-sm font-extrabold"
              style={{ color: 'var(--st-ember)' }}
            >
              26.05.2026
            </span>
            <span
              className="font-mono text-[10px] tracking-[0.1em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              09:00 · УБ-21
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  barLabel,
  barRight,
  barDot,
  children,
}: {
  barLabel: string;
  barRight?: string;
  barDot?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-[10px] border"
      style={{
        borderColor: 'rgba(185,132,56,.5)',
        background: 'var(--st-paper)',
        boxShadow: 'var(--st-shadow-md)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3.5 py-2.5 font-display text-[13px] font-semibold"
        style={{
          background: 'linear-gradient(180deg, #2A1810 0%, #1A0F08 100%)',
          color: 'var(--st-paper)',
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: barDot ?? 'var(--st-ember)' }}
        />
        {barLabel}
        {barRight && (
          <span
            className="ml-auto font-mono text-[10px] tracking-[0.12em]"
            style={{ color: 'var(--st-brass-bright)' }}
          >
            {barRight}
          </span>
        )}
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  );
}

// ── Portals ──────────────────────────────────────────────────────────────────

const PORTALS: {
  no: string;
  role: string;
  en: string;
  body: string;
  items: string[];
  label: string;
  accent: string;
}[] = [
  {
    no: '№ 01',
    role: 'Сурагч',
    en: 'Сурагчийн хэсэг',
    body: 'Өнөөдрийн даалгавар, хичээлийн давтлага, уралдаан болон олимпиадуудад бүртгүүлэх. Тэтгэлэг, гадаадад сурах олон төрлийн мэдээллийн авах.',
    items: ['Өнөөдрийн даалгавар', 'Олимпиадын лавлах, бүртгүүлэх', 'ЕЭШ-ын бэлтгэл', 'AI багш'],
    label: 'Сурагчид зориулсан',
    accent: 'var(--st-ember)',
  },
  {
    no: '№ 02',
    role: 'Багш',
    en: 'Багшийн хэсэг',
    body: 'Хоёр горимт самбар — хичээл явуулах ба ангийн пульс. Ажил багатай шийдвэрийн ил тод гарц.',
    items: [
      'Хоёр горимт самбар',
      'Ангийн сэтгэл санааны пульс',
      'Багшийн академик хичээлүүд',
      'Анхаарах дохионууд',
    ],
    label: 'Багш нарт зориулсан',
    accent: 'var(--st-brass)',
  },
  {
    no: '№ 03',
    role: 'Эцэг эх',
    en: 'Эцэг эхийн самбар',
    body: 'Хүүхдийн ирц, гаргаж буй амжилтууд, дэмжлэг, анхаарах зүйлсүүд.',
    items: [
      'Хүүхдийн сурч мэдсэн зүйлс',
      'Дэмжлэгт хамруулах урилга',
      'Багштай харилцах',
      'Тэтгэлгийн боломжууд',
    ],
    label: 'Эцэг эхэд зориулсан',
    accent: 'var(--st-moss)',
  },
  {
    no: '№ 04',
    role: 'Захиргаа',
    en: 'School & ministry',
    body: 'Захирлын самбар, тэтгэлгийн нэгдсэн сан, гадаад сургуулийн хаб. Үндэсний хэмжээний шийдвэр гаргалт.',
    items: [
      'Захирлын самбар',
      'Тэтгэлгийн нэгдсэн сан',
      'Гадаад сургуулийн хаб',
      'Орны үндсэн зураг',
    ],
    label: 'Захиргаанд зориулсан',
    accent: 'var(--st-sky)',
  },
];

function Portals() {
  return (
    <section id="portals" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
        <div className="st-reveal">
          <Eyebrow>№ 02 · Сурагч, Эцэг эх, Багш, Сургууль</Eyebrow>
          <h2
            className="mt-2 font-display font-bold leading-tight tracking-[-0.02em]"
            style={{ color: 'var(--st-soot)', fontSize: 'clamp(28px, 3.4vw, 44px)' }}
          >
            Хүн бүрийн хэрэгцээнд зориулан бүтээв.
          </h2>
        </div>
        <p className="st-reveal text-[15px] leading-relaxed" style={{ color: 'var(--st-ink-2)' }}>
          MozaTeach нь хэрэглэгчийн дөрвөн төрөл — сурагч, багш, эцэг эх, удирдлагыг — нэг системд
          холбож, хэн нь юу харах ёстойг нарийн зааглаж өгсөн.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PORTALS.map((p) => (
          <article
            key={p.role}
            className="st-reveal st-lift flex flex-col rounded-[10px] border p-5"
            style={{
              background: 'var(--st-paper)',
              borderColor: 'rgba(185,132,56,.35)',
              borderTop: `3px solid ${p.accent}`,
              boxShadow: 'var(--st-shadow-sm)',
            }}
          >
            <p
              className="font-mono text-[11px] uppercase tracking-[0.16em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {p.no}
            </p>
            <h3
              className="mt-1 font-display text-[22px] font-bold"
              style={{ color: 'var(--st-soot)' }}
            >
              {p.role}
            </h3>
            <p
              className="font-mono text-[10.5px] uppercase tracking-[0.14em]"
              style={{ color: 'var(--st-ink-3)' }}
            >
              {p.en}
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--st-ink-2)' }}>
              {p.body}
            </p>
            <ul className="mt-3 flex flex-1 flex-col gap-1.5">
              {p.items.map((it) => (
                <li
                  key={it}
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: 'var(--st-ink-2)' }}
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: p.accent }}
                  />
                  {it}
                </li>
              ))}
            </ul>
            <p
              className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {p.label}
            </p>
            <Link
              href="/login"
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold"
              style={{ color: p.accent }}
              aria-label={`${p.role} — Нэвтрэх`}
            >
              Нэвтрэх →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Features ─────────────────────────────────────────────────────────────────

const FEATURES: {
  no: string;
  title: string;
  body: string;
  list: { n: string; h: string; t: string }[];
}[] = [
  {
    no: '№ 03 · Сурагчийн хэсэг',
    title: 'Хичээлийн өдөр — сурагч өөрөө захирдаг ширээ.',
    body: 'Хүүхэд анх удаа нэвтрэхэд MozaTeach түүний өдрийг гурван хэсэгт хувааж үзүүлнэ: хийх, мэдрэх, өсөх. Олон хавтас биш, нэг ширээ.',
    list: [
      {
        n: '01',
        h: 'Өнөөдрийн ширээ',
        t: 'Хийгдэх даалгавар, дараагийн шалгалт, олимпиадын тасалбар нэг харагдацанд.',
      },
      {
        n: '02',
        h: 'Сэтгэл санааны пульс',
        t: 'Долоо хоног бүр өөрийгөө сонсох богино асуулга. Тоо биш, өөрт нь зориулсан тэмдэглэл.',
      },
      {
        n: '03',
        h: 'Фокус горим',
        t: 'Хичээлийн цагт сурагчийн дэлгэцэнд зөвхөн хэрэгцээт мэдээлэл — мэдэгдлийн чимээгүй.',
      },
    ],
  },
  {
    no: '№ 04 · Багшийн самбар',
    title: 'Хичээл явуулна, угаах ёстой ажлыг нь систем хийнэ.',
    body: 'Багш хичээлийнхээ дараа аль сурагчтай аль хичээлээр ярих ёстойг MozaTeach өөрөө сонгож, ширээн дээр нь тавьдаг. Угаах ажил багатай — заах цаг олонтой.',
    list: [
      {
        n: '01',
        h: 'Хоёр горимт самбар',
        t: 'Хичээлийн горимоос анги харах горимд нэг товчоор шилжинэ.',
      },
      {
        n: '02',
        h: 'Эртний дэмжлэгийн дохио',
        t: 'Сурагчийн идэвх буурахад багш, эцэг эх рүү намуун дохио хүрнэ.',
      },
      {
        n: '03',
        h: 'Багшийн академи',
        t: 'Заах арга, хүүхэдтэй харилцах суурь — өөрийн самбар дотроос л.',
      },
    ],
  },
  {
    no: '№ 05 · Эцэг эх ба захиргаа',
    title: 'Айдсыг бус, итгэлийг өсгөдөг харилцаа.',
    body: 'Эцэг эхэд хүүхдийнх нь өдрийг намуун, цэгцтэйгээр харуулна. Захирал, аймгийн боловсролын газар, яаманд — улсын хэмжээнд ямар сургуульд юу болж байгааг нэг зурагт.',
    list: [
      {
        n: '01',
        h: 'Эцэг эхийн портал',
        t: 'Хүүхдийн өдөр, амжилт, дэмжлэг — нэг хуудас, мөргөлдөөнгүй хэлээр.',
      },
      {
        n: '02',
        h: 'Тэтгэлгийн нэгдсэн сан',
        t: 'Дотоодоос гадаад хүртэлх тэтгэлгийн боломжуудыг нэгтгэсэн.',
      },
      {
        n: '03',
        h: 'Орны үндсэн зураг',
        t: 'Захиргаанд — сургууль тус бүрийн пульс, оноо, эрсдэл нэг далайцтай.',
      },
    ],
  },
];

function Features() {
  return (
    <section
      id="student"
      className="border-y"
      style={{ background: 'var(--st-paper)', borderColor: 'rgba(185,132,56,.3)' }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-14 px-5 py-16 sm:px-8 sm:py-20">
        {FEATURES.map((f) => (
          <div key={f.no}>
            <Eyebrow className="st-reveal">{f.no}</Eyebrow>
            <h2
              className="st-reveal mt-2 max-w-[20ch] font-display font-bold leading-tight tracking-[-0.02em]"
              style={{ color: 'var(--st-soot)', fontSize: 'clamp(24px, 3vw, 38px)' }}
            >
              {f.title}
            </h2>
            <p
              className="st-reveal mt-3 max-w-[58ch] text-[15px] leading-relaxed"
              style={{ color: 'var(--st-ink-2)' }}
            >
              {f.body}
            </p>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {f.list.map((item) => (
                <li
                  key={item.n}
                  className="st-reveal st-lift rounded-[8px] border p-4"
                  style={{
                    background: 'var(--st-cream)',
                    borderColor: 'rgba(185,132,56,.3)',
                  }}
                >
                  <span
                    className="font-display text-lg font-extrabold"
                    style={{ color: 'var(--st-ember)' }}
                  >
                    {item.n}
                  </span>
                  <p
                    className="mt-1 font-display text-[15px] font-bold"
                    style={{ color: 'var(--st-soot)' }}
                  >
                    {item.h}
                  </p>
                  <p
                    className="mt-1 text-[12.5px] leading-relaxed"
                    style={{ color: 'var(--st-ink-3)' }}
                  >
                    {item.t}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────

const STATS: { num: string; sup: string; l: string }[] = [
  {
    num: '13',
    sup: 'дэлгэц',
    l: 'Хэрэглэгчийн төрлүүдийг бүрэн хамарсан дизайн системийн дэлгэцүүд.',
  },
  {
    num: '5',
    sup: 'үүрэг',
    l: 'Сурагч, багш, эцэг эх, захирал, яам — тус бүр өөрийн харагдацтай.',
  },
  {
    num: '21',
    sup: 'аймаг',
    l: 'Улсын хэмжээний нэгдсэн сан, гадаад сургуулийн хаб хүртэлх зам.',
  },
  {
    num: '0',
    sup: 'чимээ',
    l: 'Фокус горимд сурагч, багш зөвхөн хэрэгтэйг харна. Бусад нь чимээгүй.',
  },
];

function Stats() {
  return (
    <section
      id="stats"
      style={{ background: 'var(--st-soot)', color: 'var(--st-felt)' }}
      className="py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Eyebrow className="st-reveal" color="var(--st-brass-bright)">
          № 06 · Хүрээ
        </Eyebrow>
        <h2
          className="st-reveal mt-2 font-display font-bold leading-tight tracking-[-0.02em]"
          style={{ color: 'var(--st-paper)', fontSize: 'clamp(26px, 3.4vw, 44px)' }}
        >
          Бүхэл системийг{' '}
          <span style={{ color: 'var(--st-brass-bright)' }}>нэг ширээний мод дээр</span>.
        </h2>
        <p
          className="st-reveal mt-3 max-w-[60ch] text-[15px] leading-relaxed"
          style={{ color: '#D8BC85' }}
        >
          Тогтолцоог хэсэгчилж зурдаггүй — сурагчийн өдөр, багшийн самбар, эцэг эхийн харилцаа,
          захирлын шийдвэр, яамны бодлогыг ижил өгөгдлийн модноос тэжээгддэг байхаар зохиосон.
        </p>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.sup}
              className="st-reveal rounded-[10px] border p-5"
              style={{ borderColor: 'rgba(185,132,56,.3)', background: 'rgba(42,24,16,0.5)' }}
            >
              <p className="font-display font-extrabold" style={{ color: 'var(--st-paper)' }}>
                <span className="text-[44px] leading-none">{s.num}</span>
                <sup
                  className="ml-1 font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: 'var(--st-brass-bright)' }}
                >
                  {s.sup}
                </sup>
              </p>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: '#D8BC85' }}>
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Quote ────────────────────────────────────────────────────────────────────

function Quote() {
  return (
    <section id="quote" className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
      <p
        aria-hidden
        className="st-glyph font-display leading-none"
        style={{ color: 'var(--st-brass)', fontSize: 80 }}
      >
        “
      </p>
      <blockquote
        className="st-reveal -mt-4 font-display font-semibold leading-snug"
        style={{ color: 'var(--st-soot)', fontSize: 'clamp(20px, 2.6vw, 30px)' }}
      >
        Багш нар маань цаасны оронд сурагчтайгаа цаг өнгөрөөж эхэлсэн. Систем цаасны ажлыг нь хийж,
        бид заах арга барилдаа илүү анхаарч эхэллээ.
      </blockquote>
      <cite
        className="st-reveal mt-5 block font-mono text-[11px] uppercase tracking-[0.14em] not-italic"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        <b style={{ color: 'var(--st-soot)' }}>Багш Д. Дулмаа</b> · 56-р сургуулийн ангийн багш ·
        Улаанбаатар
      </cite>
    </section>
  );
}

// ── CTA ──────────────────────────────────────────────────────────────────────

function Cta() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden py-16 sm:py-20"
      style={{ background: 'var(--st-cinnabar)', color: 'var(--st-paper)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0, rgba(212,162,76,.18), transparent 50%), repeating-linear-gradient(45deg, rgba(0,0,0,.06) 0 2px, transparent 2px 14px)',
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="st-reveal">
          <Eyebrow color="var(--st-brass-bright)">№ 07 · Эхлэх</Eyebrow>
          <h2
            className="mt-2 font-display font-bold leading-[1.02] tracking-[-0.02em]"
            style={{ color: 'var(--st-paper)', fontSize: 'clamp(30px, 4vw, 52px)' }}
          >
            Сургуулиа эхний 14 хоногт холбоно. Үлдсэнийг нь бид хийнэ.
          </h2>
          <p className="mt-4 max-w-[52ch] text-base" style={{ color: 'rgba(244,232,209,.86)' }}>
            Туршилтын хөтөлбөрт нэг бүтэн сургууль бүртгүүлж, MozaTeach-ийн бүх дөрвөн үүдийг үнэгүй
            ашиглах боломжтой. Багш, эцэг эх, сурагчдад зориулсан суурь сургалтыг хамт хүргэнэ.
          </p>
        </div>
        <div className="st-reveal flex flex-col gap-3">
          <StLinkButton
            href="/login?role=SCHOOL_ADMIN"
            variant="brass"
            size="md"
            className="justify-center"
          >
            Сургуулиа бүртгүүлэх →
          </StLinkButton>
          <StLinkButton href="/login" variant="secondary" size="md" className="justify-center">
            Демо захиалах
          </StLinkButton>
          <p
            className="mt-1 font-mono text-[11px] tracking-[0.14em]"
            style={{ color: 'rgba(244,232,209,.6)' }}
          >
            HELLO@MOZATEACH.MN · +976 7000 0000
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_COLS: { h: string; links: string[] }[] = [
  { h: 'Хэрэглэгчид', links: ['Сурагч', 'Багш', 'Эцэг эх', 'Захиргаа'] },
  {
    h: 'Бүтээгдэхүүн',
    links: ['Сурагчийн нүүр', 'Багшийн самбар', 'Олимпиадын лавлах', 'Тэтгэлгийн сан'],
  },
  { h: 'Холбоо', links: ['Бичлэг үзэх', 'Бичиг баримт', 'Тусламж', 'support@mozateach.mn'] },
];

function LandingFooter() {
  return (
    <footer style={{ background: 'var(--st-soot)', color: 'var(--st-felt)' }}>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div
          className="grid gap-10 border-b pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"
          style={{ borderColor: 'rgba(185,132,56,.25)' }}
        >
          <div>
            <p className="font-display text-[22px] font-bold" style={{ color: 'var(--st-paper)' }}>
              Moza<span style={{ color: 'var(--st-ember-bright)' }}>Teach</span>
            </p>
            <p
              className="mt-2 max-w-[36ch] text-[13px] leading-relaxed"
              style={{ color: 'rgba(244,232,209,.6)' }}
            >
              Боловсролын нэгдсэн систем.
            </p>
          </div>
          {FOOTER_COLS.map((col) => (
            <div key={col.h}>
              <h5
                className="font-mono text-[10.5px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--st-brass-bright)' }}
              >
                {col.h}
              </h5>
              <ul
                className="mt-3.5 grid gap-2 text-[13.5px]"
                style={{ color: 'rgba(244,232,209,.78)' }}
              >
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="flex flex-col gap-2 pt-6 font-mono text-[11px] uppercase tracking-[0.12em] sm:flex-row sm:justify-between"
          style={{ color: 'rgba(244,232,209,.5)' }}
        >
          <span>© 2026 MozaTeach · Улаанбаатар</span>
          <span>Боловсролын хүртээмжийг хүүхэд бүрт</span>
        </div>
      </div>
    </footer>
  );
}
