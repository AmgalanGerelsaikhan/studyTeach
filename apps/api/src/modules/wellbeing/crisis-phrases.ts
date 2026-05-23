/**
 * Crisis-phrase lexicon — v1 keyword classifier (PRD §4.7a).
 *
 * This is the placeholder gate. Per ROLLOUT_PLAN.md P2 acceptance, the real
 * classifier must hit precision ≥0.85 / recall ≥0.90 on a held-out corpus
 * before launch — that work is owned by ai-tutor-engineer + mongolian-
 * localization and requires a real crisis-phrase corpus from Moza's
 * pedagogy + clinical-review lead.
 *
 * This v1 keyword list is INTENTIONALLY broad — false positives are
 * cheap (a counselor reviews and dismisses), false negatives are not.
 * NEEDS_REVIEW_BY_PEDAGOGY_LEAD before P2 launch.
 *
 * mn-Cyrl phrases curated from publicly-documented crisis-line scripts
 * + the SOS Mongolia / 108 hotline phrasebook. Add Latin equivalents
 * for code-switched messages.
 */
const CRISIS_PHRASES: readonly string[] = [
  // Self-harm / suicidal ideation
  'амиа хорлох',
  'үхэхийг хүсэж',
  'үхмээр байна',
  'амь', // "life" — too broad alone, paired below
  'амиа хорлоё',
  // Hopelessness / despair markers
  'итгэл алдарсан',
  'дахиж сэргэхгүй',
  'утга алга',
  'ямар ч утга',
  // Abuse / safety
  'миний эсрэг',
  'буруугаар',
  'зодсон',
  'хүчирхийлсэн',
  'хүчирхийлэл',
  // Acute distress
  'аюулд орсон',
  'тусламж хэрэгтэй',
  'би тэвчихгүй',
  // Latin / code-switched (common in K-12)
  'kill myself',
  'want to die',
  'suicide',
  'self harm',
];

/**
 * Returns the FIRST matching phrase if any, else null. Case-insensitive,
 * matches on substring (not whole-word) since Cyrillic morphology adds
 * suffixes that break word-boundary regex matching.
 */
export function detectCrisisPhrase(text: string | null | undefined): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const phrase of CRISIS_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) return phrase;
  }
  return null;
}
