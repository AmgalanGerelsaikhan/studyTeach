/* ─────────────────────────────────────────────────────────────
   STUDENT SCREENS
   Desktop: Home, AI Tutor, EGSh Mock + Predictor
   Mobile: Digital Ticket (offline)
   ───────────────────────────────────────────────────────────── */

// ===== Shared chrome =====================================================

const StudentTopBar = ({ active = "home" }) =>
<div style={{
  display: "flex", alignItems: "center", padding: "10px 22px", gap: 22,
  background: "linear-gradient(180deg, #2A1810 0%, #1A0F08 100%)",
  color: "#F4E8D1",
  borderBottom: "1px solid #8C5F22",
  flexShrink: 0
}}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <SoyomboFlame size={22} color="#D4A24C" />
      <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>
        studyTeach
      </div>
      <span style={{ fontSize: 10, color: "#B98438", letterSpacing: "0.15em", padding: "2px 6px", border: "1px solid #8C5F22", borderRadius: 4, marginLeft: 4 }}>
        СУРАГЧ
      </span>
    </div>
    <div style={{ display: "flex", gap: 4, marginLeft: 14 }}>
      {[
    ["home", "Нүүр"],
    ["tutor", "AI Багш"],
    ["egsh", "ЭЕШ"],
    ["olympiad", "Олимпиад"],
    ["abroad", "Гадаад"]].
    map(([k, v]) =>
    <button
      key={k}
      className="st-tab"
      data-active={active === k}
      style={{
        color: active === k ? "#2A1810" : "#D8BC85",
        background: active === k ? "#D4A24C" : "transparent"
      }}>
      
          {v}
        </button>
    )}
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#D8BC85", fontSize: 11.5 }}>
      <Icon name="wifi_off" size={14} color="#C28A1A" />
      <span>Офлайн · 7 хоног</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#D8BC85", fontSize: 11.5 }}>
      <Icon name="bell" size={15} color="#D4A24C" />
      <span style={{ background: "#C2410C", color: "#FBF3E2", borderRadius: 999, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>3</span>
    </div>
    <div className="st-avatar st-avatar-brass" style={{ width: 30, height: 30, fontSize: 12 }}>Б</div>
  </div>;


// ===== Student Home =====================================================

const StudentHome = () =>
<div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", flexDirection: "column" }}>
    <StudentTopBar active="home" />

    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", gap: 22, padding: "22px 26px", overflow: "hidden" }}>
      {/* LEFT — main column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minHeight: 0 }}>
        {/* Hero greeting card — ember lacquered wood */}
        <div className="st-card-ember st-tacked" style={{ padding: "22px 26px", position: "relative", overflow: "hidden" }}>
          <CornerBracket corner="tl" color="#F4C99A" />
          <CornerBracket corner="tr" color="#F4C99A" />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18, position: "relative", zIndex: 1 }}>
            <div style={{ flex: 1 }}>
              <div className="st-eyebrow" style={{ color: "#F4C99A", marginBottom: 8 }}>МЯГМАР · 5 САР 20</div>
              <div className="st-h1" style={{ color: "#FBF3E2", fontSize: 28, marginBottom: 6 }}>Сайн байна уу, Амгалан

            </div>
              <div style={{ color: "#F4E8D1", fontSize: 14, opacity: 0.9, maxWidth: 520 }}>
                Өнөөдөр Физикийн "Хүчний моментийн" концепцийг үргэлжлүүлбэл, та долоо хоногийн зорилгоо биелүүлэх боломжтой.
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="st-btn st-btn-brass">
                  <Icon name="play" size={14} color="#2A1810" /> Хичээлээ үргэлжлүүлэх
                </button>
                <button className="st-btn" style={{ background: "rgba(255,255,255,0.12)", color: "#FBF3E2", border: "1px solid rgba(244,201,154,0.4)" }}>
                  <Icon name="calendar" size={14} color="#F4C99A" /> Долоо хоногийн төлөвлөгөө
                </button>
              </div>
            </div>
            {/* streak */}
            <div style={{
            background: "rgba(42,24,16,0.4)",
            border: "1px solid #D4A24C",
            borderRadius: 14,
            padding: "12px 16px",
            minWidth: 130,
            textAlign: "center"
          }}>
              <SoyomboFlame size={28} color="#D4A24C" style={{ display: "block", margin: "0 auto 4px" }} />
              <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 28, color: "#FBF3E2" }}>23</div>
              <div style={{ fontSize: 10.5, color: "#F4C99A", letterSpacing: "0.1em" }}>ДЭС ДАРААЛАН · ӨДӨР</div>
            </div>
          </div>
          {/* meander accent strip */}
          <div style={{ marginTop: 18, marginLeft: -26, marginRight: -26, marginBottom: -22 }}>
            <Meander tone="ember" height={12} />
          </div>
        </div>

        {/* Continue + mastery row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, minHeight: 0 }}>
          {/* Continue lessons */}
          <div className="st-card st-card-md" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div className="st-eyebrow">ҮРГЭЛЖЛҮҮЛЭХ</div>
                <div className="st-h2" style={{ fontSize: 18, marginTop: 4 }}>Чиний хичээлүүд</div>
              </div>
              <a style={{ color: "var(--st-ember)", fontSize: 12, fontWeight: 600 }}>Бүгд →</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
            { subj: "physics", title: "Хүчний момент ба эргэх хөдөлгөөн", grade: "11-р анги · Физик", prog: 64, time: "12 мин үлдсэн", color: "#9A2F08" },
            { subj: "math", title: "Логарифм тэгшитгэл", grade: "11-р анги · Математик · ЭЕШ", prog: 42, time: "20 мин үлдсэн", color: "#9A2F08" },
            { subj: "english", title: "Reading: Cause & Effect Essays", grade: "B2 · Англи хэл", prog: 88, time: "5 мин үлдсэн", color: "#5C6B3B" }].
            map((l, i) =>
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 4px", borderBottom: i < 2 ? "1px solid rgba(185,132,56,0.18)" : "none" }}>
                  <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "var(--st-felt)",
                border: "1px solid rgba(185,132,56,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                    <SubjectGlyph subject={l.subj} size={22} color={l.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--st-ink)", marginBottom: 2 }}>{l.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--st-ink-3)" }}>{l.grade}</div>
                    <div className="st-progress" style={{ marginTop: 6, height: 5 }}>
                      <i style={{ width: l.prog + "%" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 15, color: "var(--st-ink)" }}>{l.prog}%</div>
                    <div style={{ fontSize: 10.5, color: "var(--st-ink-3)" }}>{l.time}</div>
                  </div>
                </div>
            )}
            </div>
          </div>

          {/* Mastery — small radial-ish bars */}
          <div className="st-card st-card-md">
            <div className="st-eyebrow">ЭЗЭМШИЛТИЙН ЗУРАГЛАЛ</div>
            <div className="st-h2" style={{ fontSize: 18, marginTop: 4, marginBottom: 14 }}>11-р ангийн сэдвүүд</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
            { s: "Математик", lvl: "Тогтсон", pct: 78, c: "#5C6B3B" },
            { s: "Физик", lvl: "Хөгжиж буй", pct: 54, c: "#C28A1A" },
            { s: "Хими", lvl: "Танилцсан", pct: 32, c: "#C2410C" },
            { s: "Биологи", lvl: "Тогтсон", pct: 71, c: "#5C6B3B" },
            { s: "Англи хэл", lvl: "Бүрэн эзэмшсэн", pct: 92, c: "#5C6B3B" }].
            map((m, i) =>
            <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--st-ink)" }}>{m.s}</span>
                    <span style={{ fontSize: 11, color: m.c, fontWeight: 600 }}>{m.lvl} · {m.pct}%</span>
                  </div>
                  <div className="st-progress" style={{ height: 6 }}>
                    <i style={{ width: m.pct + "%", background: `linear-gradient(90deg, ${m.c}, var(--st-ember))` }} />
                  </div>
                </div>
            )}
            </div>
          </div>
        </div>

        {/* Upcoming Olympiads */}
        <div className="st-card st-card-md" style={{ minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div className="st-eyebrow">УРАЛДААН ТЭМЦЭЭН</div>
              <div className="st-h2" style={{ fontSize: 18, marginTop: 4 }}>Бүртгүүлсэн олимпиадууд</div>
            </div>
            <button className="st-btn st-btn-sm st-btn-ghost"><Icon name="plus" size={12} /> Олимпиад нэмэх</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
          { sub: "Математик", title: "АНУ-ын Математикийн Олимпиад", date: "6 САР 12", days: 23, status: "Төлөгдсөн", color: "moss", venue: "Улаанбаатар · МУИС" },
          { sub: "Физик", title: "Бүсийн Физикийн Олимпиад", date: "6 САР 28", days: 39, status: "Цахим", color: "sky", venue: "Цахим · proctored" },
          { sub: "Англи хэл", title: "Үндэсний Англи хэлний АХ", date: "7 САР 5", days: 46, status: "Хүлээгдэж", color: "brass", venue: "Дархан · ХҮЭГ" }].
          map((o, i) =>
          <div key={i} style={{
            border: "1px solid rgba(185,132,56,0.4)",
            background: "var(--st-paper)",
            borderRadius: 12,
            padding: 12,
            position: "relative"
          }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div className="st-chip st-chip-ember">{o.sub}</div>
                  <span className={"st-chip st-chip-" + o.color}>{o.status}</span>
                </div>
                <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 14, color: "var(--st-soot)", lineHeight: 1.2, minHeight: 34 }}>
                  {o.title}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }}>
                  <div>
                    <div className="st-num" style={{ fontFamily: "var(--st-display)", fontSize: 22, fontWeight: 700, color: "var(--st-ember)", lineHeight: 1 }}>{o.days}</div>
                    <div style={{ fontSize: 10, color: "var(--st-ink-3)", letterSpacing: "0.1em" }}>ХОНОГ ҮЛДСЭН · {o.date}</div>
                  </div>
                  <Icon name="ticket" size={20} color="#8C5F22" />
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--st-ink-3)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="pin" size={11} color="#836340" /> {o.venue}
                </div>
              </div>
          )}
          </div>
        </div>
      </div>

      {/* RIGHT — sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minHeight: 0 }}>
        {/* EGSh Score-band Predictor */}
        <div className="st-card-soot" style={{ padding: 20, position: "relative", overflow: "hidden" }}>
          <div className="st-eyebrow" style={{ color: "#D4A24C" }}>ЭЕШ ОНОО ТААВАР</div>
          <div className="st-h2" style={{ color: "#FBF3E2", fontSize: 16, marginTop: 4, marginBottom: 14 }}>Магадлалт оноо</div>

          {/* band visualization */}
          <div style={{ position: "relative", height: 70, marginBottom: 8 }}>
            <svg viewBox="0 0 260 70" style={{ width: "100%", height: "100%" }}>
              {/* track */}
              <rect x="0" y="46" width="260" height="6" rx="3" fill="#3a2818" />
              {/* score bands */}
              <defs>
                <linearGradient id="bandg" x1="0" x2="1">
                  <stop offset="0" stopColor="#C28A1A" stopOpacity="0.7" />
                  <stop offset="0.5" stopColor="#C2410C" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#C28A1A" stopOpacity="0.7" />
                </linearGradient>
              </defs>
              <rect x="140" y="42" width="80" height="14" rx="7" fill="url(#bandg)" />
              {/* ticks */}
              {[0, 25, 50, 75, 100].map((p, i) =>
            <g key={i}>
                  <line x1={p * 2.6} x2={p * 2.6} y1="52" y2="58" stroke="#8C5F22" strokeWidth="1" />
                  <text x={p * 2.6} y="68" fill="#B98438" fontSize="9" textAnchor="middle">{[400, 500, 600, 700, 800][i]}</text>
                </g>
            )}
              {/* current */}
              <g>
                <line x1="172" x2="172" y1="6" y2="44" stroke="#F4C99A" strokeWidth="1.4" strokeDasharray="2 2" />
                <circle cx="172" cy="49" r="6" fill="#F4C99A" stroke="#2A1810" strokeWidth="2" />
                <text x="172" y="20" fill="#FBF3E2" fontSize="18" fontWeight="700" textAnchor="middle" fontFamily="Bitter">666</text>
              </g>
            </svg>
          </div>
          <div style={{ fontSize: 11.5, color: "#D8BC85", lineHeight: 1.45 }}>
            7 хоног дотор хийсэн 3 загвар шалгалтаас тооцов. <span style={{ color: "#F4C99A" }}>620–710</span> онооны бүсэд байх магадлал <b style={{ color: "#FBF3E2" }}>72%</b>.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="st-btn st-btn-sm st-btn-brass" style={{ flex: 1 }}>Шинэ загвар авах</button>
            <button className="st-btn st-btn-sm" style={{ background: "transparent", color: "#D8BC85", border: "1px solid #8C5F22" }}>Дэлгэрэнгүй</button>
          </div>
        </div>

        {/* Today's tutor nudge */}
        <div className="st-card st-card-md" style={{ borderColor: "#C2410C", borderWidth: 1.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #C2410C, #7E1D0A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1.5px solid #B98438"
          }}>
              <SoyomboFlame size={16} color="#F4C99A" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 13, color: "var(--st-soot)" }}>AI Багш</div>
              <div style={{ fontSize: 10.5, color: "var(--st-ink-3)", letterSpacing: "0.08em" }}>МОНГОЛ ХЭЛ · АДАПТИВ</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--st-ink)", lineHeight: 1.5 }}>
            Сүүлийн загвар шалгалтаас <b>"Хүчний момент"</b> сэдэв сул байгааг анзаарлаа. 12 минут зарцуулж засая уу?
          </div>
          <button className="st-btn st-btn-primary" style={{ marginTop: 12, width: "100%" }}>
            <Icon name="chat" size={14} color="#FBF3E2" /> AI Багштай ярилцах
          </button>
          <div style={{ fontSize: 10.5, color: "var(--st-ink-3)", marginTop: 8, textAlign: "center" }}>
            Энэ сард үлдсэн: <b style={{ color: "var(--st-ink)" }}>14 / 20</b> хичээл
          </div>
        </div>

        {/* Wellbeing pulse — boarding */}
        <div className="st-card st-card-md" style={{ background: "linear-gradient(180deg, #FBF3E2 0%, #EFE0BF 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="heart" size={16} color="#C2410C" />
            <div className="st-h3" style={{ fontSize: 13 }}>Долоо хоногийн пульс</div>
            <span className="st-chip st-chip-brass" style={{ marginLeft: "auto" }}>Нэрээ нууцлагдсан</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--st-ink-2)", lineHeight: 1.5 }}>
            Дотуур байрны амьдрал ямар байна? 5 асуулт, 2 минут.
          </div>
          <button className="st-btn st-btn-sm st-btn-secondary" style={{ marginTop: 10, width: "100%" }}>
            Бөглөх →
          </button>
        </div>
      </div>
    </div>
  </div>;


// ===== AI Tutor Chat =====================================================

const AITutor = () =>
<div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", flexDirection: "column" }}>
    <StudentTopBar active="tutor" />
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr 300px", minHeight: 0 }}>
      {/* LEFT — sessions list */}
      <div style={{ background: "var(--st-paper-2)", borderRight: "1px solid rgba(185,132,56,0.4)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="st-btn st-btn-primary st-btn-sm" style={{ width: "100%" }}>
          <Icon name="plus" size={12} color="#FBF3E2" /> Шинэ хичээл
        </button>
        <div className="st-eyebrow" style={{ marginTop: 8 }}>ӨНӨӨДӨР</div>
        {[
      { title: "Хүчний момент", subj: "Физик · 11-р анги", active: true },
      { title: "Логарифм бодлого", subj: "Математик · ЭЕШ" }].
      map((s, i) =>
      <div key={i} style={{
        padding: "10px 12px",
        borderRadius: 8,
        background: s.active ? "var(--st-paper)" : "transparent",
        border: s.active ? "1px solid var(--st-ember)" : "1px solid transparent",
        cursor: "pointer"
      }}>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--st-ink)" }}>{s.title}</div>
            <div style={{ fontSize: 10.5, color: "var(--st-ink-3)", marginTop: 2 }}>{s.subj}</div>
          </div>
      )}
        <div className="st-eyebrow" style={{ marginTop: 8 }}>ӨЧИГДӨР</div>
        {[
      { title: "Цахилгаан соронзон индукц", subj: "Физик · 11-р анги" },
      { title: "Reading: Cause & Effect", subj: "Англи хэл · B2" },
      { title: "Чингис хааны эзэнт гүрэн", subj: "Түүх · 10-р анги" }].
      map((s, i) =>
      <div key={i} style={{ padding: "8px 12px", cursor: "pointer" }}>
            <div style={{ fontWeight: 500, fontSize: 12.5, color: "var(--st-ink-2)" }}>{s.title}</div>
            <div style={{ fontSize: 10.5, color: "var(--st-ink-3)", marginTop: 1 }}>{s.subj}</div>
          </div>
      )}
      </div>

      {/* CENTER — chat */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* topic header */}
        <div style={{ padding: "14px 22px", borderBottom: "1px solid rgba(185,132,56,0.3)", display: "flex", alignItems: "center", gap: 12, background: "var(--st-paper)" }}>
          <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "var(--st-felt)",
          border: "1px solid rgba(185,132,56,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
            <SubjectGlyph subject="physics" size={20} color="#9A2F08" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 16, color: "var(--st-soot)" }}>Хүчний момент ба эргэх хөдөлгөөн</div>
            <div style={{ fontSize: 11.5, color: "var(--st-ink-3)" }}>Физик · 11-р анги · Курсын суурь 11.4.2</div>
          </div>
          <span className="st-chip st-chip-moss"><Icon name="check" size={10} color="#4a5630" /> Сургалтын хөтөлбөртэй уялдсан</span>
        </div>

        {/* messages */}
        <div className="st-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* AI greeting */}
          <ChatMsg from="ai" body={
        <>
              <p style={{ margin: 0 }}>Сайн уу, Болор-Эрдэнэ. Өчигдрийн загвар шалгалтад <b>хүчний моментийг эргүүлэх төвөөс зайтай нь хамаатуулсан</b> хэсэгт 2 алдсан байна. Үндсэн зүйлээс эхэлье.</p>
              <p style={{ margin: "10px 0 0" }}>Тэгш биеийн хувьд момент гэдэг нь:</p>
              <div style={{
            background: "var(--st-paper-2)", border: "1px solid rgba(185,132,56,0.4)",
            borderRadius: 8, padding: "10px 14px", fontFamily: "var(--st-display)", fontSize: 16, color: "var(--st-cinnabar)", margin: "8px 0", textAlign: "center"
          }}>
                M = F × d
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--st-ink-2)" }}>Энд <b>d</b> нь хүчний шугам ба эргүүлэх төв хоёрын <b>перпендикуляр зай</b> юм — энэ нь л чухал.</p>
            </>
        } />

          {/* student question */}
          <ChatMsg from="me" body={
        <p style={{ margin: 0 }}>Хүчээ налуу өнцгөөр түрхвэл d-г яаж олдог вэ?</p>
        } />

          {/* AI response with example */}
          <ChatMsg from="ai" body={
        <>
              <p style={{ margin: 0 }}>Сайн асуулт. Зураг дээр харъя — энд хүч <span style={{ color: "var(--st-cinnabar)", fontWeight: 600 }}>F</span> нь өнцгөөр түрхэгдэж байна.</p>
              {/* small SVG diagram */}
              <div style={{ background: "var(--st-paper)", border: "1px solid rgba(185,132,56,0.4)", borderRadius: 10, padding: 14, margin: "10px 0" }}>
                <svg viewBox="0 0 320 130" style={{ width: "100%", height: 130 }}>
                  {/* bar */}
                  <rect x="40" y="90" width="240" height="8" fill="#8C5F22" rx="2" />
                  {/* pivot */}
                  <circle cx="60" cy="94" r="6" fill="#2A1810" />
                  <text x="60" y="120" fontSize="10" textAnchor="middle" fill="#5C4530" fontFamily="Bitter">O</text>
                  {/* force arrow at angle */}
                  <line x1="240" y1="94" x2="290" y2="40" stroke="#C2410C" strokeWidth="2.4" markerEnd="url(#ah)" />
                  <defs>
                    <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                      <path d="M0 0 L8 4 L0 8 Z" fill="#C2410C" />
                    </marker>
                  </defs>
                  <text x="295" y="42" fontSize="13" fill="#C2410C" fontFamily="Bitter" fontWeight="700">F</text>
                  {/* perpendicular distance line */}
                  <line x1="60" y1="94" x2="240" y2="94" stroke="#3E5F73" strokeWidth="1.2" strokeDasharray="3 2" />
                  {/* angle */}
                  <path d="M240 94 A 18 18 0 0 0 252 80" fill="none" stroke="#5C4530" strokeWidth="1" />
                  <text x="252" y="92" fontSize="10" fill="#5C4530" fontFamily="Bitter">θ</text>
                  {/* d label */}
                  <text x="150" y="110" fontSize="11" fill="#3E5F73" fontFamily="Bitter" fontStyle="italic">r · sin θ = d</text>
                </svg>
              </div>
              <p style={{ margin: 0 }}>Тиймээс ерөнхий томьёо:</p>
              <div style={{
            background: "var(--st-paper-2)", border: "1px solid rgba(185,132,56,0.4)",
            borderRadius: 8, padding: "10px 14px", fontFamily: "var(--st-display)", fontSize: 16, color: "var(--st-cinnabar)", margin: "8px 0", textAlign: "center"
          }}>
                M = F · r · sin θ
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--st-ink-2)" }}>Одоо <b>2 жижиг дасгал</b> бэлдсэн. Хичээллэх үү?</p>
              {/* citation */}
              <div style={{ marginTop: 10, display: "flex", gap: 8, fontSize: 11, color: "var(--st-ink-3)", flexWrap: "wrap" }}>
                <span className="st-chip" style={{ fontSize: 10 }}><Icon name="book" size={10} color="#836340" /> БНХ 11.4.2</span>
                <span className="st-chip" style={{ fontSize: 10 }}><Icon name="file" size={10} color="#836340" /> ЭЕШ 2024 · Физик · #14</span>
              </div>
            </>
        } />

          {/* practice cards */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginLeft: 38 }}>
            <PracticeCard num={1} body="20 кг авдар нь шалаас 1.2 м-ийн зайтай налуу гадаргуу дээр байна. 80 N хүчийг 30° өнцгөөр түрхвэл момент хэд вэ?" />
            <PracticeCard num={2} body="Хэрэв 2 хүч (15 N ба 10 N) эсрэг тэсрэг чиглэлээр түрхэгдэж байвал, тэдгээрийн моментийн зөрүү ямар бөгөөд эргэлдэх чиглэл нь юу вэ?" />
          </div>
        </div>

        {/* input bar */}
        <div style={{ borderTop: "1px solid rgba(185,132,56,0.3)", padding: "14px 22px", background: "var(--st-paper)" }}>
          <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--st-cream)",
          border: "1.5px solid rgba(185,132,56,0.5)",
          borderRadius: 14, padding: "8px 12px"
        }}>
            <Icon name="pencil" size={16} color="#836340" />
            <input className="st-input" style={{ border: "none", background: "transparent", padding: 6 }} placeholder="Асуултаа Монголоор бичээрэй..." />
            <button className="st-btn st-btn-sm st-btn-ghost"><Icon name="mic" size={14} color="#836340" /></button>
            <button className="st-btn st-btn-sm st-btn-primary"><Icon name="arrow_r" size={12} color="#FBF3E2" /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10.5, color: "var(--st-ink-3)" }}>Шилжүүлэх:</span>
            <span className="st-chip" style={{ fontSize: 10 }}>Кирилл</span>
            <span className="st-chip" style={{ fontSize: 10, opacity: 0.5 }}>Latin</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10.5, color: "var(--st-ink-3)" }}>AI Багш шалгалтын хариу өгөхгүй</span>
          </div>
        </div>
      </div>

      {/* RIGHT — concept panel */}
      <div style={{ background: "var(--st-paper-2)", borderLeft: "1px solid rgba(185,132,56,0.4)", padding: 18, overflowY: "auto" }} className="st-scroll">
        <div className="st-eyebrow">ЭНЭ ХИЧЭЭЛИЙН ЭЗЭМШИЛТ</div>
        <div className="st-h3" style={{ marginTop: 6, marginBottom: 12 }}>Хүчний момент</div>

        {/* concept progress */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {[
        { c: "Хүчний моментийн томьёо", lvl: 90 },
        { c: "Перпендикуляр зай", lvl: 65 },
        { c: "Налуу хүчний задаргаа", lvl: 30 },
        { c: "Хосолсон моментүүд", lvl: 0 }].
        map((x, i) =>
        <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3, color: "var(--st-ink)" }}>
                <span>{x.c}</span>
                <span style={{ color: "var(--st-ink-3)" }}>{x.lvl}%</span>
              </div>
              <div className="st-progress" style={{ height: 5 }}>
                <i style={{ width: x.lvl + "%" }} />
              </div>
            </div>
        )}
        </div>

        <div className="st-divider" style={{ margin: "16px 0" }} />

        <div className="st-eyebrow">ХОЛБОГДОХ ЭХ ҮҮСВЭР</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {[
        { ic: "book", t: "БНХ — Физик 11.4: Хатуу биеийн динамик" },
        { ic: "file", t: "ЭЕШ 2024 · Физик · Бодлого 14" },
        { ic: "file", t: "ЭЕШ 2022 · Физик · Бодлого 9" }].
        map((r, i) =>
        <div key={i} style={{ display: "flex", gap: 8, padding: 6, cursor: "pointer", borderRadius: 6 }}>
              <Icon name={r.ic} size={14} color="#836340" />
              <span style={{ fontSize: 11.5, color: "var(--st-ink-2)", lineHeight: 1.3 }}>{r.t}</span>
            </div>
        )}
        </div>

        <div className="st-divider" style={{ margin: "16px 0" }} />
        <div style={{ background: "rgba(194,65,12,0.08)", border: "1px dashed rgba(194,65,12,0.4)", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11, color: "var(--st-cinnabar)", fontWeight: 600, marginBottom: 3 }}>Аюулгүй байдал</div>
          <div style={{ fontSize: 11, color: "var(--st-ink-2)", lineHeight: 1.4 }}>
            AI Багш шалгалтын үед эссэ бичихгүй, шалгалтын хариу өгөхгүй.
          </div>
        </div>
      </div>
    </div>
  </div>;


