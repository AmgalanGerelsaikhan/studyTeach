# Design System — Ger Interior

> The visual identity of MozaTeach. Source-of-truth tokens are in `studyTeach (2)/tokens.css`; motif SVGs in `studyTeach (2)/motifs.jsx`. This document is the conceptual reference and the bridge to the application implementation in `apps/web/components/st/`.

## North star

A Mongolian ger at warm lamplight. Wool felt, lacquered orange-red wood, brass fittings, and warm shadows. The interior is _quiet, considered, and culturally grounded_ — not "ethnic decoration on a generic SaaS chrome." Every screen should feel like it belongs in the same room.

## Colors

### Felt & paper (surfaces)

| Token            | Value     | Use                         |
| ---------------- | --------- | --------------------------- |
| `--st-cream`     | `#F4E8D1` | Primary surface (wool felt) |
| `--st-paper`     | `#FBF3E2` | Card surface (lighter)      |
| `--st-paper-2`   | `#EFE0BF` | Recessed panel              |
| `--st-felt`      | `#E8D5AF` | Heavier felt edge           |
| `--st-felt-deep` | `#D8BC85` | Deepest felt                |

### Lacquered ember (action)

| Token               | Value     | Use                      |
| ------------------- | --------- | ------------------------ |
| `--st-ember`        | `#C2410C` | Primary action           |
| `--st-ember-bright` | `#E2570D` | Highlight                |
| `--st-ember-deep`   | `#9A2F08` | Shadowed lacquer; danger |
| `--st-cinnabar`     | `#7E1D0A` | Deepest red lacquer      |

### Brass (line & accent)

| Token               | Value     | Use                            |
| ------------------- | --------- | ------------------------------ |
| `--st-brass`        | `#B98438` | Base brass                     |
| `--st-brass-bright` | `#D4A24C` | Polished brass (active states) |
| `--st-brass-dark`   | `#8C5F22` | Tarnished brass (borders)      |

### Warm shadow & ink

| Token        | Value     | Use                              |
| ------------ | --------- | -------------------------------- |
| `--st-soot`  | `#2A1810` | Deepest shadow / inverse surface |
| `--st-ink`   | `#3A2818` | Body text                        |
| `--st-ink-2` | `#5C4530` | Secondary text                   |
| `--st-ink-3` | `#836340` | Tertiary text                    |

### Steppe & sky accents

| Token              | Value     | Use                             |
| ------------------ | --------- | ------------------------------- |
| `--st-steppe`      | `#6B5538` | Earthy tan accent               |
| `--st-sky`         | `#3E5F73` | Toono (roof opening) muted teal |
| `--st-sky-bright`  | `#5B8AA3` |                                 |
| `--st-moss`        | `#5C6B3B` | Approved / safe                 |
| `--st-moss-bright` | `#7E8E4C` |                                 |

### Status

| Token          | Value     | Use              |
| -------------- | --------- | ---------------- |
| `--st-success` | `#5C6B3B` | Moss             |
| `--st-warn`    | `#C28A1A` | Honey amber      |
| `--st-danger`  | `#9A2F08` | Deep lacquer red |

**Rules.** Never pure black, never pure white. Body text on cream gets `--st-ink` (contrast 11:1). Ember on cream is 4.6:1 — usable only for large text and CTAs.

## Typography

| Family                         | Use                                                                     |
| ------------------------------ | ----------------------------------------------------------------------- |
| `Bitter` (serif)               | Display headings (`.st-h1`, `.st-h2`, `.st-h3`, `.st-display`)          |
| `Manrope` (sans)               | Body, UI                                                                |
| `Noto Serif Mongolian`         | Script Mongolian fallback (vertical script reserved for ceremonial use) |
| `tabular-nums` numeric variant | All numeric values (`st-num`) — scores, counts, currency                |

Type scale (ramp matches `tokens.css`):

