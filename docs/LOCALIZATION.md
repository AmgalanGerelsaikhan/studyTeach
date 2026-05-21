# Localization

> The platform is Mongolian-first. This document is the working reference for translators, designers, and engineers. Owner: `mongolian-localization` agent.

## Locales

| Code | Use |
|---|---|
| `mn-Cyrl` | **Default.** All UI, errors, SMS, USSD. |
| `mn-Latn` | Transliteration toggle for keyboard-constrained devices. Same source strings as `mn-Cyrl`; generated via MNS 5217:2012 table. |
| `en` | Study Abroad Hub content, Teacher Academy English track, AI Application Coach English mode. Not a complete UI locale. |

## Catalog layout

```
apps/web/lib/i18n/
  mn-Cyrl/
    common.json          # buttons, labels, generic errors
    student.json         # student persona screens
    teacher.json         # teacher persona screens
    parent.json          # parent persona screens
    admin.json           # school admin + platform admin
    ai-refusals.json     # canonical AI Tutor refusal text
    sms.json             # SMS + USSD templates
    glossary.json        # curriculum + cultural terminology
  mn-Latn/               # transliterated; build-time generated
  en/                    # hand-translated subset
  translit/
    mns-5217.ts          # transliteration table
```

## Key naming

Hierarchical dot-keys aligned to component tree:

```
student.home.hero.greeting        = "Сайн байна уу, {name}"
student.home.streak.label         = "ДЭС ДАРААЛАН · ӨДӨР"
ai-tutor.refusal.exam-mode        = "ЭЕШ загвар шалгалт идэвхтэй байна. Шалгалтын дараа ярилцъя."
sms.parent.registration-paid      = "Төлбөр {amount}₮ төлөгдсөн. Тасалбар {url}"
```

## SMS / USSD rules

- **Mongolian Cyrillic SMS = UCS-2 encoding** = ~70 characters per segment.
- Budget: ≤2 segments. If a template needs more, redesign.
- Active-voice imperatives.
- Inbound keywords: `СТАТУС` / `STATUS` query, `ЗОГС` / `STOP` opt-out (legally required).
- Single-message preferred. If two segments, break at sentence boundary, never mid-word.

USSD menus:
- Max 4 levels deep.
- Max 6 options per level.
- Max 18 Latin characters per option label (provider constraint).

## Transliteration (MNS 5217:2012)

Source-of-truth table — partial:

| Cyrillic | Latin |
|---|---|
| А | a |
| Б | b |
| В | v |
| Г | g |
| Д | d |
| Е | ye |
| Ё | yo |
| Ж | j |
| З | z |
| И | i |
| Й | i |
| К | k |
| Л | l |
| М | m |
| Н | n |
| О | o |
| Ө | ö |
| П | p |
| Р | r |
| С | s |
| Т | t |
| У | u |
| Ү | ü |
| Ф | f |
| Х | kh |
| Ц | ts |
| Ч | ch |
| Ш | sh |
| Щ | shch |
| Ъ | " |
| Ы | y |
| Ь | ' |
| Э | e |
| Ю | yu |
| Я | ya |

Full table in `apps/web/lib/i18n/translit/mns-5217.ts`. Person names follow passport romanization where different.

## Cultural conventions

- **Names.** Mongolian convention is "patronymic-initial. given-name" in formal contexts: `Ц. Оюунгэрэл`. Honor in lists, greetings, transcripts.
- **Dates.** Display `YYYY/MM/DD` numerically; written formally as `2026 оны 5 сарын 20`. Month names localized; never inline.
- **Geography.** "aimag" (province) and "soum" (district) lowercase in English copy. Mongolian capitalization follows Mongolian orthography.
- **Currency.** Tögrög, `₮` symbol after the number with a thin space: `180 000 ₮`. Thousands separator is a non-breaking space, not a comma.
- **Phone numbers.** `+976` country code; display as `+976 8X XX XX XX` for mobile, `+976 11 XXX XXX` for landline.

## Curriculum glossary

Curriculum-specific Mongolian terminology is maintained by the Moza pedagogy team. The AI Tutor and any curriculum-facing UI must use the glossary; never invent terminology.

Example entries (from `glossary.json`):

```json
{
  "physics.torque": "Хүчний момент",
  "physics.angular_momentum": "Эргэх моментум",
  "math.logarithm": "Логарифм",
  "math.equation": "Тэгшитгэл",
  "chem.molarity": "Молярлал",
  "bio.photosynthesis": "Фотосинтез",
  "mongol.essay": "Эсээ"
}
```

## Refusal text (canonical)

Refusals live in `ai-refusals.json` and may never be paraphrased inline. The four canonical refusals:

| Key | Trigger | Text (mn-Cyrl) |
|---|---|---|
| `ai-tutor.refusal.exam-mode` | Active mock-test session | "ЭЕШ загвар шалгалт идэвхтэй байна. Шалгалтын дараа ярилцъя." |
| `ai-tutor.refusal.write-essay` | Student asks tutor to write an essay | "Эссэ бичиж өгөхгүй. Гэхдээ чиний бичсэн хэсгийг хамтдаа сайжруулъя." |
| `app-coach.refusal.blank-statement` | Coach asked for personal statement from blank input | "Эхний ноорог буюу бүтэцтэй төлөвлөгөө илгээсний дараа эхэлье." |
| `ai-tutor.refusal.non-academic` | Off-topic chitchat | (Redirect, not refusal: "Бид одоо {topic}-ын талаар ярилцаж байна. Энэ сэдэв рүү буцъя.") |

Localized copies live in `mn-Latn/ai-refusals.json` and `en/ai-refusals.json`.

## Testing

- Every test that exercises a string must use Mongolian Cyrillic fixtures.
- Snapshot tests use the `mn-Cyrl` locale by default.
- Visual regression includes a pass with the longest known translations to catch overflow.
- SMS template tests assert ≤2 GSM-7/UCS-2 segments.

## Process for adding a new string

1. Frontend/backend agent adds an i18n key with `mn-Cyrl` placeholder and opens PR.
2. `mongolian-localization` writes the production `mn-Cyrl` string.
3. The Latin transliteration is auto-generated.
4. If the string is user-facing in Study Abroad Hub or Teacher Academy English, English translation added in same PR.
5. If the string is a refusal or wellbeing prompt, escalate to user + Moza reviewer.