const ChatMsg = ({ from, body }) => {
  const me = from === "me";
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: me ? "flex-end" : "flex-start" }}>
      {!me &&
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "linear-gradient(135deg, #C2410C, #7E1D0A)",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1.5px solid #B98438", flexShrink: 0, marginTop: 2
      }}>
          <SoyomboFlame size={14} color="#F4C99A" />
        </div>
      }
      <div style={{
        maxWidth: 480,
        padding: "10px 14px",
        borderRadius: me ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
        background: me ? "linear-gradient(180deg, #C2410C, #9A2F08)" : "var(--st-paper)",
        color: me ? "#FBF3E2" : "var(--st-ink)",
        border: me ? "1px solid #7E1D0A" : "1px solid rgba(185,132,56,0.3)",
        fontSize: 13,
        lineHeight: 1.5,
        boxShadow: me ? "var(--st-shadow-sm)" : "var(--st-shadow-sm)"
      }}>
        {body}
      </div>
      {me &&
      <div className="st-avatar st-avatar-brass" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0, marginTop: 2 }}>Б</div>
      }
    </div>);

};

const PracticeCard = ({ num, body }) =>
<div style={{
  flex: 1, minWidth: 230, maxWidth: 280,
  border: "1.5px solid var(--st-brass)",
  background: "linear-gradient(180deg, #FBF3E2 0%, #EFE0BF 100%)",
  borderRadius: 10,
  padding: 12,
  cursor: "pointer",
  position: "relative"
}}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <span style={{
      background: "var(--st-ember)", color: "#FBF3E2",
      width: 20, height: 20, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, fontFamily: "var(--st-display)"
    }}>{num}</span>
      <span className="st-eyebrow" style={{ fontSize: 10 }}>ДАСГАЛ</span>
    </div>
    <div style={{ fontSize: 12, color: "var(--st-ink)", lineHeight: 1.45 }}>{body}</div>
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
      <Icon name="arrow_r" size={14} color="#C2410C" />
    </div>
  </div>;


Object.assign(window, { StudentTopBar, StudentHome, AITutor, ChatMsg, PracticeCard });