/**
 * Latn ⇄ Cyrl preview helper, deliberately simple.
 *
 * Real MNS 5217:2003 transliteration is context-sensitive (placement of «е/я/ё»,
 * implicit «ы» on consonant-only stems, etc.). For the input-bar toggle the goal
 * is *legible preview* of what the user typed, not a publication-grade rendering
 * — so we use longest-match digraph mapping then single-letter mapping. Good
 * enough for the affordance; the backend always receives the rendered Cyrillic
 * string when the user submits.
 *
 * Reverse direction (Cyrl → Latn) is provided for symmetric preview but is
 * currently unused by the UI.
 */
const LATN_TO_CYRL_DIGRAPHS: readonly [string, string][] = [
  ['yo', 'ё'],
  ['Yo', 'Ё'],
  ['YO', 'Ё'],
  ['zh', 'ж'],
  ['Zh', 'Ж'],
  ['ZH', 'Ж'],
  ['ch', 'ч'],
  ['Ch', 'Ч'],
  ['CH', 'Ч'],
  ['sh', 'ш'],
  ['Sh', 'Ш'],
  ['SH', 'Ш'],
  ['ts', 'ц'],
  ['Ts', 'Ц'],
  ['TS', 'Ц'],
  ['kh', 'х'],
  ['Kh', 'Х'],
  ['KH', 'Х'],
  ['ya', 'я'],
  ['Ya', 'Я'],
  ['YA', 'Я'],
  ['yu', 'ю'],
  ['Yu', 'Ю'],
  ['YU', 'Ю'],
  ['ye', 'е'],
  ['Ye', 'Е'],
  ['YE', 'Е'],
  ['ng', 'нг'],
  ['Ng', 'Нг'],
  ['NG', 'НГ'],
];

const LATN_TO_CYRL_SINGLES: Record<string, string> = {
  a: 'а',
  b: 'б',
  v: 'в',
  g: 'г',
  d: 'д',
  e: 'э',
  z: 'з',
  i: 'и',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  f: 'ф',
  q: 'к',
  c: 'к',
  h: 'х',
  j: 'ж',
  w: 'в',
  x: 'х',
  y: 'й',
  ö: 'ө',
  ü: 'ү',
};

export function latnToCyrl(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    let matched = false;
    for (const [latn, cyrl] of LATN_TO_CYRL_DIGRAPHS) {
      if (input.startsWith(latn, i)) {
        out += cyrl;
        i += latn.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const ch = input[i] ?? '';
    const lower = ch.toLowerCase();
    const mapped = LATN_TO_CYRL_SINGLES[lower];
    if (mapped) {
      out += ch === lower ? mapped : mapped.toUpperCase();
    } else {
      out += ch;
    }
    i += 1;
  }
  return out;
}

const CYRL_TO_LATN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'ye',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  ө: 'ö',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ү: 'ü',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export function cyrlToLatn(input: string): string {
  let out = '';
  for (const ch of input) {
    const lower = ch.toLowerCase();
    const mapped = CYRL_TO_LATN[lower];
    if (mapped !== undefined) {
      out += ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    } else {
      out += ch;
    }
  }
  return out;
}
