/**
 * Study Abroad Hub seed — destinations, blueprints, scholarships
 * (PRD §4.10a, §4.10b; migration 1753200000000_add-study-abroad.sql).
 *
 * All learner-facing copy is Mongolian Cyrillic (CLAUDE.md hard constraint #1).
 * Blueprints + scholarships are first-draft seed data; the embassy-content-review
 * partner (PRD §11.1) is the authoritative editor for v2.0.0 launch.
 *
 * Idempotent natural keys (migration 0015):
 *   - destinations            PRIMARY KEY (destination_code)
 *   - destination_blueprints  UNIQUE (destination_code, section)
 *   - scholarships            UNIQUE (name_mn, funder, deadline)
 */

export interface SeedDestination {
  destination_code: 'US' | 'JP' | 'KR' | 'CN' | 'RU' | 'DE' | 'UK' | 'AU';
  name_mn: string;
  primary_pathway_mn: string;
  hero_image_url: string | null;
  ordinal: number;
}

export interface SeedBlueprint {
  destination_code: SeedDestination['destination_code'];
  section:
    | 'CORE_CONCEPT'
    | 'CORE_REQUIREMENTS'
    | 'FINANCIAL_PATHWAY'
    | 'APPLICATION_TIMELINE'
    | 'COMMON_PITFALLS';
  body_mn: string;
  ordinal: number;
}

export interface SeedScholarship {
  name_mn: string;
  funder: string;
  destination_code: SeedDestination['destination_code'];
  level: 'UG' | 'PG' | 'PHD';
  eligibility_mn: string;
  deadline: string;
  application_url: string;
  document_checklist: string[];
  funding_type: 'FULL' | 'PARTIAL' | 'TUITION_ONLY';
}

export const DESTINATIONS: readonly SeedDestination[] = [
  {
    destination_code: 'US',
    name_mn: 'АНУ',
    primary_pathway_mn: 'Холистик элсэлт, хэрэгцээнд тулгуурласан тэтгэлэг',
    hero_image_url: null,
    ordinal: 1,
  },
  {
    destination_code: 'JP',
    name_mn: 'Япон',
    primary_pathway_mn: 'MEXT тэтгэлэг (ЭСЯ-аар); EJU замналт',
    hero_image_url: null,
    ordinal: 2,
  },
  {
    destination_code: 'KR',
    name_mn: 'Өмнөд Солонгос',
    primary_pathway_mn: 'GKS (KGSP); TOPIK шалгалт',
    hero_image_url: null,
    ordinal: 3,
  },
  {
    destination_code: 'CN',
    name_mn: 'Хятад',
    primary_pathway_mn: 'CSC; HSK; «Бүс ба зам» хөтөлбөр',
    hero_image_url: null,
    ordinal: 4,
  },
  {
    destination_code: 'RU',
    name_mn: 'ОХУ',
    primary_pathway_mn: 'ОХУ-ын засгийн газрын квот; хоёр талт квот',
    hero_image_url: null,
    ordinal: 5,
  },
  {
    destination_code: 'DE',
    name_mn: 'Герман',
    primary_pathway_mn: 'Төрийн их сургуулиуд төлбөргүй; TestAS; DSH/TestDaF',
    hero_image_url: null,
    ordinal: 6,
  },
  {
    destination_code: 'UK',
    name_mn: 'Их Британи',
    primary_pathway_mn: 'UCAS; Chevening; foundation курс',
    hero_image_url: null,
    ordinal: 7,
  },
  {
    destination_code: 'AU',
    name_mn: 'Австрали',
    primary_pathway_mn: 'Шууд элсэлт; Australia Awards',
    hero_image_url: null,
    ordinal: 8,
  },
];

