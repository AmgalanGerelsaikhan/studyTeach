import Link from 'next/link';

import { StButton, StCard, StChip, StIcon, StMeander, StSoyomboFlame } from '@/components/st';

/**
 * studyTeach public landing one-pager — the home screen at `/`.
 * Converted from `landingpage/Тест/landing/index.html` into the shared
 * Ger Interior design system. mn-Cyrl only (CLAUDE.md constraint #1);
 * marketing copy is intentionally hardcoded rather than i18n-keyed.
 *
 * "Нэвтрэх" / "Туршиж үзэх" both route to /login, where the visitor
 * picks their role (student / teacher / parent / school / admin).
 */
export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--st-cream)' }}>
      <LandingNav />
      <Hero />
      <Portals />
      <CtaBand />
      <LandingFooter />
    </div>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{
        background: 'rgba(251, 243, 226, 0.92)',
        borderColor: 'rgba(185, 132, 56, 0.3)',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <StSoyomboFlame size={26} />
          <span className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
            studyTeach
          </span>
        </Link>
        <nav
          aria-label="Үндсэн цэс"
          className="ml-4 hidden items-center gap-5 text-sm font-semibold md:flex"
          style={{ color: 'var(--st-ink-2)' }}
        >
          <a href="#portals">Хэрэглэгчид</a>
          <a href="#features">Бүтээгдэхүүн</a>
          <a href="#cta">Эхлэх</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login">
            <StButton type="button" variant="ghost" size="sm">
              Нэвтрэх
            </StButton>
          </Link>
          <Link href="/login" className="hidden sm:inline-flex">
            <StButton type="button" variant="primary" size="sm">
              <StIcon name="arrow_r" size={13} />
              Туршиж үзэх
            </StButton>
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

const HERO_META: { num: string; lbl: string }[] = [
  { num: '13', lbl: 'Дэлгэцийн дизайн' },
  { num: '5', lbl: 'Хэрэглэгчийн төрөл' },
  { num: '21', lbl: 'Аймаг хамруулна' },
  { num: 'Кирилл', lbl: 'Эх хэлээр' },
];

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p
        className="text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--st-ember)' }}
      >
        № 01 · Боловсролын нэгдсэн платформ
      </p>
      <h1
        className="mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl"
        style={{ color: 'var(--st-soot)' }}
      >
        Бүхэл системийн <span style={{ color: 'var(--st-ember)' }}>нэг талбарт</span>
      </h1>
      <p
        className="mt-4 max-w-2xl text-base leading-relaxed sm:text-lg"
        style={{ color: 'var(--st-ink-2)' }}
      >
        Сурагч, багш, эцэг эх, сургууль, хүн бүр өөрийн үүдээр орж, мэдээлэл нэг гэрт нэгдэнэ.
        Хөрөгчилсөн боловсролын үндэсний тогтолцоо.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/login">
          <StButton type="button" variant="primary" size="md">
            <StIcon name="arrow_r" size={14} />
            Сургуулиа холбох
          </StButton>
        </Link>
        <a href="#features">
          <StButton type="button" variant="secondary" size="md">
            <StIcon name="play" size={14} />
            Хэрхэн ажилладгийг үзэх
          </StButton>
        </a>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {HERO_META.map((m) => (
          <div
            key={m.lbl}
            className="rounded-st-md border p-4"
            style={{
              borderColor: 'rgba(185, 132, 56, 0.35)',
              background: 'var(--st-paper)',
            }}
          >
            <dt
              className="font-display text-2xl font-bold sm:text-3xl"
              style={{ color: 'var(--st-ember)' }}
            >
              {m.num}
            </dt>
            <dd
              className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'var(--st-ink-3)' }}
            >
              {m.lbl}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ── Portals ──────────────────────────────────────────────────────────────────

interface Portal {
  role: string;
  eyebrow: string;
  points: string[];
  icon: 'school' | 'users' | 'heart' | 'shield' | 'flag';
  href: string;
}

const PORTALS: Portal[] = [
  {
    role: 'Сурагч',
    eyebrow: 'Сурагчид зориулсан',
    points: [
      'Өнөөдрийн ширээ ба даалгавар',
      'Олимпиадын лавлах, тоон тасалбар',
      'Сэтгэл санааны пульс',
      'Фокус горим',
    ],
    icon: 'school',
    href: '/login',
  },
  {
    role: 'Багш',
    eyebrow: 'Багш нарт зориулсан',
    points: [
      'Хоёр горимт самбар',
      'Ангийн сэтгэл санааны пульс',
      'Багшийн академи',
      'Эртний дэмжлэгийн дохио',
    ],
    icon: 'users',
    href: '/login',
  },
  {
    role: 'Эцэг эх',
    eyebrow: 'Эцэг эхэд зориулсан',
    points: [
      'Хүүхдийн өдрийн зам',
      'Дэмжлэгт хамруулах урилга',
      'Багштай шууд харилцах',
      'Тэтгэлгийн боломж',
    ],
    icon: 'heart',
    href: '/login',
  },
  {
    role: 'Захиргаа',
    eyebrow: 'Захиргаанд зориулсан',
    points: [
      'Захирлын самбар',
      'Тэтгэлгийн нэгдсэн сан',
      'Гадаад сургуулийн хаб',
      'Орны үндсэн зураг',
    ],
    icon: 'flag',
    href: '/login',
  },
];

function Portals() {
  return (
    <section
      id="portals"
      className="border-y"
      style={{
        background: 'var(--st-paper)',
        borderColor: 'rgba(185, 132, 56, 0.3)',
      }}
    >
      <StMeander tone="ember" height={10} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" id="features">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-ember)' }}
        >
          № 02 · Дөрвөн үүд
        </p>
        <h2
          className="mt-2 font-display text-2xl font-bold sm:text-3xl"
          style={{ color: 'var(--st-soot)' }}
        >
          Хүн бүр өөрийн үүдээр орно
        </h2>
        <p className="mt-2 max-w-xl text-sm" style={{ color: 'var(--st-ink-2)' }}>
          Мэдээлэл нэг гэрт — хэрэглэгчийн төрөл бүр өөрийн харагдацтай.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PORTALS.map((p) => (
            <StCard key={p.role} padding="md" className="flex flex-col">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl border"
                style={{
                  background: 'var(--st-felt)',
                  borderColor: 'rgba(185, 132, 56, 0.4)',
                }}
              >
                <StIcon name={p.icon} size={20} />
              </span>
              <p
                className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: 'var(--st-brass-dark)' }}
              >
                {p.eyebrow}
              </p>
              <h3
                className="mt-1 font-display text-lg font-bold"
                style={{ color: 'var(--st-soot)' }}
              >
                {p.role}
              </h3>
              <ul className="mt-2 flex flex-1 flex-col gap-1.5">
                {p.points.map((pt) => (
                  <li
                    key={pt}
                    className="flex items-start gap-1.5 text-[13px]"
                    style={{ color: 'var(--st-ink-2)' }}
                  >
                    <span className="mt-0.5 flex-shrink-0">
                      <StIcon name="check" size={11} color="var(--st-moss)" />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
              <Link href={p.href} className="mt-4">
                <StButton type="button" variant="secondary" size="sm" className="w-full">
                  Нэвтрэх
                  <StIcon name="arrow_r" size={12} />
                </StButton>
              </Link>
            </StCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ──────────────────────────────────────────────────────────────────────

function CtaBand() {
  return (
    <section id="cta" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <StCard variant="ember" padding="lg" className="relative overflow-hidden text-center">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: '#F4C99A' }}
        >
          № 07 · Эхлэх
        </p>
        <h2
          className="mt-2 font-display text-2xl font-bold sm:text-3xl"
          style={{ color: '#FBF3E2' }}
        >
          Сургуулиа эхний 14 хоногт холбоно
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: '#F4E8D1', opacity: 0.9 }}>
          Үлдсэнийг бид угаана. Боловсрол нь нэг үндэстний урт хичээл.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/login">
            <StButton type="button" variant="brass" size="md">
              <StIcon name="arrow_r" size={14} />
              Сургуулиа бүртгүүлэх
            </StButton>
          </Link>
          <Link href="/login">
            <StButton
              type="button"
              variant="ghost"
              size="md"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#FBF3E2',
                borderColor: 'rgba(244,201,154,0.4)',
              }}
            >
              Демо захиалах
            </StButton>
          </Link>
        </div>
        <div className="-mx-7 -mb-7 mt-6">
          <StMeander tone="ember" height={12} />
        </div>
      </StCard>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer
      className="border-t"
      style={{
        background: 'var(--st-soot)',
        borderColor: 'var(--st-brass-dark)',
        color: '#D8BC85',
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-2">
          <StSoyomboFlame size={22} color="#D4A24C" />
          <span className="font-display text-base font-bold" style={{ color: '#FBF3E2' }}>
            studyTeach
          </span>
        </div>
        <p className="text-xs sm:ml-auto">© 2026 studyTeach · Улаанбаатар</p>
        <StChip tone="brass">Боловсрол нь нэг үндэстний урт хичээл</StChip>
      </div>
    </footer>
  );
}
