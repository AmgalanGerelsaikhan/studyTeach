import type { RefusalKey } from '@studyteach/contracts';

export interface ClassifierInput {
  userText: string;
  /** Mirrors ai_tutor_sessions.in_active_mock_test. */
  inActiveMockTest: boolean;
  /** Optional recent transcript — currently unused; reserved for the "repeated
   * non-academic chitchat" heuristic that ramps from one-shot to refusal. */
  recentUserTurns?: readonly string[];
}

/**
 * In-process refusal classifier (lightweight, no LLM call). Returns the
 * canonical RefusalKey to render, or `null` if the request is permissible.
 *
 * Three principles drive the design (PRD §4.1, CLAUDE.md constraint #7):
 *
 *   1. Exam-mode is hard-locked: when a mock test is active, the tutor refuses
 *      regardless of what was asked. No keyword matching — the session flag is
 *      authoritative.
 *   2. Personal-statement and "write my essay" refusals are keyword-driven
 *      against the user's text. False positives are worse than false
 *      negatives (a needed help-on-paragraph request must NOT be refused),
 *      so the patterns are conservative — they look for explicit
 *      "write/draft a personal statement | essay | application" intents,
 *      not the noun on its own.
 *   3. Non-academic chitchat is the only soft refusal — it tolerates one
 *      greeting then refuses on the second/third. Today's implementation
 *      treats it as one-shot; the ramp-up reads from `recentUserTurns` once
 *      the transcript shape is finalized in Wave D.
 */
export function classifyRefusal(input: ClassifierInput): RefusalKey | null {
  if (input.inActiveMockTest) return 'ai-tutor.refusal.exam-mode';

  const text = input.userText.trim();
  if (text.length === 0) return null;
  const normalized = text.toLowerCase();

  // ── App-Coach scope: blank personal-statement request ──
  // mn-Cyrl: «миний өмнөөс хувийн мэдэгдэл бич(их|ээч|ье)»
  // en: «write my personal statement (for me)»
  if (
    PATTERNS.blankStatement.some((re) => re.test(normalized)) ||
    PATTERNS.blankStatementCyrl.some((re) => re.test(text))
  ) {
    return 'app-coach.refusal.blank-statement';
  }

  // ── Tutor scope: write-essay-from-scratch ──
  // mn-Cyrl: «эссэ/зохион бичлэг/илтгэл (бичээч|бичиж өгөөч)»
  // en: «write my essay / do my homework essay»
  if (
    PATTERNS.writeEssay.some((re) => re.test(normalized)) ||
    PATTERNS.writeEssayCyrl.some((re) => re.test(text))
  ) {
    return 'ai-tutor.refusal.write-essay';
  }

  // ── Non-academic chitchat ──
  // Bare greeting with no follow-up question.
  if (PATTERNS.bareGreeting.some((re) => re.test(text))) {
    return 'ai-tutor.refusal.non-academic';
  }

  return null;
}

// Mongolian nouns/verbs take agglutinative suffixes (мэдэгдэл → мэдэгдлээ,
// эссэ → эссэг, etc.), so the noun-stem patterns trail with `\p{L}*` under the
// /u flag to swallow whatever case ending follows. The verb side is locked to
// the imperative-with-particle forms (бичээч / бичье / бичиж өгөөч /
// бичээд өгөөч) — bare infinitive "бичих" must NOT match, otherwise we'd
// refuse a question *about* how to write essays.
const PATTERNS = {
  blankStatement: [
    /write\s+(my|a)\s+personal\s+statement/,
    /draft\s+(my|a)\s+personal\s+statement/,
    /personal\s+statement\s+(for me|from scratch)/,
  ],
  blankStatementCyrl: [
    /(хувийн\s+мэдэгд\p{L}*|өргөдөл\p{L}*).*(бич(ээч|ье|иж\s+өгөөч|ээд\s+өгөөч))/iu,
    /(миний\s+өмнөөс).*(хувийн\s+мэдэгд\p{L}*)/iu,
  ],
  writeEssay: [
    /write\s+(my|an?)\s+essay/,
    /do\s+my\s+(homework\s+)?essay/,
    /draft\s+(my|an?)\s+essay/,
  ],
  writeEssayCyrl: [
    /(эссэ\p{L}*|зохион\s+бичлэг\p{L}*|илтгэл\p{L}*).*(бич(ээч|ье|иж\s+өгөөч|ээд\s+өгөөч))/iu,
    /(миний\s+өмнөөс).*(эссэ|зохион\s+бичлэг|илтгэл)/iu,
  ],
  bareGreeting: [
    /^(сайн уу|сайн байна уу|hi|hello|hey|yo)[!.?\s]*$/i,
    /^(юу хийж байна|what'?s up|wyd)[!.?\s]*$/i,
  ],
};
