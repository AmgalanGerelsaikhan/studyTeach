/**
 * Curated practice bank — Grade 11, mn-Cyrl.
 *
 * Two problems per strand-key from `g11.ts` so the Wave D "practice card pair"
 * always has something to render. Difficulty is 1..5 (1 easy, 5 hard);
 * source='curated' to distinguish from the future llm-validated bank.
 *
 * Idempotent under (subject, grade, lang, prompt) — see migration 0006.
 */
export interface SeedProblem {
  strand: string;
  grade: number;
  subject: 'physics' | 'math' | 'mongolian';
  lang: 'mn-Cyrl';
  prompt: string;
  answer_key: string;
  difficulty: number;
}

export const G11_PRACTICE: readonly SeedProblem[] = [
  // ── Физик · Механик ──
  {
    strand: 'Механик',
    grade: 11,
    subject: 'physics',
    lang: 'mn-Cyrl',
    prompt: '2 кг массатай биенд 6 Н хүч үйлчилбэл хурдатгал хэд байх вэ?',
    answer_key: '3 м/с² (a = F/m = 6/2)',
    difficulty: 2,
  },
  {
    strand: 'Механик',
    grade: 11,
    subject: 'physics',
    lang: 'mn-Cyrl',
    prompt:
      '5 кг массатай бие тогтмол 4 м/с хурдтай байсан. Энэ биеийн импульс ба кинетик энергийг ол.',
    answer_key: 'p = 20 кг·м/с, E_k = 40 Ж',
    difficulty: 3,
  },
  // ── Физик · Дулааны физик ──
  {
    strand: 'Дулааны физик',
    grade: 11,
    subject: 'physics',
    lang: 'mn-Cyrl',
    prompt:
      'Идеал хийн төлвийн тэгшитгэлээр 2 моль хий 300 К температурт 10 л эзэлхүүнтэй. Даралтыг (Па) ол. R = 8.31 Ж/(моль·К).',
    answer_key: 'p ≈ 4.99·10⁵ Па (p = nRT / V, V-г м³-руу хувирга: 0.01 м³)',
    difficulty: 4,
  },
  {
    strand: 'Дулааны физик',
    grade: 11,
    subject: 'physics',
    lang: 'mn-Cyrl',
    prompt:
      'Системд 200 Ж дулаан өгөхөд систем 80 Ж ажил хийсэн бол дотоод энергийн өөрчлөлт хэд байх вэ?',
    answer_key: 'ΔU = 120 Ж (Q = ΔU + A ⇒ ΔU = 200 − 80)',
    difficulty: 3,
  },
  // ── Физик · Цахилгаан соронзон ──
  {
    strand: 'Цахилгаан соронзон',
    grade: 11,
    subject: 'physics',
    lang: 'mn-Cyrl',
    prompt:
      '12 В хүчдэлтэй эх үүсвэрт 4 Ом эсэргүүцэлтэй резистор холбогдсон. Хэлхээний гүйдлийг ол.',
    answer_key: 'I = 3 А (I = U/R)',
    difficulty: 1,
  },
  {
    strand: 'Цахилгаан соронзон',
    grade: 11,
    subject: 'physics',
    lang: 'mn-Cyrl',
    prompt: '2 мкКл ба 5 мкКл цэнэгүүд 0.1 м зайтай байгаа. Кулоны хүчний хэмжээг ол. k = 9·10⁹.',
    answer_key: 'F = 9 Н (F = k·q₁·q₂/r²)',
    difficulty: 3,
  },

  // ── Математик · Алгебр ──
  {
    strand: 'Алгебр',
    grade: 11,
    subject: 'math',
    lang: 'mn-Cyrl',
    prompt: 'x² − 5x + 6 = 0 тэгшитгэлийн язгуурыг ол.',
    answer_key: 'x₁ = 2, x₂ = 3 (Виета: нийлбэр 5, үржвэр 6)',
    difficulty: 1,
  },
  {
    strand: 'Алгебр',
    grade: 11,
    subject: 'math',
    lang: 'mn-Cyrl',
    prompt: '2x² + 3x − 5 = 0 тэгшитгэлийн дискриминантыг тооцоо хийн язгуурыг ол.',
    answer_key: 'D = 49, x₁ = 1, x₂ = −2.5',
    difficulty: 2,
  },
  {
    strand: 'Алгебр',
    grade: 11,
    subject: 'math',
    lang: 'mn-Cyrl',
    prompt: 'a₁ = 3, d = 4 арифметик прогрессийн эхний 10 гишүүний нийлбэрийг ол.',
    answer_key: 'S₁₀ = 210 (S_n = n·(2a₁ + (n−1)d)/2 = 10·(6+36)/2)',
    difficulty: 2,
  },
  {
    strand: 'Алгебр',
    grade: 11,
    subject: 'math',
    lang: 'mn-Cyrl',
    prompt: 'b₁ = 2, q = 3 геометр прогрессийн эхний 4 гишүүний нийлбэрийг ол.',
    answer_key: 'S₄ = 80 (S_n = b₁·(1 − q^n)/(1 − q) = 2·(1−81)/(−2))',
    difficulty: 2,
  },
  // ── Математик · Тригонометр + Геометр ──
  {
    strand: 'Тригонометр',
    grade: 11,
    subject: 'math',
    lang: 'mn-Cyrl',
    prompt: 'sin α = 3/5 (0 < α < π/2) бол cos α, tg α-г ол.',
    answer_key: 'cos α = 4/5, tg α = 3/4 (sin² + cos² = 1)',
    difficulty: 2,
  },
  {
    strand: 'Геометр',
    grade: 11,
    subject: 'math',
    lang: 'mn-Cyrl',
    prompt:
      'Гурвалжны хоёр өнцөг 45° ба 60°, тэдгээрийн хооронд орших тал 10 см. Эсрэг талуудыг ол.',
    answer_key:
      'C = 75°. Синусын теоремоор: a/sin45 = 10/sin75, b/sin60 = 10/sin75. ≈ a 7.3 см, b 9.0 см.',
    difficulty: 4,
  },
  // ── Математик · Вектор + Магадлал ──
  {
    strand: 'Вектор алгебр',
    grade: 11,
    subject: 'math',
    lang: 'mn-Cyrl',
    prompt: 'a⃗ = (1, 2, 2), b⃗ = (3, 0, −4) векторуудын скаляр үржвэрийг ол.',
    answer_key: 'a⃗ · b⃗ = 1·3 + 2·0 + 2·(−4) = −5',
    difficulty: 1,
  },
  {
    strand: 'Магадлал',
    grade: 11,
    subject: 'math',
    lang: 'mn-Cyrl',
    prompt: 'P(A) = 0.4, P(B) = 0.5 ба A, B үл хамаарал. P(A ба B), P(A эсвэл B)-г ол.',
    answer_key: 'P(A ба B) = 0.2, P(A эсвэл B) = 0.4 + 0.5 − 0.2 = 0.7',
    difficulty: 2,
  },

  // ── Монгол хэл · Үг зүй ──
  {
    strand: 'Үг зүй',
    grade: 11,
    subject: 'mongolian',
    lang: 'mn-Cyrl',
    prompt: '«Сургалт» гэдэг үгийг үндэс ба дагавар болгон ангилж бич.',
    answer_key: 'Үндэс: «сур-» · дагавар: «-галт» (үг бүтээх дагавар).',
    difficulty: 1,
  },
  {
    strand: 'Үг зүй',
    grade: 11,
    subject: 'mongolian',
    lang: 'mn-Cyrl',
    prompt: '«Ном-ыг», «ном-оор» гэсэн хэлбэр тус бүр ямар тийн ялгал вэ?',
    answer_key: '«Номыг» — заахын тийн ялгал. «Номоор» — үйлдэхийн тийн ялгал.',
    difficulty: 2,
  },
  {
    strand: 'Үг зүй',
    grade: 11,
    subject: 'mongolian',
    lang: 'mn-Cyrl',
    prompt: '«Сайн» тэмдэг үгийн харьцуулсан болон давамгай зэргийг бич.',
    answer_key: 'Харьцуулсан: «илүү сайн» (эсвэл «дээр»). Давамгай: «хамгийн сайн».',
    difficulty: 1,
  },
  // ── Монгол хэл · Өгүүлбэр зүй ──
  {
    strand: 'Өгүүлбэр зүй',
    grade: 11,
    subject: 'mongolian',
    lang: 'mn-Cyrl',
    prompt:
      '«Бороо орсон бөгөөд салхи шуурчээ.» энэ өгүүлбэр энгийн үү, нийлмэл үү? Шалтгааныг бич.',
    answer_key:
      'Нийлмэл. Хоёр өгүүлэхүүн («бороо орсон», «салхи шуурчээ») «бөгөөд» холбоосоор холбогдсон.',
    difficulty: 2,
  },
  {
    strand: 'Өгүүлбэр зүй',
    grade: 11,
    subject: 'mongolian',
    lang: 'mn-Cyrl',
    prompt: '«-аар», «-аас», «-ийн» сул үгсийн тус бүр ямар үүрэгтэй вэ?',
    answer_key: '«-аар» үйлдэхийн нөхцөл, «-аас» гарахын нөхцөл, «-ийн» хамаатуулахын нөхцөл.',
    difficulty: 2,
  },
  // ── Монгол хэл · Найруулга + Авиа ──
  {
    strand: 'Найруулга зүй',
    grade: 11,
    subject: 'mongolian',
    lang: 'mn-Cyrl',
    prompt: 'Албан бичигт байх ёстой гурван үндсэн бүрэлдэхүүн юу вэ?',
    answer_key: 'Зорилго · Агуулга · Гарын үсэг (албан бичгийн ерөнхий загвар).',
    difficulty: 1,
  },
  {
    strand: 'Авиа зүй',
    grade: 11,
    subject: 'mongolian',
    lang: 'mn-Cyrl',
    prompt:
      'Эгшгийн уялдааны хуулиар «нэр» гэдэг үгэнд үйлдэхийн нөхцлийг залгахдаа ямар эгшиг сонгох вэ?',
    answer_key: 'Эм эгшиг — «нэрээр» (учир нь «нэр» нь эм эгшигт үг).',
    difficulty: 2,
  },
];