export const BLUEPRINTS: readonly SeedBlueprint[] = [
  // ── US ────────────────────────────────────────────────────────────────
  {
    destination_code: 'US',
    section: 'CORE_CONCEPT',
    ordinal: 1,
    body_mn:
      'АНУ-ын элсэлт холистик буюу олон талт үнэлгээтэй. Шалгалтын онооноос гадна эссэ, багшийн тодорхойлолт, олон нийтийн ажил, удирдан зохион байгуулах туршлагыг хамтад нь дүгнэдэг. Топ их сургуулиуд 5%-аас бага элсэлтийн хувьтай.',
  },
  {
    destination_code: 'US',
    section: 'CORE_REQUIREMENTS',
    ordinal: 2,
    body_mn:
      'SAT эсвэл ACT шалгалт, TOEFL iBT 80+ эсвэл IELTS 6.5+ англи түвшин. 9-12 ангийн дүн (GPA), Common App дээрх хувийн эссэ, 2-3 багшийн тодорхойлолт, ангийн зөвлөгчийн тодорхойлолт шаардлагатай.',
  },
  {
    destination_code: 'US',
    section: 'FINANCIAL_PATHWAY',
    ordinal: 3,
    body_mn:
      'Хувийн их сургуулийн жилийн зардал 60-80 мянган ам.доллар. Гадаад оюутанд need-based aid өгдөг сургууль цөөн (Harvard, Yale, MIT, Princeton, Amherst). Бусад нь зөвхөн merit-based тэтгэлэгтэй. Олон оюутан төрийн их сургууль эсвэл community college замаар зардлаа бууруулдаг.',
  },
  {
    destination_code: 'US',
    section: 'APPLICATION_TIMELINE',
    ordinal: 4,
    body_mn:
      '11-р анги: SAT/TOEFL бэлтгэл. 11-12 ангийн зун: сургуулийн сонголт, эссэгийн ноорог. 12-р ангийн 10-11 сар: Early Decision/Action өргөдөл. 1-р сарын 1-15: Regular Decision. 3-4 сар: хариу. 5-р сар: сонголтоо баталгаажуулах.',
  },
  {
    destination_code: 'US',
    section: 'COMMON_PITFALLS',
    ordinal: 5,
    body_mn:
      'Зөвхөн Ivy League-д анхаарал төвлөрүүлж бусад сайн сургуулиудыг үл харгалзах нь түгээмэл. SAT-г оройтож өгснөөс дахин өгөх боломж алддаг. Эссэ ерөнхий байж, биеэ илэрхийлж чадахгүй. Визэнд хангалттай санхүүгийн нотлох баримт бэлтгэхгүй.',
  },
  // ── JP ────────────────────────────────────────────────────────────────
  {
    destination_code: 'JP',
    section: 'CORE_CONCEPT',
    ordinal: 1,
    body_mn:
      'Японы MEXT тэтгэлэг хоёр замтай: ЭСЯ-аар (Embassy Recommendation) эсвэл шууд их сургуулиар (University Recommendation). ЭСЯ-ын зам өрсөлдөөн өндөртэй боловч бүх зардал хамрагдсан. EJU шалгалт нь өөр бие даасан зам.',
  },
  {
    destination_code: 'JP',
    section: 'CORE_REQUIREMENTS',
    ordinal: 2,
    body_mn:
      'MEXT UG-д: дунд сургуулийн төгсөгч, 17-25 нас, өндөр дүн. ЭСЯ-ын шалгалт: математик, англи, япон, шинжлэх ухаан. EJU-д JLPT N2-ийн япон хэлний бэлтгэл санал болгодог. Англиар суралцах хөтөлбөрт TOEFL 80+ эсвэл IELTS 6.0+ хүчинтэй.',
  },
  {
    destination_code: 'JP',
    section: 'FINANCIAL_PATHWAY',
    ordinal: 3,
    body_mn:
      'MEXT: сургалтын төлбөр 100% хамрагдсан, бакалаврт сард 117,000 иен тэтгэмж, нэг удаагийн нислэгийн тийз. Хувийн их сургуулийн жилийн зардал 8-15 сая иен. JASSO Honors сард 48,000 иен нэмэлт тэтгэлэг.',
  },
  {
    destination_code: 'JP',
    section: 'APPLICATION_TIMELINE',
    ordinal: 4,
    body_mn:
      'MEXT ЭСЯ урилга 5-6 сард Японы ЭСЯ-наас гарна. 6-р сар: шалгалт. 7-9 сар: ЭСЯ-аар сонгогдох. 12-р сар: их сургуулийн байршил баталгаажих. Дараа жилийн 4-р сар: суралцаж эхлэх.',
  },
  {
    destination_code: 'JP',
    section: 'COMMON_PITFALLS',
    ordinal: 5,
    body_mn:
      'Япон хэлний JLPT N5 түвшин хангалттай гэж бодох нь түгээмэл алдаа — суралцахад N2 шаардлагатай. ЭСЯ-ын ярилцлагад бэлтгэлгүй очих. Их сургуулийн чиглэлийг хэт ерөнхий бичих (research plan тодорхой бай).',
  },
  // ── KR ────────────────────────────────────────────────────────────────
  {
    destination_code: 'KR',
    section: 'CORE_CONCEPT',
    ordinal: 1,
    body_mn:
      'Өмнөд Солонгосын GKS (Global Korea Scholarship, өмнө нь KGSP) нь NIIED-ээс зохион байгуулагддаг төвлөрсөн тэтгэлэг. Хоёр замтай: ЭСЯ-аар эсвэл их сургуулиар шууд. Эхний жил солонгос хэлний бэлтгэл, дараа нь чиглэлээ суралцана.',
  },
  {
    destination_code: 'KR',
    section: 'CORE_REQUIREMENTS',
    ordinal: 2,
    body_mn:
      'GKS UG: дунд сургуулийн төгсөгч, нас 25-аас доош, өндөр дүн. TOPIK түвшин нь чухал — бакалаврт 3+, магистрт 4+ түвшин шаардагдана. Англиар суралцах хөтөлбөрт TOEFL/IELTS хүчинтэй. 2-3 багшийн тодорхойлолт.',
  },
  {
    destination_code: 'KR',
    section: 'FINANCIAL_PATHWAY',
    ordinal: 3,
    body_mn:
      'GKS-аар: солонгос хэлний 1 жил + бакалаврын 4 жилийн сургалтын төлбөр, сард 900,000 вон тэтгэмж, эрүүл мэндийн даатгал. Хувиар суралцвал сургалтын төлбөр жилд 5-10 сая вон, амьжиргааны зардал сард 800,000-1,200,000 вон.',
  },
  {
    destination_code: 'KR',
    section: 'APPLICATION_TIMELINE',
    ordinal: 4,
    body_mn:
      'GKS ЭСЯ-ын урилга 2-3 сард Солонгосын ЭСЯ-наас гарна. 3-р сар: өргөдөл хүлээн авах. 4-5 сар: ЭСЯ-аар ярилцлага. 6-7 сар: эцсийн сонгон шалгаруулалт. 8-р сар: Солонгос руу шилжих, хэлний бэлтгэл эхлэх.',
  },
  {
    destination_code: 'KR',
    section: 'COMMON_PITFALLS',
    ordinal: 5,
    body_mn:
      'Солонгос хэл огт сурахгүй өргөдөл өгөх — TOPIK гэрчилгээгүй өргөдөл хүчингүй болох эрсдэлтэй. Personal Statement-аа орчуулагчаар бичүүлэх (NIIED танина). Их сургуулийн сонголтоо зөвхөн SKY гурваас хийх.',
  },
  // ── CN ────────────────────────────────────────────────────────────────
  {
    destination_code: 'CN',
    section: 'CORE_CONCEPT',
    ordinal: 1,
    body_mn:
      'Хятадын CSC (Chinese Scholarship Council) тэтгэлэг гурван үндсэн төрөлтэй: Type A (хоёр талт квот, ЭСЯ-аар), Type B (их сургуулиар), Type C (мужийн засгийн газраар). «Бүс ба зам» хөтөлбөр болон Confucius Institute Scholarship мөн нэмэлт суваг.',
  },
  {
    destination_code: 'CN',
    section: 'CORE_REQUIREMENTS',
    ordinal: 2,
    body_mn:
      'Хятад хэлээр суралцахад HSK 4+ түвшний гэрчилгээ шаардлагатай (зарим чиглэлд HSK 5-6). Англиар суралцах хөтөлбөрт TOEFL/IELTS хүчинтэй. Эрүүл мэндийн шалгалт (Physical Examination Record) заавал. 2 багшийн тодорхойлолт, study plan.',
  },
  {
    destination_code: 'CN',
    section: 'FINANCIAL_PATHWAY',
    ordinal: 3,
    body_mn:
      'CSC бүрэн: сургалтын төлбөр, дотуур байр, сард 2,500-3,500 юаны тэтгэмж, эрүүл мэндийн даатгал. Хувиар: сургалтын төлбөр жилд 20,000-40,000 юань, амьжиргааны зардал хотоос хамаарч 2,000-4,000 юань/сар.',
  },
  {
    destination_code: 'CN',
    section: 'APPLICATION_TIMELINE',
    ordinal: 4,
    body_mn:
      'CSC өргөдлийн портал 12-1 сард нээгдэнэ. 1-3 сар: ЭСЯ эсвэл их сургуульд хүсэлт. 3-4 сар: CSC шилжүүлэх. 6-7 сар: эцсийн хариу. 8-9 сар: суралцах. Эрүүл мэндийн шалгалт хүчинтэй хугацаа 6 сар — өргөдлийн өмнө шинэчилнэ.',
  },
  {
    destination_code: 'CN',
    section: 'COMMON_PITFALLS',
    ordinal: 5,
    body_mn:
      'HSK гэрчилгээ авч амжихгүй байх — тэтгэлгийн өргөдөл хүчингүй. Эрүүл мэндийн шалгалтыг оройтож хийх. Study plan-аа ерөнхий, тодорхой биш бичих. Хятад хэлний түвшинг хэт өөдрөгөөр үнэлэх.',
  },
  // ── RU ────────────────────────────────────────────────────────────────
  {
    destination_code: 'RU',
    section: 'CORE_CONCEPT',
    ordinal: 1,
    body_mn:
      'ОХУ-ын засгийн газрын квот нь Россотрудничество (Rossotrudnichestvo) байгууллагаар дамжуулан хуваарилагдана. Монгол-ОХУ-ын хоёр талт квот болон ерөнхий квот гэсэн хоёр сонголттой. Эхний жил бэлтгэлийн факультетэд орос хэл сурна.',
  },
  {
    destination_code: 'RU',
    section: 'CORE_REQUIREMENTS',
    ordinal: 2,
    body_mn:
      'Дунд сургуулийн төгсөгч 35-аас доош нас, дүн өндөр. Орос хэлний шалгалт бэлтгэлийн факультет дээр өгнө. Баримтыг апостилоор баталгаажуулах. Эрүүл мэндийн шалгалт. Зарим чиглэлд бие даасан мэргэжлийн шалгалт.',
  },
  {
    destination_code: 'RU',
    section: 'FINANCIAL_PATHWAY',
    ordinal: 3,
    body_mn:
      'ОХУ-ын тэтгэлэг бүрэн: сургалтын төлбөр, бэлтгэлийн жилийн зардал, дотуур байр (нэлээд хязгаарлагдмал), сард 1,500-2,500 рублийн тэтгэмж. Амьжиргааны зардал нэмэлт өөрөө гаргана. Хувиар суралцвал жилд 200,000-350,000 рубль.',
  },
  {
    destination_code: 'RU',
    section: 'APPLICATION_TIMELINE',
    ordinal: 4,
    body_mn:
      'Россотрудничествогийн өргөдлийн систем 9-10 сард нээгдэнэ. 11-р сар: онлайн өргөдөл, баримтаар. 12-2 сар: ярилцлага. 5-6 сар: эцсийн квотын хуваарь. 9-р сар: ОХУ руу шилжих, бэлтгэлийн факультет.',
  },
  {
    destination_code: 'RU',
    section: 'COMMON_PITFALLS',
    ordinal: 5,
    body_mn:
      'Хоёр талт квот = автоматаар тэтгэлэг гэж бодох. Баримтаа апостилгүй илгээх. Эрүүл мэндийн шалгалтыг хэт оройтож хийх. Орос хэлгүйгээр өргөдөл өгсөн хадаа бэлтгэлийн факультетэд үлдэх боломжтой гэж бодох.',
  },
  // ── DE ────────────────────────────────────────────────────────────────
  {
    destination_code: 'DE',
    section: 'CORE_CONCEPT',
    ordinal: 1,
    body_mn:
      'Германы төрийн их сургуулиуд бараг бүх чиглэлд сургалтын төлбөргүй (зөвхөн семестрийн төлбөр 150-350 евро). Бакалаврт ихэвчлэн TestAS шалгалт + герман хэл. Магистрын олон хөтөлбөр англиар явагддаг — герман хэлгүйгээр элсэх боломжтой.',
  },
  {
    destination_code: 'DE',
    section: 'CORE_REQUIREMENTS',
    ordinal: 2,
    body_mn:
      'UG: дунд сургуулийн төгсөгч + Studienkolleg (бэлтгэлийн жил) ихэвчлэн шаардлагатай. Герман хэлний DSH 2 эсвэл TestDaF TDN 4 түвшин шаардагдана. Англи хөтөлбөрт IELTS 6.5+ эсвэл TOEFL 90+. Uni-Assist платформоор өргөдөл.',
  },
  {
    destination_code: 'DE',
    section: 'FINANCIAL_PATHWAY',
    ordinal: 3,
    body_mn:
      'Семестрийн төлбөр 150-350 евро. Амьжиргааны зардал сард 850-1,200 евро. Виз авахад хаалттай дансанд (Sperrkonto) 11,208 евро (2026 онд) урьдчилан хадгалах шаардлагатай. DAAD, Heinrich Böll, KAS зэрэг тэтгэлэг боломжтой.',
  },
  {
    destination_code: 'DE',
    section: 'APPLICATION_TIMELINE',
    ordinal: 4,
    body_mn:
      'Өвлийн семестр (10-р сар эхэлдэг): 7-р сарын 15 хүртэл өргөдөл. Зуны семестр (4-р сар): 1-р сарын 15 хүртэл. Uni-Assist-аар баримтын шалгалт 4-6 долоо хоног. Виз 8-12 долоо хоног — эрт төлөвлө.',
  },
  {
    destination_code: 'DE',
    section: 'COMMON_PITFALLS',
    ordinal: 5,
    body_mn:
      'Бүх хөтөлбөр англиар явдаг гэж бодох — UG-ийн ихэнх нь герман хэлтэй. Хаалттай дансаа хугацаа хожимдуулж нээх. Studienkolleg-ийг алгасаж шууд элсэх гэж оролдох. Uni-Assist-ийн төлбөрийг тооцоонд оруулахгүй.',
  },
  // ── UK ────────────────────────────────────────────────────────────────
  {
    destination_code: 'UK',
    section: 'CORE_CONCEPT',
    ordinal: 1,
    body_mn:
      'Их Британийн UCAS нь UG-ийн төвлөрсөн систем — 5 их сургуульд зэрэг өргөдөл өгнө. PG-д шууд их сургуулиар өргөдөл өгнө. Гадаад оюутны сургалтын төлбөр өндөр (£20-35k/жил). Тэтгэлгийн гол сонголтууд: Chevening (PG), Commonwealth Shared (PG), GREAT.',
  },
  {
    destination_code: 'UK',
    section: 'CORE_REQUIREMENTS',
    ordinal: 2,
    body_mn:
      'UG: A-Level эсвэл International Baccalaureate (IB) эсвэл foundation year. IELTS 6.5+ (зарим 7.0+). Personal Statement маш чухал — 4,000 тэмдэгт дотор биеэ илэрхийлэх. PG: бакалаврын дүн 2:1 ангийн дээш.',
  },
  {
    destination_code: 'UK',
    section: 'FINANCIAL_PATHWAY',
    ordinal: 3,
    body_mn:
      'UG жилийн сургалтын төлбөр £20-30k, Лондонд £35k хүрнэ. Магистрт £15-30k. Амьжиргааны зардал Лондонгоос гадуур сард £1,000-1,400, Лондонд £1,500-2,000. Chevening, Commonwealth Shared зэрэг тэтгэлэг бүрэн санхүүжилттэй.',
  },
  {
    destination_code: 'UK',
    section: 'APPLICATION_TIMELINE',
    ordinal: 4,
    body_mn:
      'UG UCAS: 10-р сарын 15 (Oxford, Cambridge, эмчилгээний), 1-р сарын 25 (бусад). Chevening: 11-р сарын эхэн. PG ихэнх их сургуулийн deadline 1-3 сар, элсэлтийн дугуйнаас хамаарна. Виз 8-12 долоо хоног.',
  },
  {
    destination_code: 'UK',
    section: 'COMMON_PITFALLS',
    ordinal: 5,
    body_mn:
      'Personal Statement-аа сүүлийн өдөр бичих. UCAS-ийн 5 сонголтоо зөвхөн Oxbridge + LSE гэж сонгох — backup тогтоохгүй. IELTS-ийг 6.0 авч 6.5 шаардлагатай хөтөлбөрт өргөдөл өгөх. Виз дансны 28 хоногийн нөхцлийг үл анхаарах.',
  },
  // ── AU ────────────────────────────────────────────────────────────────
  {
    destination_code: 'AU',
    section: 'CORE_CONCEPT',
    ordinal: 1,
    body_mn:
      'Австралийн их сургуулиуд шууд элсэлт авдаг — UCAS шиг төвлөрсөн систем байхгүй. «Go8» (Group of Eight) их сургуулиуд топ судалгааны байгууллагууд. Australia Awards Scholarship нь бүрэн тэтгэлгийн гол сонголт.',
  },
  {
    destination_code: 'AU',
    section: 'CORE_REQUIREMENTS',
    ordinal: 2,
    body_mn:
      '12-р ангийн жилийн дүн өндөр, IELTS 6.5+ (Academic) эсвэл TOEFL 79+. Зарим чиглэл нэмэлт prerequisite шаардана (математик, физик). PG-д бакалаврын дүн дунджаар 75%+, ажлын туршлага зарим чиглэлд шаардлагатай.',
  },
  {
    destination_code: 'AU',
    section: 'FINANCIAL_PATHWAY',
    ordinal: 3,
    body_mn:
      'UG жилийн сургалтын төлбөр AUD 25-45k. PG AUD 30-50k. Амьжиргааны зардал сард AUD 1,500-2,500 (Сидней, Мельбурн илүү үнэтэй). Виз авахад жилийн санхүүгийн нотолгоо ~AUD 24,500. Australia Awards бүрэн санхүүжилттэй.',
  },
  {
    destination_code: 'AU',
    section: 'APPLICATION_TIMELINE',
    ordinal: 4,
    body_mn:
      '1-р улирлын элсэлт (2-р сар эхэлдэг): 10-р сарын 31 хүртэл өргөдөл. 2-р улирлын элсэлт (7-р сар): 4-р сарын 30. Australia Awards: 4-7 сар. Виз 4-6 долоо хоног.',
  },
  {
    destination_code: 'AU',
    section: 'COMMON_PITFALLS',
    ordinal: 5,
    body_mn:
      'IELTS-аа Academic биш General Training өгөх — Австралийн их сургуулиуд Academic-ийг л хүлээн авдаг. Australia Awards-ыг хувийн тэтгэлэг гэж бодох — энэ нь хөгжлийн чиглэлийн тэтгэлэг бөгөөд гэрээний дагуу буцаж ирэх үүрэгтэй. Эрүүл мэндийн даатгал (OSHC) тооцоонд оруулахгүй.',
  },
];

