/* ─────────────────────────────────────────────────────────────
   PATHWAY — Study Abroad blueprint & Scholarship aggregator
   ───────────────────────────────────────────────────────────── */

const StudyAbroad = () => (
  <div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <StudentTopBar active="abroad"/>

    {/* Hero — destination header */}
    <div style={{
      background: "linear-gradient(135deg, #2A1810 0%, #1A0F08 100%)",
      color: "#F4E8D1",
      padding: "26px 32px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* faint pattern bg */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.06,
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='%23D4A24C' stroke-width='1'><rect x='10' y='10' width='60' height='60'/><rect x='20' y='20' width='40' height='40'/><rect x='30' y='30' width='20' height='20'/></g></svg>\")",
      }}/>
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 26 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#B98438", letterSpacing: "0.16em", marginBottom: 4 }}>
            <Icon name="chevron_r" size={11} color="#B98438" style={{ transform: "rotate(180deg)" }}/>
            ГАДААД СУРГУУЛИЙН ХАБ
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            {/* country flag — Japan abstract */}
            <div style={{
              width: 64, height: 44,
              background: "#FBF3E2",
              border: "1px solid #B98438",
              borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#C2410C" }}/>
            </div>
            <div>
              <div style={{ fontFamily: "var(--st-display)", fontSize: 30, fontWeight: 700, color: "#FBF3E2", lineHeight: 1 }}>
                Япон Улс
              </div>
              <div style={{ fontSize: 13, color: "#D4A24C", marginTop: 4 }}>日本 · 1,847 монгол оюутан · MEXT Тэтгэлэг</div>
            </div>
          </div>
          <div style={{ fontSize: 13.5, color: "#D8BC85", lineHeight: 1.55, maxWidth: 640, marginTop: 10 }}>
            Япон руу суралцахаар явахад MEXT тэтгэлэг хамгийн өргөн боломж юм — амьжиргааны зардал, сургалтын төлбөр бүрэн. EJU замаар Япон хэлний бэлтгэлийн дамжаагаар орох сонголт давхар бий.
          </div>
        </div>

        {/* key stats panel */}
        <div style={{
          background: "rgba(212,162,76,0.10)",
          border: "1px solid #8C5F22",
          borderRadius: 14,
          padding: 18,
          minWidth: 240,
        }}>
          <div className="st-eyebrow" style={{ color: "#D4A24C", marginBottom: 10 }}>ГОЛ ТООН ҮЗҮҮЛЭЛТ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
            <KV k="2024 MEXT-ийн хүлээн авалт" v="63 монгол" color="#FBF3E2"/>
            <KV k="Дундаж тэтгэлгийн хэмжээ" v="¥ 144,000 / сар" color="#FBF3E2"/>
            <KV k="Шалгарах боломж" v="≈ 8%" color="#F4C99A"/>
            <KV k="EJU ангилал" v="Шинжлэх ухаан/Хүмүүнлэг" color="#D8BC85"/>
            <KV k="Хэлний шалгалт" v="JLPT N2+ эсвэл EJU" color="#D8BC85"/>
          </div>
        </div>
      </div>
    </div>

    {/* tabs */}
    <div style={{ background: "var(--st-paper)", borderBottom: "1px solid rgba(185,132,56,0.3)", padding: "0 32px", display: "flex", gap: 4 }}>
      {[
        { l: "Үндсэн ойлголт", a: true },
        { l: "Шаардлага" },
        { l: "Санхүүгийн зам" },
        { l: "Цаг хугацааны хуваарь" },
        { l: "Нийтлэг алдаа" },
      ].map((t, i) => (
        <button key={i} style={{
          padding: "14px 18px",
          border: "none",
          background: "transparent",
          borderBottom: t.a ? "3px solid var(--st-ember)" : "3px solid transparent",
          color: t.a ? "var(--st-soot)" : "var(--st-ink-3)",
          fontFamily: "var(--st-sans)",
          fontWeight: t.a ? 700 : 500,
          fontSize: 13.5,
          cursor: "pointer",
          marginBottom: -1,
        }}>{t.l}</button>
      ))}
    </div>

    <div className="st-scroll" style={{ flex: 1, padding: "26px 32px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, minHeight: 0 }}>
      {/* left — content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* core concept card */}
        <div className="st-card st-card-md" style={{ position: "relative" }}>
          <CornerBracket corner="tl"/>
          <div className="st-eyebrow">ҮНДСЭН ОЙЛГОЛТ</div>
          <div className="st-h1" style={{ marginTop: 6, marginBottom: 10, fontSize: 22 }}>
            Япон руу хоёр гол замаар орно
          </div>
          <div style={{ fontSize: 13.5, color: "var(--st-ink-2)", lineHeight: 1.6 }}>
            Эхнийх нь <b>MEXT Засгийн газрын тэтгэлэг</b> — Японы Элчин сайдын яамаар дамжуулан. Хоёр дахь нь <b>Япон хэлний бэлтгэлийн дамжаа (語学学校)</b>-аар Япон руу очиж сурч, тэндээс шалгаруулалт өгөх. Хоёр замын аль алинд нь Япон хэлний түвшин шийдвэрлэх.
          </div>

          {/* two pathway columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
            <PathwayCard
              tone="ember"
              eyebrow="ЗАМ 1"
              t="MEXT · Элчин сайдын яамны зам"
              dur="Хүсэлт → 9 сар, Шалгалт → 12 сар"
              cost="Засгийн газрын бүрэн санхүүжилт"
              steps={[
                "Японы Элчин сайдын яамны MEXT өргөдөл (4-р сар)",
                "Бичгийн шалгалт (Англи + Япон + Математик/Хими/Биологи)",
                "Ярилцлага · Эцсийн шалгаруулалт",
                "Алдар нэрийн өргөмжлөл",
              ]}
            />
            <PathwayCard
              tone="sky"
              eyebrow="ЗАМ 2"
              t="EJU · Хэлний бэлтгэл"
              dur="6 - 24 сар Япон хэлний дамжаа"
              cost="₮ 18-32 сая · хувийн санхүүжилт"
              steps={[
                "Хэлний дамжаанд бүртгүүлэх (語学学校)",
                "Япон руу ирж амьдрах (JLPT N2 хүртэл)",
                "EJU шалгалт · Их сургуулийн тусгай шалгалт",
                "Албан ёсны элсэлт",
              ]}
            />
          </div>
        </div>

        {/* alumni */}
        <div className="st-card st-card-md">
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div className="st-eyebrow">МОНГОЛ ТӨГСӨГЧДИЙН ОЙЛГОЛТ</div>
              <div className="st-h3" style={{ marginTop: 4 }}>Япон дахь монгол төгсөгч 142</div>
            </div>
            <div style={{ flex: 1 }}/>
            <button className="st-btn st-btn-sm st-btn-secondary">Бүгдийг харах →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { n: "Энхтуяа Б.", who: "Tokyo Univ · MEXT 2021", dist: "Био-Анагаах ухаан", q: "Эссэгээ Япон хэлээр бичих ёстой гэдэг буруу ойлголт. Англи хэлээр илүү нухацтай байж болно." },
              { n: "Ганбат С.", who: "Kyoto Univ · 2019", dist: "Шинжлэх ухаан", q: "Япон хэл сурахаас илүү — япон сэтгэлгээ шингэх нь чухал. Гэр бүлийн нэг гишүүнтэй болж байгаа юм шиг." },
              { n: "Сараа Д.", who: "Osaka Univ · MEXT 2022", dist: "Эдийн засаг", q: "Хүлээж байх биш — өөрийн судалгааны асуултаа бэлдэж яв. Багш нар үүнийг үнэлдэг." },
            ].map((a, i) => (
              <div key={i} style={{
                background: "var(--st-paper)",
                border: "1px solid rgba(185,132,56,0.3)",
                borderRadius: 12,
                padding: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div className="st-avatar" style={{ width: 32, height: 32, fontSize: 12, background: ["#9A2F08","#3E5F73","#5C6B3B"][i] }}>{a.n[0]}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--st-soot)" }}>{a.n}</div>
                    <div style={{ fontSize: 10, color: "var(--st-ink-3)" }}>{a.who}</div>
                  </div>
                </div>
                <div className="st-chip st-chip-brass" style={{ fontSize: 9.5, marginBottom: 8 }}>{a.dist}</div>
                <div style={{ fontSize: 12, color: "var(--st-ink-2)", lineHeight: 1.5, fontStyle: "italic" }}>"{a.q}"</div>
                <button style={{
                  marginTop: 10, fontSize: 11, color: "var(--st-ember)", background: "none", border: "none",
                  fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                }}>
                  Зөвлөгөө асуух (1 удаа) <Icon name="arrow_r" size={11} color="#C2410C"/>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* right — timeline + AI coach */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="st-card st-card-md">
          <div className="st-eyebrow">МИНИЙ ЦАГ ХУГАЦАА · MEXT 2027</div>
          <div className="st-h3" style={{ marginTop: 4, marginBottom: 14 }}>Дараагийн 5 алхам</div>

          <div style={{ position: "relative", paddingLeft: 16 }}>
            <div style={{ position: "absolute", left: 6, top: 6, bottom: 6, width: 1, background: "rgba(185,132,56,0.5)" }}/>
            {[
              { d: "5 САР 30", t: "Бичиг баримтуудын анхдагч жагсаалт цуглуулах", st: "done" },
              { d: "6 САР 15", t: "Тэтгэлгийн эссэгийн анхны ноорог бичих", st: "active" },
              { d: "7 САР 10", t: "Япон хэлний шалгалт өгөх (JLPT N3+)", st: "todo" },
              { d: "9 САР 1", t: "Элчин сайдын яамны өргөдөл нээгдэх", st: "todo" },
              { d: "10 САР 25", t: "Бичгийн шалгалт", st: "todo" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, position: "relative" }}>
                <div style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: s.st === "done" ? "var(--st-moss)" : s.st === "active" ? "var(--st-ember)" : "var(--st-felt)",
                  border: s.st === "active" ? "2px solid var(--st-cinnabar)" : "1px solid rgba(185,132,56,0.5)",
                  marginLeft: -12, marginTop: 2, flexShrink: 0,
                  boxShadow: s.st === "active" ? "0 0 0 4px rgba(194,65,12,0.18)" : "none",
                }}/>
                <div>
                  <div style={{ fontSize: 10, color: "var(--st-ink-3)", letterSpacing: "0.1em", fontWeight: 700 }}>{s.d}</div>
                  <div style={{ fontSize: 12.5, color: s.st === "todo" ? "var(--st-ink-2)" : "var(--st-ink)", fontWeight: s.st === "active" ? 700 : 500, marginTop: 2, lineHeight: 1.35 }}>{s.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Application Coach */}
        <div className="st-card-soot" style={{ padding: 16, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #C2410C, #7E1D0A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1.5px solid #B98438",
            }}>
              <SoyomboFlame size={16} color="#F4C99A"/>
            </div>
            <div>
              <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 13, color: "#FBF3E2" }}>AI Өргөдлийн Зөвлөгч</div>
              <div style={{ fontSize: 10, color: "#B98438", letterSpacing: "0.1em" }}>МОНГОЛ · ЯПОН · АНГЛИ</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#D8BC85", lineHeight: 1.5, marginBottom: 12 }}>
            Эссэгийнхээ <b style={{ color: "#F4C99A" }}>анхны ноорог</b>-ыг оруулсны дараа AI бүтэцлэн засна — өгөгдсөн сэдвээр шууд бичиж өгөхгүй.
          </div>
          <div style={{ background: "rgba(212,162,76,0.10)", border: "1px solid #8C5F22", borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#D4A24C", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>СҮҮЛИЙН САНАЛ</div>
            <div style={{ fontSize: 11.5, color: "#F4E8D1", lineHeight: 1.45 }}>
              "Чи яагаад Япон руу" гэдэг хэсэг хэт ерөнхий. Өөрийн жишээ дурьдвал илүү бат.
            </div>
          </div>
          <button className="st-btn st-btn-brass" style={{ width: "100%" }}>Эссэ үргэлжлүүлэх <Icon name="arrow_r" size={12} color="#2A1810"/></button>
        </div>

        {/* common pitfall */}
        <div className="st-card st-card-tight" style={{ padding: 14, borderLeft: "3px solid var(--st-warn)" }}>
          <div className="st-eyebrow" style={{ color: "var(--st-warn)" }}>НИЙТЛЭГ АЛДАА</div>
          <div style={{ fontSize: 12.5, color: "var(--st-ink), lineHeight: 1.5", color: "var(--st-ink)", lineHeight: 1.5, marginTop: 6 }}>
            Япон хэлгүй ч "сурч авна" гэдэг — ихэнх Монгол элсэгчид аль хэдийн JLPT N3 түвшинтэй ирдэг. Бэлтгэлийн дамжаагаар орох нь илүү бодитой зам.
          </div>
        </div>
      </div>
    </div>
  </div>
);

const KV = ({ k, v, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
    <span style={{ color: "#B98438" }}>{k}</span>
    <span style={{ color: color || "#FBF3E2", fontWeight: 600, textAlign: "right" }}>{v}</span>
  </div>
);

const PathwayCard = ({ tone, eyebrow, t, dur, cost, steps }) => {
  const ember = tone === "ember";
  return (
    <div style={{
      background: ember ? "linear-gradient(180deg, rgba(194,65,12,0.06), rgba(194,65,12,0.02))" : "linear-gradient(180deg, rgba(62,95,115,0.06), rgba(62,95,115,0.02))",
      border: ember ? "1px solid var(--st-ember)" : "1px solid var(--st-sky)",
      borderRadius: 12, padding: 14,
    }}>
      <div className="st-eyebrow" style={{ color: ember ? "var(--st-ember)" : "var(--st-sky)" }}>{eyebrow}</div>
      <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 14.5, color: "var(--st-soot)", marginTop: 4, marginBottom: 8 }}>{t}</div>
      <div style={{ fontSize: 11, color: "var(--st-ink-3)", marginBottom: 4 }}>Хугацаа: <b style={{ color: "var(--st-ink-2)" }}>{dur}</b></div>
      <div style={{ fontSize: 11, color: "var(--st-ink-3)", marginBottom: 10 }}>Зардал: <b style={{ color: "var(--st-ink-2)" }}>{cost}</b></div>
      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {steps.map((s, i) => (
          <li key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "var(--st-ink)" }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              background: ember ? "var(--st-ember)" : "var(--st-sky)",
              color: "#FBF3E2", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, fontFamily: "var(--st-display)",
            }}>{i + 1}</span>
            <span style={{ lineHeight: 1.4 }}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

// ===== Scholarship Aggregator ===========================================

const ScholarshipAggregator = () => (
  <div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <StudentTopBar active="abroad"/>

    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 0 }}>
      {/* filters */}
      <div className="st-scroll" style={{ background: "var(--st-paper-2)", borderRight: "1px solid rgba(185,132,56,0.4)", padding: 20, overflowY: "auto" }}>
        <div className="st-eyebrow">ШҮҮЛТҮҮР</div>
        <div className="st-h3" style={{ marginTop: 4, marginBottom: 14 }}>Тэтгэлэгүүд</div>

        <FilterGrp t="ОЧИХ ОРОН" opts={[
          ["Япон", true], ["Өмнөд Солонгос", true], ["АНУ", false],
          ["БНХАУ", false], ["Орос", false], ["Герман", false],
          ["Их Британи", false], ["Австрали", false],
        ]} multi/>
        <FilterGrp t="БОЛОВСРОЛЫН ТҮВШИН" opts={[
          ["Бакалавр", true], ["Магистр", false], ["Доктор", false],
        ]}/>
        <FilterGrp t="САНХҮҮЖИЛТ" opts={[
          ["Бүрэн санхүүжилттэй", true],
          ["Хэсэгчилсэн", false],
          ["Зөвхөн сургалтын төлбөр", false],
        ]}/>
        <FilterGrp t="ҮНДСЭН ХУГАЦАА" opts={[
          ["1 сарын дотор", false],
          ["3 сарын дотор", true],
          ["6 сарын дотор", true],
          ["1 жилийн дотор", false],
        ]}/>
      </div>

      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid rgba(185,132,56,0.3)", background: "var(--st-paper)", display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div className="st-eyebrow">ТЭТГЭЛГИЙН САН</div>
            <div className="st-h2" style={{ fontSize: 18, marginTop: 2 }}>23 тэтгэлэг таны шалгуурт тохирно</div>
          </div>
          <div style={{ flex: 1 }}/>
          <select className="st-input" style={{ width: "auto", padding: "8px 12px", fontSize: 12 }}>
            <option>Хугацаа дуусах хугацаагаар</option>
            <option>Санхүүжилтийн хэмжээгээр</option>
            <option>Орлуулах хэмжээгээр</option>
          </select>
        </div>

        <div className="st-scroll" style={{ flex: 1, overflowY: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            {
              flag: "🇯🇵", country: "Япон", c1: "#FBF3E2", c2: "#C2410C",
              name: "MEXT — Шинжлэх ухаан, Хүмүүнлэгийн чиглэл",
              org: "Японы Засгийн газар · Боловсролын яам",
              level: "Бакалавр · Магистр · Доктор",
              fund: "Бүрэн санхүүжилт + ¥144,000 / сар",
              dead: "9 САР 1", days: 104,
              hot: true,
              tags: ["Япон хэл шаардлагатай", "8% шалгарал", "Ярилцлагатай"],
            },
            {
              flag: "🇰🇷", country: "Өмнөд Солонгос", c1: "#FBF3E2", c2: "#3E5F73",
              name: "GKS · Global Korea Scholarship",
              org: "NIIED · Боловсрол, Хүний нөөцийг хөгжүүлэх хүрээлэн",
              level: "Бакалавр · Магистр",
              fund: "Бүрэн + ₩1.0M / сар",
              dead: "10 САР 15", days: 148,
              tags: ["TOPIK 3+ зорилт", "Хэлний бэлтгэлтэй", "Орон нутгийн квот"],
            },
            {
              flag: "🇩🇪", country: "Герман", c1: "#FBF3E2", c2: "#9A2F08",
              name: "DAAD Master's · Хөгжиж буй орнуудын тэтгэлэг",
              org: "Германы Академик Солилцооны Алба",
              level: "Магистр",
              fund: "€934 / сар + сургалтын төлбөр",
              dead: "8 САР 20", days: 92,
              tags: ["Англи хэл (IELTS 6.5)", "2+ жил ажилласан"],
            },
            {
              flag: "🇬🇧", country: "Их Британи", c1: "#FBF3E2", c2: "#3E5F73",
              name: "Chevening Scholarship",
              org: "FCDO · Foreign, Commonwealth & Development Office",
              level: "Магистр (нэг жил)",
              fund: "Бүрэн санхүүжилт + амьжиргаа",
              dead: "7 САР 5", days: 46,
              hot: true,
              tags: ["IELTS 6.5+", "2+ жил манлайлал", "Эссэ 4-ийг бичих"],
            },
            {
              flag: "🇨🇳", country: "БНХАУ", c1: "#FBF3E2", c2: "#C2410C",
              name: "CSC · Chinese Government Scholarship",
              org: "Хятад Улсын Боловсролын Яам",
              level: "Бакалавр · Магистр · Доктор",
              fund: "Бүрэн + 2500-3500 ¥ / сар",
              dead: "6 САР 30", days: 41,
              tags: ["HSK 4+ зөвлөмжтэй", "БХБСЯ-аар дамжуулна"],
            },
          ].map((s, i) => <ScholarshipCard key={i} {...s}/>)}
        </div>
      </div>
    </div>
  </div>
);

const ScholarshipCard = ({ flag, country, c1, c2, name, org, level, fund, dead, days, hot, tags }) => (
  <div className="st-card" style={{ padding: 0, display: "flex", overflow: "hidden", position: "relative" }}>
    {/* country strip */}
    <div style={{
      background: `linear-gradient(180deg, ${c2} 0%, ${c2}cc 100%)`,
      color: "#FBF3E2",
      padding: "16px 14px",
      display: "flex", flexDirection: "column", alignItems: "center",
      width: 86, flexShrink: 0,
      gap: 6, position: "relative",
    }}>
      <div style={{
        width: 44, height: 30, background: c1,
        borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, border: "1px solid rgba(42,24,16,0.2)",
      }}>{flag}</div>
      <div style={{ fontFamily: "var(--st-display)", fontSize: 11, fontWeight: 700, textAlign: "center", lineHeight: 1.1 }}>{country}</div>
    </div>

    <div style={{ flex: 1, padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        {hot && <span className="st-chip st-chip-ember"><span className="st-dot" style={{ background: "#C2410C" }}/> Их сонирхолтой</span>}
        {tags.map((t, i) => <span key={i} className="st-chip" style={{ fontSize: 10 }}>{t}</span>)}
      </div>
      <div className="st-h2" style={{ fontSize: 17, marginTop: 4, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 11.5, color: "var(--st-ink-3)", marginBottom: 10 }}>{org}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 11.5 }}>
        <div>
          <div style={{ color: "var(--st-ink-3)", fontSize: 10, letterSpacing: "0.1em", fontWeight: 700 }}>ТҮВШИН</div>
          <div style={{ color: "var(--st-ink)", marginTop: 2 }}>{level}</div>
        </div>
        <div>
          <div style={{ color: "var(--st-ink-3)", fontSize: 10, letterSpacing: "0.1em", fontWeight: 700 }}>САНХҮҮЖИЛТ</div>
          <div style={{ color: "var(--st-ink)", marginTop: 2 }}>{fund}</div>
        </div>
      </div>
    </div>

    <div style={{
      padding: "16px 18px",
      background: "var(--st-paper-2)",
      borderLeft: "1px dashed rgba(185,132,56,0.5)",
      display: "flex", flexDirection: "column", alignItems: "flex-end",
      gap: 8, width: 180, flexShrink: 0,
    }}>
      <div style={{ textAlign: "right" }}>
        <div className="st-num" style={{ fontFamily: "var(--st-display)", fontSize: 28, fontWeight: 700, color: days < 60 ? "var(--st-ember)" : "var(--st-soot)", lineHeight: 1 }}>{days}</div>
        <div style={{ fontSize: 10, color: "var(--st-ink-3)", letterSpacing: "0.1em", marginTop: 2 }}>ХОНОГ · {dead}</div>
      </div>
      <div style={{ flex: 1 }}/>
      <button className="st-btn st-btn-sm st-btn-ghost"><Icon name="star" size={11} color="#836340"/> Хадгалах</button>
      <button className="st-btn st-btn-sm st-btn-primary" style={{ width: "100%" }}>Үзэх →</button>
    </div>
  </div>
);

const FilterGrp = ({ t, opts, multi }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--st-ink)", marginBottom: 6, letterSpacing: "0.05em" }}>{t}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {opts.map(([o, a], i) => (
        <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--st-ink)", cursor: "pointer" }}>
          <span style={{
            width: 14, height: 14, borderRadius: multi ? 3 : "50%",
            background: a ? "var(--st-ember)" : "var(--st-paper)",
            border: a ? "1px solid var(--st-cinnabar)" : "1px solid rgba(185,132,56,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{a && <Icon name="check" size={9} color="#FBF3E2"/>}</span>
          {o}
        </label>
      ))}
    </div>
  </div>
);

Object.assign(window, { StudyAbroad, ScholarshipAggregator, PathwayCard, FilterGrp, KV, ScholarshipCard });