| Class        | Size / Line-height                  | Weight | Use                |
| ------------ | ----------------------------------- | ------ | ------------------ |
| `st-h1`      | 32 / 1.1                            | 700    | Page hero          |
| `st-h2`      | 22 / 1.15                           | 700    | Section heading    |
| `st-h3`      | 16 / 1.2                            | 600    | Subsection         |
| `st-eyebrow` | 11 / 1.3, 0.18em tracked, uppercase | 700    | Category label     |
| `st-body`    | 14 / 1.5                            | 400    | Body               |
| `st-small`   | 12 / 1.4                            | 400    | Secondary          |
| `st-tiny`    | 10.5 / 1.3                          | 400    | Caption / metadata |

Mongolian Cyrillic line-height must accommodate diacritics — body line-height ≥1.5 enforced.

## Spacing & layout

- **Spacing scale:** 4, 8, 12, 16, 22, 28, 40. Nothing else.
- **Radius scale:** `--st-r-sm` 6, `-md` 10, `-lg` 16, `-xl` 22.
- **Container max-width:** 1280 (desktop artboards), 390 (mobile artboards).
- **Grid:** 12-col on desktop with 22px gutter, 4-col on mobile with 16px gutter.

## Shadows

Warm, never pure black.

```css
--st-shadow-sm: 0 1px 0 rgba(42, 24, 16, 0.06), 0 2px 6px rgba(154, 47, 8, 0.08);
--st-shadow-md: 0 1px 0 rgba(42, 24, 16, 0.08), 0 6px 16px rgba(154, 47, 8, 0.1);
--st-shadow-lg: 0 2px 0 rgba(42, 24, 16, 0.1), 0 18px 40px rgba(154, 47, 8, 0.14);
--st-shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(42, 24, 16, 0.08);
```

## Motifs (closed inventory in v2.0.0)

| Motif                                           | Component                    | Use                                         |
| ----------------------------------------------- | ---------------------------- | ------------------------------------------- |
| **Soyombo flame** (abstract three-tongue flame) | `StSoyomboFlame`             | Brand mark, AI Tutor identity, streak icon  |
| **Khamar khee** (Greek-key meander)             | `StMeander`, `StPatternBand` | Decorative horizontal band between sections |
| **Ulzii** (eternal knot)                        | `StUlzii`                    | Decorative inset, certificate accents       |
| **Brass corner brackets**                       | `StCornerBracket`            | Card corners (urgent/featured states)       |
| **Brass tacks**                                 | `StBrassTack`, `.st-tacked`  | Decorative studs on lacquer cards           |
| **Toono medallion** (radial)                    | `StToonoMedallion`           | Hero card centerpiece (sparingly)           |

Decoration is toggleable via the `decoration` user setting. With decoration off, the UI must remain fully functional and legible.

## Components (inventory)

The prototype defines these. All real implementations live in `apps/web/components/st/`.

