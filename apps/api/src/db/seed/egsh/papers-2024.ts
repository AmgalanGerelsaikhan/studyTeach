/**
 * EGSh 2024 fixture papers — one per subject (10 subjects).
 *
 * 4 questions per paper to keep ingest demoable; content-ops will load real
 * 30-50 question papers via the same canonical JSON shape post-S04. Each
 * question carries a `strand` so missed answers feed BktService.observe
 * for the correct concept node.
 *
 * Bodies are mn-Cyrl. Subjects use the EgshSubject contract enum.
 */
export interface SeedQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  answer: number;
  strand: string;
}

export interface SeedPaper {
  paper_id: string;
  subject:
    | 'math'
    | 'mongolian'
    | 'physics'
    | 'chem'
    | 'bio'
    | 'english'
    | 'russian'
    | 'history'
    | 'social'
    | 'geography';
  year: number;
  lang: 'mn-Cyrl';
  questions: SeedQuestion[];
}

const PAPERS: SeedPaper[] = [
  {
    paper_id: 'EGSH-2024-MATH',
    subject: 'math',
    year: 2024,
    lang: 'mn-Cyrl',
    questions: [
      {
        id: 'q1',
        prompt: 'x² − 7x + 12 = 0 тэгшитгэлийн язгуурууд аль нь вэ?',
        options: ['x₁=2, x₂=6', 'x₁=3, x₂=4', 'x₁=−3, x₂=−4', 'x₁=1, x₂=12'],
        answer: 1,
        strand: 'Алгебр',
      },
      {
        id: 'q2',
        prompt: 'Арифметик прогрессийн a₁=2, d=3 бол a₁₀ хэд вэ?',
        options: ['27', '29', '32', '35'],
        answer: 1,
        strand: 'Алгебр',
      },
      {
        id: 'q3',
        prompt: 'sin 30° + cos 60° хэдтэй тэнцүү вэ?',
        options: ['0', '0.5', '1', '√3/2'],
        answer: 2,
        strand: 'Тригонометр',
      },
      {
        id: 'q4',
        prompt: 'a⃗=(2,−1), b⃗=(3,4) бол a⃗·b⃗ хэдтэй тэнцүү вэ?',
        options: ['2', '5', '10', '14'],
        answer: 0,
        strand: 'Вектор алгебр',
      },
    ],
  },
  {
    paper_id: 'EGSH-2024-MONGOLIAN',
    subject: 'mongolian',
    year: 2024,
    lang: 'mn-Cyrl',
    questions: [
      {
        id: 'q1',
        prompt: '«Номыг» хэлбэрийн тийн ялгал аль нь вэ?',
        options: ['Нэрлэхийн', 'Заахын', 'Үйлдэхийн', 'Гарахын'],
        answer: 1,
        strand: 'Үг зүй',
      },
      {
        id: 'q2',
        prompt: '«Сургалт» гэдэг үгийн үндэс аль нь вэ?',
        options: ['Сур-', 'Сургалт-', 'Сургаа-', 'Сурга-'],
        answer: 0,
        strand: 'Үг зүй',
      },
      {
        id: 'q3',
        prompt: '«Бороо орсон бөгөөд салхи шуурлаа.» — энэ өгүүлбэр аль төрөлд багтах вэ?',
        options: ['Энгийн', 'Зэрэгцсэн нийлмэл', 'Угсарсан нийлмэл', 'Хэрэглэсэн'],
        answer: 1,
        strand: 'Өгүүлбэр зүй',
      },
      {
        id: 'q4',
        prompt: 'Эгшгийн уялдааны хуулиар «нэр» үгэнд аль дагавар тохирох вэ?',
        options: ['-аар', '-оор', '-ээр', '-уур'],
        answer: 2,
        strand: 'Авиа зүй',
      },
    ],
  },
  {
    paper_id: 'EGSH-2024-PHYSICS',
    subject: 'physics',
    year: 2024,
    lang: 'mn-Cyrl',
    questions: [
      {
        id: 'q1',
        prompt: '3 кг массатай биенд 12 Н хүч үйлчилбэл хурдатгал хэд вэ?',
        options: ['2 м/с²', '3 м/с²', '4 м/с²', '6 м/с²'],
        answer: 2,
        strand: 'Механик',
      },
      {
        id: 'q2',
        prompt: '5 кг бие 4 м/с хурдтай хөдлөж байна. Кинетик энерги нь хэд вэ?',
        options: ['20 Ж', '40 Ж', '80 Ж', '100 Ж'],
        answer: 1,
        strand: 'Механик',
      },
      {
        id: 'q3',
        prompt: '10 В хүчдэлтэй эх үүсвэрт 2 Ом эсэргүүцэл холбосон. Гүйдлийг ол.',
        options: ['2 А', '5 А', '8 А', '20 А'],
        answer: 1,
        strand: 'Цахилгаан соронзон',
      },
      {
        id: 'q4',
        prompt: 'Системд 300 Ж дулаан өгөхөд 100 Ж ажил хийсэн. ΔU хэд вэ?',
        options: ['100 Ж', '200 Ж', '300 Ж', '400 Ж'],
        answer: 1,
        strand: 'Дулааны физик',
      },
    ],
  },
  {
    paper_id: 'EGSH-2024-CHEM',
    subject: 'chem',
    year: 2024,
    lang: 'mn-Cyrl',
    questions: [
      {
        id: 'q1',
        prompt: 'H₂O молекулд хэдэн ковалент холбоо байдаг вэ?',
        options: ['1', '2', '3', '4'],
        answer: 1,
        strand: 'Химийн холбоо',
      },
      {
        id: 'q2',
        prompt: 'NaCl-ийн молийн масс хэд вэ? (Na=23, Cl=35.5)',
        options: ['46.5 г/моль', '58.5 г/моль', '70 г/моль', '71 г/моль'],
        answer: 1,
        strand: 'Стехиометр',
      },
      {
        id: 'q3',
        prompt: 'pH=3 уусмал ямар орчинтой вэ?',
        options: ['Хүчиллэг', 'Шүлтлэг', 'Саармаг', 'Тогтворгүй'],
        answer: 0,
        strand: 'Хүчил суурь',
      },
      {
        id: 'q4',
        prompt: 'Метан (CH₄) аль ангилалд хамаарах вэ?',
        options: ['Алкан', 'Алкен', 'Алкин', 'Арен'],
        answer: 0,
        strand: 'Органик хими',
      },
    ],
  },
  {
    paper_id: 'EGSH-2024-BIO',
    subject: 'bio',
    year: 2024,
    lang: 'mn-Cyrl',
    questions: [
      {
        id: 'q1',
        prompt: 'Эс хуваагдлын митозын үе шатуудын зөв дараалал аль нь вэ?',
        options: [
          'Профаз → Метафаз → Анафаз → Телофаз',
          'Метафаз → Профаз → Анафаз → Телофаз',
          'Профаз → Анафаз → Метафаз → Телофаз',
          'Телофаз → Метафаз → Анафаз → Профаз',
        ],
        answer: 0,
        strand: 'Эс судлал',
      },
      {
        id: 'q2',
        prompt: 'ДНХ-н дөрвөн азот суурь аль нь вэ?',
        options: ['A, T, G, C', 'A, U, G, C', 'A, T, G, U', 'A, C, T, U'],
        answer: 0,
        strand: 'Удамшил',
      },
      {
        id: 'q3',
        prompt: 'Фотосинтезийг хийдэг эрхтэнцэр аль нь вэ?',
        options: ['Митохондри', 'Хлоропласт', 'Рибосом', 'Лизосом'],
        answer: 1,
        strand: 'Эс судлал',
      },
      {
        id: 'q4',
        prompt: 'Хүний цусны бүлгийн тоо аль нь вэ?',
        options: ['2', '3', '4', '6'],
        answer: 2,
        strand: 'Хүний биеийн судлал',
      },
    ],
  },
  {
    paper_id: 'EGSH-2024-ENGLISH',
    subject: 'english',
    year: 2024,
    lang: 'mn-Cyrl',
    questions: [
      {
        id: 'q1',
        prompt: 'Choose the correct past tense form: "Yesterday I ___ to school."',
        options: ['go', 'goes', 'went', 'gone'],
        answer: 2,
        strand: 'Grammar',
      },
      {
        id: 'q2',
        prompt: 'Which is a synonym of "happy"?',
        options: ['Sad', 'Angry', 'Joyful', 'Tired'],
        answer: 2,
        strand: 'Vocabulary',
      },
      {
        id: 'q3',
        prompt: 'Identify the article: "She is ___ honest person."',
        options: ['a', 'an', 'the', 'no article'],
        answer: 1,
        strand: 'Grammar',
      },
      {
        id: 'q4',
        prompt: '"I have lived here ___ 2020." — choose the preposition.',
        options: ['since', 'for', 'from', 'in'],
        answer: 0,
        strand: 'Grammar',
      },
    ],
  },
  {
    paper_id: 'EGSH-2024-RUSSIAN',
    subject: 'russian',
    year: 2024,
    lang: 'mn-Cyrl',
    questions: [
      {
        id: 'q1',
        prompt: 'Выберите правильный падеж: «Книга лежит на ___.» (стол)',
        options: ['стол', 'стола', 'столе', 'столом'],
        answer: 2,
        strand: 'Грамматика',
      },
      {
        id: 'q2',
        prompt: 'Антоним к слову «большой»:',
        options: ['Высокий', 'Маленький', 'Длинный', 'Широкий'],
        answer: 1,
        strand: 'Лексика',
      },
      {
        id: 'q3',
        prompt: 'Найдите глагол: «Школьник читает интересную книгу.»',
        options: ['Школьник', 'читает', 'интересную', 'книгу'],
        answer: 1,
        strand: 'Грамматика',
      },
      {
        id: 'q4',
        prompt: 'Множественное число слова «друг»:',
        options: ['други', 'друзья', 'другья', 'другие'],
        answer: 1,
        strand: 'Грамматика',
      },
    ],
  },
  {
    paper_id: 'EGSH-2024-HISTORY',
    subject: 'history',
    year: 2024,
    lang: 'mn-Cyrl',
    questions: [
      {
        id: 'q1',
        prompt: 'Чингис хаан Их Монгол улсыг хэдэн онд байгуулсан бэ?',
        options: ['1162', '1189', '1206', '1227'],
        answer: 2,
        strand: 'Монголын эртний түүх',
      },
      {
        id: 'q2',
        prompt: 'Зөвлөлт-Япон-Монголын Халхын голын дайн ямар онд болсон вэ?',
        options: ['1921', '1939', '1945', '1949'],
        answer: 1,
        strand: 'Орчин үеийн түүх',
      },
      {
        id: 'q3',
        prompt: 'Богд хаан төрийг тунхагласан он:',
        options: ['1911', '1921', '1924', '1939'],
        answer: 0,
        strand: 'Орчин үеийн түүх',
      },
      {
        id: 'q4',
        prompt: '«Юань» гүрнийг хэн үндэслэсэн бэ?',
        options: ['Чингис хаан', 'Өгөдэй хаан', 'Хубилай хаан', 'Тэмүр хаан'],
        answer: 2,
        strand: 'Дундад зууны түүх',
      },
    ],
  },
  {
    paper_id: 'EGSH-2024-SOCIAL',
    subject: 'social',
    year: 2024,
    lang: 'mn-Cyrl',
    questions: [
      {
        id: 'q1',
        prompt: 'Монгол Улсын дээд төр хууль аль нь вэ?',
        options: ['Үндсэн хууль', 'Иргэний хууль', 'Эрүүгийн хууль', 'Хөдөлмөрийн хууль'],
        answer: 0,
        strand: 'Эрх зүй',
      },
      {
        id: 'q2',
        prompt: 'Монгол Улсын парламент нэг танхимтай юу, хоёр танхимтай юу?',
        options: ['Нэг танхимтай', 'Хоёр танхимтай', 'Гурван танхимтай', 'Дөрвөн танхимтай'],
        answer: 0,
        strand: 'Төр улс',
      },
      {
        id: 'q3',
        prompt: 'НҮБ хэдэн онд байгуулагдсан вэ?',
        options: ['1919', '1939', '1945', '1948'],
        answer: 2,
        strand: 'Олон улсын харилцаа',
      },
      {
        id: 'q4',
        prompt: 'Зах зээлийн эдийн засагт үнэ хэрхэн тогтдог вэ?',
        options: [
          'Засгийн газар тогтооно',
          'Эрэлт нийлүүлэлтийн харьцаагаар',
          'Үйлдвэрлэгчийн зардлаар',
          'Хэрэглэгчийн хүсэлтээр',
        ],
        answer: 1,
        strand: 'Эдийн засаг',
      },
    ],
  },
  {
    paper_id: 'EGSH-2024-GEOGRAPHY',
    subject: 'geography',
    year: 2024,
    lang: 'mn-Cyrl',
    questions: [
      {
        id: 'q1',
        prompt: 'Монгол Улсын нийслэл аль аймагт хамаарах вэ?',
        options: ['Хэнтий', 'Төв', 'Улаанбаатар нь аймагт хамаарахгүй', 'Сэлэнгэ'],
        answer: 2,
        strand: 'Монголын газар зүй',
      },
      {
        id: 'q2',
        prompt: 'Монгол Улсын хамгийн өндөр уул аль нь вэ?',
        options: ['Богд хан', 'Отгонтэнгэр', 'Хүйтэн оргил', 'Сутай'],
        answer: 2,
        strand: 'Монголын газар зүй',
      },
      {
        id: 'q3',
        prompt: 'Дэлхийн хамгийн урт гол аль нь вэ?',
        options: ['Янцзы', 'Амазон', 'Нил', 'Миссисипи'],
        answer: 2,
        strand: 'Дэлхийн газар зүй',
      },
      {
        id: 'q4',
        prompt: 'Экватор хэдэн градусаар тогтоогдсон вэ?',
        options: ['0°', '23.5°', '45°', '90°'],
        answer: 0,
        strand: 'Зурагзүй',
      },
    ],
  },
];

export const EGSH_2024_PAPERS: readonly SeedPaper[] = PAPERS;