export const SCHOLARSHIPS: readonly SeedScholarship[] = [
  // ── JP ────────────────────────────────────────────────────────────────
  {
    name_mn: 'MEXT тэтгэлэг — Бакалавр',
    funder: 'Японы засгийн газар (MEXT)',
    destination_code: 'JP',
    level: 'UG',
    eligibility_mn:
      'Дунд сургуулийн төгсөгч, 17-25 нас, өндөр дүн. ЭСЯ-ын шалгалт (математик, англи, япон, шинжлэх ухаан) болон ярилцлага.',
    deadline: '2026-06-05',
    application_url: 'https://www.mn.emb-japan.go.jp/itpr_mn/study.html',
    document_checklist: [
      'Иргэний үнэмлэхний хуулбар',
      'Гадаад паспортын хуулбар',
      'Дунд сургуулийн дүнгийн тодорхойлолт',
      'Багшийн тодорхойлолт',
      'Эрүүл мэндийн справка',
      'Хувийн анкет (япон + англи)',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'MEXT тэтгэлэг — Магистр (Research Student)',
    funder: 'Японы засгийн газар (MEXT)',
    destination_code: 'JP',
    level: 'PG',
    eligibility_mn:
      'Бакалаврын төгсөгч, 35-аас доош нас. Японы их сургуулийн профессортой урьдчилан холбогдсон байх давуу талтай. Research plan заавал.',
    deadline: '2026-05-29',
    application_url: 'https://www.mn.emb-japan.go.jp/itpr_mn/study.html',
    document_checklist: [
      'Бакалаврын диплом + дүнгийн тодорхойлолт',
      'Research plan (2 хуудас)',
      '2 багшийн тодорхойлолт',
      'Англи/япон хэлний шалгалт',
      'Профессорын урилгын захиа (бол)',
      'Эрүүл мэндийн справка',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'JASSO Honors Scholarship',
    funder: 'JASSO (Japan Student Services Organization)',
    destination_code: 'JP',
    level: 'UG',
    eligibility_mn:
      'Япон дахь хувиар суралцаж буй гадаад оюутан, академик амжилт өндөртэй. MEXT-аас гадуурх оюутнуудад зориулсан.',
    deadline: '2026-12-15',
    application_url: 'https://www.jasso.go.jp/en/study_j/scholarships/shoreihi/index.html',
    document_checklist: [
      'JASSO өргөдлийн маягт',
      'Их сургуулийн дүнгийн тодорхойлолт',
      'Багшийн тодорхойлолт',
      'Хувийн санхүүгийн нөхцлийн тайлбар',
    ],
    funding_type: 'PARTIAL',
  },
  // ── KR ────────────────────────────────────────────────────────────────
  {
    name_mn: 'GKS — Бакалавр',
    funder: 'NIIED (National Institute for International Education)',
    destination_code: 'KR',
    level: 'UG',
    eligibility_mn:
      'Дунд сургуулийн төгсөгч, 25-аас доош нас, GPA 80% дээш. ЭСЯ-аар эсвэл их сургуулиар өргөдөл. 1 жил солингос хэлний бэлтгэлээс эхэлнэ.',
    deadline: '2026-10-09',
    application_url: 'https://www.studyinkorea.go.kr/en/sub/gks/allnew_invite.do',
    document_checklist: [
      'Дунд сургуулийн дүнгийн тодорхойлолт',
      'Personal Statement (англи эсвэл солонгос)',
      'Study Plan',
      '2 багшийн тодорхойлолт',
      'Эрүүл мэндийн справка',
      'TOPIK гэрчилгээ (бол)',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'GKS — Магистр/Доктор',
    funder: 'NIIED (National Institute for International Education)',
    destination_code: 'KR',
    level: 'PG',
    eligibility_mn:
      'Бакалаврын төгсөгч, 40-өөс доош нас (магистр), 45-аас доош (доктор). TOPIK 3+ түвшин эсвэл англиар суралцах хүчинтэй TOEFL/IELTS.',
    deadline: '2027-02-26',
    application_url: 'https://www.studyinkorea.go.kr/en/sub/gks/allnew_invite.do',
    document_checklist: [
      'Бакалаврын диплом',
      'Research Proposal',
      '2 багшийн тодорхойлолт',
      'TOPIK эсвэл TOEFL/IELTS',
      'Эрүүл мэндийн справка',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'POSCO Asia Fellowship',
    funder: 'POSCO TJ Park Foundation',
    destination_code: 'KR',
    level: 'PG',
    eligibility_mn:
      'Азийн орнуудын магистрын оюутан, нийгмийн ухаан/инженерийн чиглэл. Удирдамжийн мэдрэмж + олон нийтийн оролцоонд гэрчилгээтэй.',
    deadline: '2026-11-30',
    application_url: 'https://www.postf.org/en/business/scholarship.do',
    document_checklist: [
      'POSCO өргөдлийн маягт',
      'Бакалаврын диплом',
      'Удирдамжийн туршлагын тайлбар',
      '2 багш/ажил олгогчийн тодорхойлолт',
    ],
    funding_type: 'PARTIAL',
  },
  // ── CN ────────────────────────────────────────────────────────────────
  {
    name_mn: 'CSC Type A — Хоёр талт квот',
    funder: 'China Scholarship Council',
    destination_code: 'CN',
    level: 'UG',
    eligibility_mn:
      'Дунд сургуулийн төгсөгч, 25-аас доош нас. Хятад хэлээр суралцахад HSK 4+. Эрүүл мэндийн шалгалт заавал. ЭСЯ-аар өргөдөл.',
    deadline: '2027-04-01',
    application_url: 'https://www.campuschina.org/',
    document_checklist: [
      'CSC онлайн өргөдөл (No. 99XXXXXX)',
      'Дунд сургуулийн дүн',
      'HSK гэрчилгээ',
      '2 багшийн тодорхойлолт',
      'Эрүүл мэндийн шалгалт (6 сар хүчинтэй)',
      'Study Plan',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'CSC Type B — Их сургуулийн хөтөлбөр',
    funder: 'China Scholarship Council',
    destination_code: 'CN',
    level: 'PG',
    eligibility_mn:
      'Бакалаврын төгсөгч, магистрын ангид 35, докторт 40-аас доош нас. Хятад их сургуулиар шууд CSC өргөдөл өгнө.',
    deadline: '2027-03-31',
    application_url: 'https://www.campuschina.org/',
    document_checklist: [
      'Бакалаврын/магистрын диплом',
      'Research Proposal',
      'HSK эсвэл англи хэлний шалгалт',
      '2 багшийн тодорхойлолт',
      'Эрүүл мэндийн шалгалт',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'Confucius Institute Scholarship',
    funder: 'Chinese International Education Foundation',
    destination_code: 'CN',
    level: 'UG',
    eligibility_mn:
      'Хятад хэл сурах эсвэл хятадаар ерөнхий боловсрол эзэмших оюутан. Confucius Institute дээр шалгалт өгсөн байх давуу талтай.',
    deadline: '2027-05-15',
    application_url: 'https://cis.chinese.cn/',
    document_checklist: [
      'CIS онлайн өргөдөл',
      'HSK 3+ гэрчилгээ',
      'Дүнгийн тодорхойлолт',
      'Багшийн тодорхойлолт',
    ],
    funding_type: 'FULL',
  },
  // ── RU ────────────────────────────────────────────────────────────────
  {
    name_mn: 'ОХУ-ын засгийн газрын квот — Бакалавр',
    funder: 'Россотрудничество',
    destination_code: 'RU',
    level: 'UG',
    eligibility_mn:
      'Дунд сургуулийн төгсөгч, 35-аас доош нас. Эхний жил бэлтгэлийн факультетэд орос хэл сурна. Эрүүл мэндийн шалгалт.',
    deadline: '2026-11-15',
    application_url: 'https://education-in-russia.com/',
    document_checklist: [
      'Онлайн өргөдөл (education-in-russia.com)',
      'Иргэний үнэмлэх + паспорт',
      'Дунд сургуулийн дүн (апостилтай)',
      'Эрүүл мэндийн справка',
      'Гэрлийн зураг',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'ОХУ-ын засгийн газрын квот — Магистр',
    funder: 'Россотрудничество',
    destination_code: 'RU',
    level: 'PG',
    eligibility_mn:
      'Бакалаврын төгсөгч, 35-аас доош нас. Орос хэлний түвшин дунд эсвэл түүнээс дээш. Research direction тодорхой.',
    deadline: '2026-11-15',
    application_url: 'https://education-in-russia.com/',
    document_checklist: [
      'Онлайн өргөдөл',
      'Бакалаврын диплом + дүн (апостил)',
      'Research Proposal',
      'Орос/англи хэлний шалгалт',
      'Эрүүл мэндийн справка',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'Open Doors Russian Scholarship',
    funder: 'Open Doors Olympiad',
    destination_code: 'RU',
    level: 'PG',
    eligibility_mn:
      'Олимпиадын гурван үе шатыг давсан гадаад оюутан. Шалгалтын чиглэлээр Орос дахь магистрт төлбөргүй элсэх.',
    deadline: '2026-12-10',
    application_url: 'https://opendoors.studyinrussia.ru/',
    document_checklist: [
      'Open Doors-ын олимпиадын бүртгэл',
      'Бакалаврын дүн',
      'CV',
      'Хувийн санал бичих эссэ',
    ],
    funding_type: 'TUITION_ONLY',
  },
  // ── DE ────────────────────────────────────────────────────────────────
  {
    name_mn: 'DAAD UG Scholarship',
    funder: 'DAAD (German Academic Exchange Service)',
    destination_code: 'DE',
    level: 'UG',
    eligibility_mn:
      'Гадаад дунд сургуулийн төгсөгч, өндөр дүнтэй. Германы UG хөтөлбөр болон Studienkolleg-ийн зардлыг хэсэгчлэн санхүүжүүлдэг.',
    deadline: '2026-10-31',
    application_url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
    document_checklist: [
      'DAAD онлайн өргөдөл',
      'Дунд сургуулийн дүн',
      'Герман/англи хэлний гэрчилгээ',
      'Motivation Letter',
      '2 багшийн тодорхойлолт',
    ],
    funding_type: 'PARTIAL',
  },
  {
    name_mn: 'DAAD WISE — Зуны судалгаа',
    funder: 'DAAD (German Academic Exchange Service)',
    destination_code: 'DE',
    level: 'UG',
    eligibility_mn:
      'Бакалаврын 2-р курсын дээш оюутан, шинжлэх ухаан/инженер чиглэл. 2-3 сарын зуны амралтаар Германд судалгаа хийх.',
    deadline: '2026-12-15',
    application_url: 'https://www.daad.de/wise',
    document_checklist: [
      'WISE онлайн өргөдөл',
      'Дүнгийн тодорхойлолт',
      'Английн IELTS 6.0+ эсвэл TOEFL 80+',
      'Германы профессорын урилгын захиа',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'Heinrich Böll Foundation International',
    funder: 'Heinrich Böll Stiftung',
    destination_code: 'DE',
    level: 'PG',
    eligibility_mn:
      'Магистр, доктор оюутан. Тогтвортой хөгжил, ардчилал, экологийн чиглэлд тууштай байх.',
    deadline: '2027-03-01',
    application_url: 'https://www.boell.de/en/foundation/scholarships',
    document_checklist: [
      'Онлайн өргөдөл',
      'CV + Motivation Letter',
      'Research Proposal',
      'Герман эсвэл англи хэлний гэрчилгээ',
      '2 багшийн тодорхойлолт',
    ],
    funding_type: 'FULL',
  },
  // ── UK ────────────────────────────────────────────────────────────────
  {
    name_mn: 'Chevening Scholarship',
    funder: 'UK Foreign, Commonwealth & Development Office',
    destination_code: 'UK',
    level: 'PG',
    eligibility_mn:
      'Бакалаврын төгсөгч, 2+ жилийн ажлын туршлага, удирдамжийн чадвартай. Их Британид 1 жил магистрт суралцаж буцаж эх орондоо ажиллах амлалт.',
    deadline: '2026-11-04',
    application_url: 'https://www.chevening.org/apply/',
    document_checklist: [
      'Chevening онлайн өргөдөл',
      '4 эссэ (Leadership, Networking, Career, Study)',
      '2 багш/ажил олгогчийн тодорхойлолт',
      'Бакалаврын диплом',
      'IELTS 6.5+ (ярилцлагын дараа)',
      '3 их сургуулийн UCAS-гүй өргөдөл',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'Commonwealth Shared Scholarship',
    funder: 'Commonwealth Scholarship Commission',
    destination_code: 'UK',
    level: 'PG',
    eligibility_mn:
      'Хөгжиж буй орны иргэн (Монгол хамаарагдана), магистрын чиглэлийн оюутан. Тогтсон Британий их сургуультай хамтран хүсэлт гаргана.',
    deadline: '2027-01-15',
    application_url: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships/',
    document_checklist: [
      'Онлайн өргөдөл (CSC + их сургууль зэрэг)',
      'Бакалаврын дүн (2:1 дээш)',
      'Research Proposal',
      '2 багшийн тодорхойлолт',
      'IELTS 6.5+',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'GREAT Scholarship',
    funder: 'British Council & UK universities',
    destination_code: 'UK',
    level: 'PG',
    eligibility_mn:
      'Шилдэг гадаад магистрын оюутан, тогтсон UK их сургуультай хамтын хөтөлбөр. £10,000 хүртэлх сургалтын төлбөрийн хөнгөлөлт.',
    deadline: '2027-05-31',
    application_url: 'https://study-uk.britishcouncil.org/scholarships/great-scholarships',
    document_checklist: [
      'Их сургуульд элсэлтийн өргөдөл',
      'Бакалаврын дүн',
      'Personal Statement',
      'IELTS 6.5+',
    ],
    funding_type: 'PARTIAL',
  },
  {
    name_mn: 'Said Foundation Scholarship',
    funder: 'Said Foundation',
    destination_code: 'UK',
    level: 'PG',
    eligibility_mn:
      'Дунд Ази, Ойрхи Дорнодын магистрын оюутан, нийгмийн ач холбогдолтой чиглэл. Эх орондоо буцаж ажиллах амлалттай.',
    deadline: '2026-12-01',
    application_url: 'https://saidfoundation.org/scholarship/',
    document_checklist: [
      'Онлайн өргөдөл',
      'CV + Personal Statement',
      'Бакалаврын диплом',
      'Их сургуулийн элсэлтийн захиа',
      '2 багшийн тодорхойлолт',
    ],
    funding_type: 'FULL',
  },
  // ── US ────────────────────────────────────────────────────────────────
  {
    name_mn: 'Fulbright Foreign Student Program',
    funder: 'U.S. Department of State (IIE)',
    destination_code: 'US',
    level: 'PG',
    eligibility_mn:
      'Бакалаврын төгсөгч, 2+ жилийн ажлын туршлага. АНУ-д магистр/докторын чиглэлд 1-3 жил суралцана. ЭСЯ-аар өргөдөл.',
    deadline: '2026-10-15',
    application_url: 'https://foreign.fulbrightonline.org/',
    document_checklist: [
      'Fulbright онлайн өргөдөл',
      'Study Objective + Personal Statement',
      'CV',
      '3 багш/ажил олгогчийн тодорхойлолт',
      'GRE/GMAT (чиглэлээс хамаарч)',
      'TOEFL 80+',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'EducationUSA Opportunity Funds',
    funder: 'U.S. State Department (EducationUSA)',
    destination_code: 'US',
    level: 'UG',
    eligibility_mn:
      'Дунд сургуулийн төгсөгч, өндөр чадварлаг гэхдээ санхүүгийн дэмжлэг шаардлагатай. SAT/TOEFL шалгалт + АНУ-ын их сургуулийн өргөдлийн зардлыг нөхдөг.',
    deadline: '2026-09-30',
    application_url:
      'https://educationusa.state.gov/your-5-steps-us-study/finance-your-studies/opportunity-funds-program',
    document_checklist: [
      'EducationUSA-тэй уулзалт + үнэлгээ',
      'SAT шалгалтын төлбөрийн жагсаалт',
      'Санхүүгийн нөхцлийн тайлбар',
      'Дунд сургуулийн дүн',
    ],
    funding_type: 'PARTIAL',
  },
  {
    name_mn: 'East-West Center Graduate Fellowship',
    funder: 'East-West Center (Hawaii)',
    destination_code: 'US',
    level: 'PG',
    eligibility_mn:
      'Ази-Номхон далайн бүсийн магистрын оюутан, Hawaii Universityд суралцана. Олон соёлт орчинд оюутны солилцооны хөтөлбөр.',
    deadline: '2026-11-01',
    application_url: 'https://www.eastwestcenter.org/education/student-programs',
    document_checklist: [
      'East-West Center өргөдөл',
      'University of Hawaii өргөдөл (зэрэг)',
      'Бакалаврын диплом + дүн',
      'CV + Statement of Objectives',
      '3 багшийн тодорхойлолт',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'Hubert H. Humphrey Fellowship',
    funder: 'U.S. State Department',
    destination_code: 'US',
    level: 'PG',
    eligibility_mn:
      'Дунд карьерын мэргэжилтэн (5+ жилийн туршлага). АНУ-д 10 сар мэргэжлийн хөгжлийн хөтөлбөр — диплом өгөхгүй.',
    deadline: '2026-10-01',
    application_url: 'https://www.humphreyfellowship.org/',
    document_checklist: [
      'Онлайн өргөдөл',
      '5+ жилийн ажлын туршлагын тайлбар',
      'CV',
      '3 ажил олгогчийн тодорхойлолт',
      'TOEFL 80+',
    ],
    funding_type: 'FULL',
  },
  // ── AU ────────────────────────────────────────────────────────────────
  {
    name_mn: 'Australia Awards Scholarship',
    funder: 'Australian Government (DFAT)',
    destination_code: 'AU',
    level: 'PG',
    eligibility_mn:
      'Хөгжиж буй орны иргэн, 2+ жилийн ажлын туршлага. Эх орондоо буцаж 2+ жил ажиллах гэрээ. Хөгжлийн чиглэлийн магистрт суралцана.',
    deadline: '2026-06-30',
    application_url: 'https://www.dfat.gov.au/people-to-people/australia-awards/scholarships',
    document_checklist: [
      'Australia Awards онлайн өргөдөл',
      'CV',
      'Бакалаврын дүн',
      '2 багш/ажил олгогчийн тодорхойлолт',
      'IELTS 6.5+',
      'Development Impact Statement',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'Endeavour Postgraduate Scholarship',
    funder: 'Australian Government Department of Education',
    destination_code: 'AU',
    level: 'PG',
    eligibility_mn:
      'Гадаад иргэн, магистр/доктор зэрэг хийх оюутан. Шилдэг академик дүн + research excellence.',
    deadline: '2026-11-15',
    application_url: 'https://www.dese.gov.au/scholarships/endeavour',
    document_checklist: [
      'Онлайн өргөдөл',
      'Бакалаврын/магистрын диплом',
      'Research Proposal',
      'Их сургуулиас урилгын захиа',
      'IELTS 6.5+',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'Westpac Future Leaders Scholarship',
    funder: 'Westpac Scholars Trust',
    destination_code: 'AU',
    level: 'UG',
    eligibility_mn:
      'Австралийн их сургуульд UG-д суралцаж буй гадаад оюутан. Удирдамжийн потенциал болон олон нийтийн оролцооны нотолгоо.',
    deadline: '2026-09-30',
    application_url: 'https://scholars.westpacgroup.com.au/',
    document_checklist: [
      'Онлайн өргөдөл',
      'CV + Personal Statement',
      'Их сургуулийн дүн',
      'Удирдамжийн туршлага',
    ],
    funding_type: 'PARTIAL',
  },
  // ── Extras to hit PRD §4.10b ≥30 target ──────────────────────────────
  {
    name_mn: 'Konrad-Adenauer-Stiftung Scholarship',
    funder: 'Konrad-Adenauer-Stiftung',
    destination_code: 'DE',
    level: 'PG',
    eligibility_mn:
      'Магистр, доктор зэрэг хийх оюутан. Ардчилал, төрийн засаглал, нийгмийн зах зээлийн чиглэлд тууштай. Герман хэлний түвшин шаардлагатай.',
    deadline: '2026-07-15',
    application_url: 'https://www.kas.de/web/begabtenfoerderung-und-kultur/scholarships',
    document_checklist: [
      'KAS онлайн өргөдөл',
      'CV + Motivation Letter',
      'Бакалаврын/магистрын диплом',
      '2 багшийн тодорхойлолт',
      'Герман хэлний гэрчилгээ (B2+)',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'World Bank Joint Japan Scholarship Program',
    funder: 'World Bank Group + Япон засгийн газар',
    destination_code: 'JP',
    level: 'PG',
    eligibility_mn:
      'Хөгжиж буй орны мэргэжилтэн, 3+ жилийн ажлын туршлага. Хөгжлийн чиглэлийн магистрт суралцана. Эх орондоо буцаж ажиллах амлалт.',
    deadline: '2027-03-15',
    application_url: 'https://www.worldbank.org/en/programs/scholarships',
    document_checklist: [
      'JJ/WBGSP онлайн өргөдөл',
      'CV + 3+ жилийн ажлын туршлагын тайлбар',
      'Бакалаврын диплом',
      '3 ажил олгогчийн тодорхойлолт',
      'TOEFL/IELTS',
      'Их сургуулиас элсэлтийн захиа',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'Friedrich Ebert Foundation Scholarship',
    funder: 'Friedrich-Ebert-Stiftung',
    destination_code: 'DE',
    level: 'PG',
    eligibility_mn:
      'Магистр, доктор зэрэг хийх оюутан. Социал-демократ үнэт зүйл, ажилчдын эрх, тогтвортой хөгжлийн чиглэлд оролцоо.',
    deadline: '2027-04-30',
    application_url: 'https://www.fes.de/studienfoerderung',
    document_checklist: [
      'FES онлайн өргөдөл',
      'CV + Motivation Letter',
      'Бакалаврын/магистрын диплом',
      '2 багшийн тодорхойлолт',
      'Олон нийтийн оролцооны нотолгоо',
    ],
    funding_type: 'FULL',
  },
  {
    name_mn: 'Erasmus Mundus Joint Master Degree (EMJMD)',
    funder: 'European Commission',
    destination_code: 'DE',
    level: 'PG',
    eligibility_mn:
      'Гадаад оюутан, бакалаврын төгсөгч. 2-р түвшний (магистр) хамтарсан хөтөлбөр — 2+ Европын улсад зэрэг суралцана. Чиглэл бүрд тусдаа консорциумын өргөдөл.',
    deadline: '2027-02-15',
    application_url: 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en',
    document_checklist: [
      'EMJMD каталогоос чиглэл сонгох',
      'Сонгосон консорциумын өргөдлийн маягт',
      'Бакалаврын диплом + дүн',
      'CV + Motivation Letter',
      '2 багшийн тодорхойлолт',
      'IELTS 6.5+ эсвэл TOEFL 90+',
    ],
    funding_type: 'FULL',
  },
];