| Component                        | Variants                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StCard`                         | default, `Ember` (lacquered), `Soot` (dark inverse)                                                                                                                                                                                                                                                                                                                             |
| `StButton` / `StLinkButton`      | Variants `primary` (ember), `secondary` (paper), `brass`, `ghost`. Sizes `sm` / `md` / `lg`. See "Button variant semantics" below for which intent maps to which variant. `StLinkButton` renders an `<a>` via next/link with identical visuals — required whenever the control's action is "navigate to URL".                                                                   |
| `StInput`                        | text, select, textarea (same base)                                                                                                                                                                                                                                                                                                                                              |
| `StChip`                         | default, `Ember`, `Brass`, `Moss`, `Sky`, `Soot`                                                                                                                                                                                                                                                                                                                                |
| `StTab`                          | default, `Brass` (active state styled brass)                                                                                                                                                                                                                                                                                                                                    |
| `StAvatar`                       | default (ember), `Brass`, `Sky`, `Moss`                                                                                                                                                                                                                                                                                                                                         |
| `StProgress`                     | linear (brass → ember gradient fill)                                                                                                                                                                                                                                                                                                                                            |
| `StDivider` / `StDividerVert`    | brass gradient rule                                                                                                                                                                                                                                                                                                                                                             |
| `StMeander`                      | `brass`, `ember`, `soot` tones                                                                                                                                                                                                                                                                                                                                                  |
| `StSubjectGlyph`                 | math, physics, chem, bio, history, english, mongolian, info                                                                                                                                                                                                                                                                                                                     |
| `StIcon`                         | ~50-glyph set (home, book, chat, trophy, ticket, chart, users, user, upload, download, settings, bell, search, filter, check, x, plus, minus, arrow_r, arrow_l, chevron_r/d/u, lock, unlock, play, pause, pencil, sms, phone, wifi_off, map, clock, target, heart, shield, globe, sparkle, flag, qr, file, folder, star, calendar, cash, award, school, yurt, mic, pin, eye, …) |
| `StPhoneBezel` / `StPhoneScreen` | mobile mockup frame                                                                                                                                                                                                                                                                                                                                                             |

## Button variant semantics

The four `StButton` / `StLinkButton` variants are not interchangeable. Pick by **intent**, not by color preference.

| Variant     | Use for                                            | Examples                                                                  |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| `primary`   | The dominant action in a surface (one per context) | Submit form, Enroll, Send message, Pay invoice                            |
| `brass`     | Branded entry to a named MozaTeach product surface | Open AI Tutor, Open EGSh, Open Olympiad detail, Tutor nudge "ask now" CTA |
| `secondary` | Neutral default — back, cancel, view, retake       | Back to list, Cancel, Retake quiz, View details                           |
| `ghost`     | Tertiary / icon-only / inline kebabs               | Inline edit icon, dismiss-X, table-row "more" menu                        |

**Sizes.** `sm` for inline-with-text card footers; `md` for the standard CTA; `lg` only for full-page forms (e.g. Focus Mode start form).

**Navigation-as-button.** Wrapping `<StButton>` inside `<Link>` is **invalid HTML** (button-in-anchor) and triggers a React hydration warning. Use `StLinkButton` instead — it renders an `<a>` via next/link with the identical visual tokens.

## Accessibility

- **Target:** WCAG 2.1 AA by P1; AAA contrast for body text where reasonable.
- **Focus rings:** ember at 3px outer ring, 15% opacity. Always visible on `:focus-visible`.
- **Touch targets:** ≥44px on mobile.
- **Motion:** all animation respects `prefers-reduced-motion` (notably the `StSoyomboFlame` pulse).
- **Decorative motifs** are `aria-hidden="true"`.
- **Mongolian Cyrillic** screen reader pronunciation tested with NVDA + JAWS Mongolian language pack.

## Persona chrome

Each persona has distinct chrome that signals context:

- **Student** — top bar with persona pill "СУРАГЧ", tabs Нүүр / AI Багш / ЭЕШ / Олимпиад / Гадаад, offline indicator, bell, brass avatar.
- **Teacher** — left sidebar with mode toggle (Сурагчид / Би өөрөө), nav (Удирдлагын самбар, Сурагчид, Бүртгэл оруулах, Шинжилгээ, Багшийн академи, Фокус горим, Хичээлийн материал), bottom user pill.
- **Parent / Family** — mobile-first frame, child-selector tabs, SMS preview panel.
- **School Admin** — desktop dashboard with risk widgets.
- **Pathway** — destination-tabbed hub with scholarship aggregator grid.

## High-stakes context (exam mode)

EGSh mock-test screens use full soot-gradient chrome (`#2A1810` → `#1A0F08`) signaling a high-stakes environment. Proctor camera badge and tab-lock badge are visible. This is the only screen family that uses inverse surfaces by default.

## Decoration density

The prototype ships at **60% decoration density** by default — visible but tasteful. Density levels:

| Setting | Description                                                            |
| ------- | ---------------------------------------------------------------------- |
| `0%`    | No motifs. Pure functional UI. (Toggle off.)                           |
| `30%`   | Motifs on hero/landing screens only.                                   |
| `60%`   | Default. Section dividers + hero cards.                                |
| `100%`  | All available decorations including corner brackets, tacks, medallion. |

Density is a user setting; it does not change layout or affect tests of functional flows.
