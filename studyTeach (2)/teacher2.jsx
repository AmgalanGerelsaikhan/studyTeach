/* ─────────────────────────────────────────────────────────────
   Bulk Roster Upload · Teacher Academy course · Focus Mode
   ───────────────────────────────────────────────────────────── */

// ===== Bulk Roster ====================================================

const BulkRoster = () => (
  <div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", overflow: "hidden" }}>
    <TeacherSidebar active="roster" mode="admin"/>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{
        padding: "14px 24px", borderBottom: "1px solid rgba(185,132,56,0.3)",
        background: "var(--st-paper)",
        display: "flex", alignItems: "center",
      }}>
        <div>
          <div className="st-eyebrow">ЕРӨНХИЙ БҮРТГЭЛ ОРУУЛАХ</div>
          <div className="st-h2" style={{ fontSize: 19, marginTop: 2 }}>Дэлэгацийн бүртгэл · CSV / Excel</div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="st-btn st-btn-secondary"><Icon name="download" size={13} color="#3A2818"/> Загвар татах</button>
      </div>

      {/* Stepper */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(185,132,56,0.2)", background: "var(--st-paper-2)", display: "flex", gap: 12, alignItems: "center" }}>
        {[
          { n: 1, l: "Файл сонгох", done: true },
          { n: 2, l: "Багана тулгах", done: true },
          { n: 3, l: "Шалгалт ба засвар", active: true },
          { n: 4, l: "Олимпиад сонгох" },
          { n: 5, l: "Баталгаажуулах" },
        ].map((s, i, a) => (
          <React.Fragment key={s.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: s.done ? "var(--st-moss)" : s.active ? "var(--st-ember)" : "var(--st-felt)",
                color: s.done || s.active ? "#FBF3E2" : "var(--st-ink-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 12,
                border: s.active ? "2px solid #7E1D0A" : "none",
              }}>{s.done ? <Icon name="check" size={12} color="#FBF3E2"/> : s.n}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.active ? "var(--st-soot)" : "var(--st-ink-2)" }}>{s.l}</span>
            </div>
            {i < a.length - 1 && <div style={{ flex: 1, height: 1, background: "rgba(185,132,56,0.4)" }}/>}
          </React.Fragment>
        ))}
      </div>

      <div className="st-scroll" style={{ flex: 1, padding: 22, overflowY: "auto" }}>
        {/* File summary */}
        <div className="st-card st-card-md" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 10,
            background: "linear-gradient(135deg, #5C6B3B, #4a5630)",
            color: "#FBF3E2",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="file" size={22} color="#FBF3E2"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 14, color: "var(--st-soot)" }}>
              23-р сургууль · 11-Анги · ЭЕШ загвар.xlsx
            </div>
            <div style={{ fontSize: 12, color: "var(--st-ink-3)", marginTop: 2 }}>
              34 мөр оруулсан · 5 баганатай · 2 минутын өмнө
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 22, color: "var(--st-moss)" }}>28</div>
            <div style={{ fontSize: 10, color: "var(--st-ink-3)", letterSpacing: "0.1em" }}>БОЛОВСРУУЛАХАД БЭЛЭН</div>
          </div>
          <div style={{ width: 1, height: 36, background: "rgba(185,132,56,0.3)" }}/>
          <div style={{ textAlign: "right" }}>
            <div className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 22, color: "var(--st-ember)" }}>6</div>
            <div style={{ fontSize: 10, color: "var(--st-ink-3)", letterSpacing: "0.1em" }}>АНХААРУУЛГА</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <button className="st-tab" data-active="true" style={{ background: "var(--st-ember)", color: "#FBF3E2" }}>Шалгалт ({"6"})</button>
          <button className="st-tab">Бэлэн ({"28"})</button>
          <button className="st-tab">Бүгд ({"34"})</button>
        </div>

        {/* Issues table */}
        <div className="st-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "var(--st-paper-2)", borderBottom: "1px solid rgba(185,132,56,0.4)" }}>
                {["#", "Сурагчийн нэр", "Регистрийн дугаар", "Анги", "Сонгосон олимпиад", "Алдаа", ""].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "10px 14px", color: "var(--st-ink-3)", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { n: 3, name: "Алтансүх Г.", id: "ЯБ97120311", grade: "11", olym: "Математик, Физик", err: { kind: "id", msg: "Регистрийн чекс буруу — 11 → 11 (зөв: 1)" } },
                { n: 8, name: "Бат-Эрдэнэ", id: "ЦБ06012215", grade: "11", olym: "Физик", err: { kind: "name", msg: "Овог дутуу — бүтэн нэрийг оруулна уу" } },
                { n: 14, name: "Долгорсүрэн Б.", id: "АБ97120311", grade: "11", olym: "Хими (?)", err: { kind: "olym", msg: "\"Хими\" таниагүй — танигдсан: Хими ЕБ, Хими Их сургууль" } },
                { n: 19, name: "Энхзаяа Б.", id: "АБ97120311", grade: "11", olym: "Математик", err: { kind: "dup", msg: "Давхардсан — мөр 7-той зөрчилдөж байна" } },
                { n: 22, name: "Намсрай Ц.", id: "—", grade: "11", olym: "Математик", err: { kind: "id", msg: "Регистрийн дугаар хоосон" } },
                { n: 31, name: "Хүрэлбаатар", id: "АГ04022111", grade: "10", olym: "Физик", err: { kind: "grade", msg: "10-р анги — Физик 11+ зориулсан" } },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(185,132,56,0.18)", background: i % 2 === 1 ? "rgba(244,232,209,0.4)" : "transparent" }}>
                  <td style={{ padding: "10px 14px", color: "var(--st-ink-3)", fontFamily: "var(--st-display)", fontWeight: 700 }}>{r.n}</td>
                  <td style={{ padding: "10px 14px", color: "var(--st-ink)", fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--st-display)", color: r.id === "—" ? "var(--st-ember)" : "var(--st-ink)" }}>{r.id}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span className="st-chip" style={{ fontSize: 10 }}>{r.grade}</span>
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--st-ink)" }}>{r.olym}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="x" size={11} color="#C2410C"/>
                      <span style={{ fontSize: 11, color: "var(--st-cinnabar)" }}>{r.err.msg}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <button className="st-btn st-btn-sm st-btn-secondary"><Icon name="pencil" size={11} color="#3A2818"/> Засах</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
          <button className="st-btn st-btn-secondary"><Icon name="arrow_l" size={13} color="#3A2818"/> Буцах</button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 12, color: "var(--st-ink-3)" }}>Бэлэн 28 сурагчтайгаар үргэлжлүүлэх боломжтой</span>
            <button className="st-btn st-btn-primary">Үргэлжлүүлэх <Icon name="arrow_r" size={13} color="#FBF3E2"/></button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ===== Teacher Academy Course ====================================

const TeacherAcademy = () => (
  <div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", overflow: "hidden" }}>
    <TeacherSidebar active="academy" mode="self"/>

    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* breadcrumb */}
      <div style={{
        padding: "12px 24px",
        borderBottom: "1px solid rgba(185,132,56,0.3)",
        background: "var(--st-paper)",
        fontSize: 12, color: "var(--st-ink-3)",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <Icon name="school" size={13} color="#836340"/>
        Багшийн академи <Icon name="chevron_r" size={10} color="#836340"/>
        <span>Идэвхтэй сургалтын аргууд</span> <Icon name="chevron_r" size={10} color="#836340"/>
        <span style={{ color: "var(--st-ink)", fontWeight: 600 }}>Хичээл 4 · Үнэлгээний зураг</span>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr 280px", minHeight: 0 }}>
        {/* curriculum sidebar */}
        <div className="st-scroll" style={{ background: "var(--st-paper-2)", borderRight: "1px solid rgba(185,132,56,0.3)", overflowY: "auto", padding: 16 }}>
          <div className="st-eyebrow">КУРС · 8 ХИЧЭЭЛ</div>
          <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 14, color: "var(--st-soot)", marginTop: 4, marginBottom: 14, lineHeight: 1.25 }}>
            Идэвхтэй сургалтын аргууд — анги танхимд
          </div>

          {/* progress */}
          <div className="st-progress" style={{ marginBottom: 14 }}>
            <i style={{ width: "50%" }}/>
          </div>
          <div style={{ fontSize: 11, color: "var(--st-ink-3)", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
            <span>4 / 8 хичээл</span>
            <span style={{ color: "var(--st-brass-dark)", fontWeight: 600 }}>1.5 кредит</span>
          </div>

          {[
            { n: 1, t: "Идэвхтэй сурах онол", d: "18 мин", s: "done" },
            { n: 2, t: "Анхааралд хүрэх стратегиуд", d: "22 мин", s: "done" },
            { n: 3, t: "Бүлгийн ажил зохион байгуулах", d: "20 мин", s: "done" },
            { n: 4, t: "Үнэлгээний зураг", d: "24 мин", s: "active" },
            { n: 5, t: "Ялгаатай боловсрол", d: "18 мин", s: "todo" },
            { n: 6, t: "Технологи нэгтгэх", d: "16 мин", s: "todo" },
            { n: 7, t: "Эцэг эх багш", d: "20 мин", s: "todo" },
            { n: 8, t: "Эцсийн үнэлгээ", d: "30 мин", s: "todo" },
          ].map((l, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 8px",
              borderRadius: 8,
              background: l.s === "active" ? "var(--st-paper)" : "transparent",
              borderLeft: l.s === "active" ? "3px solid var(--st-ember)" : "3px solid transparent",
              marginBottom: 2,
              cursor: "pointer",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: l.s === "done" ? "var(--st-moss)" : l.s === "active" ? "var(--st-ember)" : "var(--st-felt)",
                color: l.s === "todo" ? "var(--st-ink-2)" : "#FBF3E2",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, fontFamily: "var(--st-display)",
                flexShrink: 0,
              }}>{l.s === "done" ? <Icon name="check" size={11} color="#FBF3E2"/> : l.n}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: l.s === "active" ? 700 : 500, color: l.s === "todo" ? "var(--st-ink-2)" : "var(--st-ink)", lineHeight: 1.25 }}>{l.t}</div>
                <div style={{ fontSize: 10.5, color: "var(--st-ink-3)", marginTop: 2 }}>{l.d}</div>
              </div>
            </div>
          ))}

          <div className="st-divider" style={{ margin: "16px 0" }}/>
          <div style={{ fontSize: 11, color: "var(--st-ink-3)" }}>
            Хамтрагч багш нар
          </div>
          <div style={{ display: "flex", marginTop: 8 }}>
            {["Б", "Ц", "О", "Х", "+12"].map((a, i) => (
              <div key={i} className={i === 4 ? "st-chip" : "st-avatar"} style={{
                width: i === 4 ? "auto" : 26, height: 26, fontSize: 10.5,
                marginLeft: i === 0 ? 0 : -8,
                border: "2px solid var(--st-paper-2)",
                background: i === 4 ? "var(--st-felt)" : ["#9A2F08", "#3E5F73", "#5C6B3B", "#B98438"][i],
                color: i === 4 ? "var(--st-ink)" : "#FBF3E2",
              }}>{a}</div>
            ))}
          </div>
        </div>

        {/* main lesson body */}
        <div className="st-scroll" style={{ overflowY: "auto", padding: 28, background: "var(--st-cream)" }}>
          {/* video frame */}
          <div style={{
            aspectRatio: "16/9",
            background: "linear-gradient(135deg, #2A1810 0%, #1A0F08 100%)",
            borderRadius: 14,
            position: "relative",
            border: "1px solid #8C5F22",
            boxShadow: "var(--st-shadow-lg)",
            overflow: "hidden",
            marginBottom: 22,
          }}>
            {/* faux scene */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: "#F4E8D1" }}>
                <Ulzii size={70} color="#D4A24C" strokeWidth={1.4}/>
                <div style={{ fontFamily: "var(--st-display)", fontSize: 22, fontWeight: 700, marginTop: 14 }}>Үнэлгээний зураг</div>
                <div style={{ fontSize: 13, color: "#B98438", marginTop: 4 }}>Хичээл 4 · 24 минут</div>
              </div>
            </div>
            {/* play button */}
            <div style={{
              position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(194,65,12,0.92)",
              border: "2px solid #F4C99A",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 10px 30px rgba(194,65,12,0.4)",
              cursor: "pointer",
            }}>
              <Icon name="play" size={26} color="#FBF3E2"/>
            </div>
            {/* progress + controls */}
            <div style={{ position: "absolute", left: 14, right: 14, bottom: 12, display: "flex", alignItems: "center", gap: 12, color: "#D8BC85", fontSize: 11 }}>
              <span>06:42</span>
              <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: "28%", height: "100%", background: "var(--st-brass-bright)" }}/>
              </div>
              <span>24:00</span>
            </div>
          </div>

          <div className="st-eyebrow">ХИЧЭЭЛ 4</div>
          <div className="st-h1" style={{ marginTop: 6, marginBottom: 10 }}>Үнэлгээний зураг — суралцагч бүрийн дотоод цаг</div>
          <div style={{ fontSize: 14, color: "var(--st-ink-2)", lineHeight: 1.6, maxWidth: 720 }}>
            Хичээл бүрийн ангид сурагчдын ойлголтыг 3 минутын дотор үнэлэх 4 практик хэрэгсэл. "Цэгүүдийг холбох", "Ноорог зураг", "Дохио гэрэл" болон "Гарах захидал" — багшид шууд хэрэглэх боломжтой.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 22 }}>
            {[
              { t: "Цэгүүдийг холбох", d: "Сурагч өмнөх хичээлээс одоо хүрсэн ойлголт хүртэлх замыг үг, зураг, тэмдэглэгээгээр харуулна." },
              { t: "Ноорог зураг", d: "Нэг минутаар цаасны буланд сэдвийн талаар зураг зурж, ярьж тайлбарлах." },
              { t: "Дохио гэрэл", d: "Улаан/шар/ногоон карт өргөн ойлголтын түвшингээ илэрхийлэх — анги бүр." },
              { t: "Гарах захидал", d: "Анги дуусахаас 5 минутын өмнө: \"Юу ойлгосон\"-\"Юу буруу ойлгосон\"-\"Юу асуух гэж байна\"." },
            ].map((c, i) => (
              <div key={i} className="st-card" style={{ padding: 16, position: "relative" }}>
                <CornerBracket corner="tl" size={14}/>
                <div className="st-eyebrow">АРГА {i + 1}</div>
                <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 14, color: "var(--st-soot)", marginTop: 6, marginBottom: 6 }}>{c.t}</div>
                <div style={{ fontSize: 12.5, color: "var(--st-ink-2)", lineHeight: 1.5 }}>{c.d}</div>
              </div>
            ))}
          </div>

          {/* embedded check */}
          <div className="st-card" style={{ marginTop: 22, padding: 18, background: "linear-gradient(180deg, #FBF3E2, #EFE0BF)", borderColor: "var(--st-brass)" }}>
            <div className="st-eyebrow" style={{ color: "var(--st-brass-dark)" }}>ЭНД ШАЛГА</div>
            <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 15, color: "var(--st-soot)", marginTop: 6, marginBottom: 14 }}>
              "Дохио гэрэл" аргын зорилго юу вэ?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { l: "Сурагчдын зан байдлыг ангилах",            sel: false },
                { l: "Ойлголтын түвшинг хурдан, бүх ангиар цуглуулах", sel: true, correct: true },
                { l: "Сурагчийг шагнах",                          sel: false },
              ].map((o, i) => (
                <div key={i} style={{
                  padding: "10px 12px",
                  background: o.sel ? "rgba(92,107,59,0.16)" : "var(--st-paper)",
                  border: o.sel ? "1.5px solid var(--st-moss)" : "1px solid rgba(185,132,56,0.3)",
                  borderRadius: 8,
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: 13, color: "var(--st-ink)",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: o.sel ? "var(--st-moss)" : "var(--st-felt)",
                    color: o.sel ? "#FBF3E2" : "var(--st-ink-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, fontFamily: "var(--st-display)",
                  }}>{["А", "Б", "В"][i]}</div>
                  {o.l}
                  {o.correct && o.sel && <Icon name="check" size={14} color="#5C6B3B" style={{ marginLeft: "auto" }}/>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right — discussion */}
        <div style={{ background: "var(--st-paper-2)", borderLeft: "1px solid rgba(185,132,56,0.3)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(185,132,56,0.3)" }}>
            <div className="st-eyebrow">ХАМТРАГЧ ХЭЛЭЛЦҮҮЛЭГ</div>
            <div className="st-h3" style={{ marginTop: 4, fontSize: 14 }}>Хичээлийн талбар</div>
          </div>
          <div className="st-scroll" style={{ overflowY: "auto", padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { who: "Бүтэдмаа О.", aimag: "Сүхбаатар · Баруун-Урт", avatar: "#5C6B3B", initial: "Б",
                msg: "Манай 9-р анги бол ноорог зургийг маш сайн хүлээж авдаг. Гэхдээ доод ангид жаахан төөрөлдөнө — зөвлөгөө байна уу?" },
              { who: "Цэцэгмаа Д.", aimag: "Дорнод · Чойбалсан", avatar: "#3E5F73", initial: "Ц",
                msg: "Гарах захидлыг 2 долоо хоног туршив. Сурагчдын асуултын чанар эрс өөрчлөгдсөн. Үргэлжлүүлж байна." },
              { who: "Ганхуяг Б.", aimag: "Өвөрхангай · Арвайхээр", avatar: "#9A2F08", initial: "Г",
                msg: "Дохио гэрэл — тосгоны хэт чимээгүй ангийн хувьд тохиромжтой. Картыг өнгөт цаасаар хийсэн." },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: m.avatar,
                  color: "#FBF3E2",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 12,
                  flexShrink: 0, border: "1.5px solid var(--st-brass)",
                }}>{m.initial}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "var(--st-soot)" }}>{m.who}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--st-ink-3)" }}>{m.aimag}</div>
                  <div style={{ fontSize: 12, color: "var(--st-ink)", marginTop: 4, lineHeight: 1.45 }}>{m.msg}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: "1px solid rgba(185,132,56,0.3)" }}>
            <input className="st-input" placeholder="Бодлоо хуваалцах..." style={{ fontSize: 12 }}/>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ===== Focus Mode — Teacher start view + Student locked view ============

const FocusModeTeacher = () => (
  <div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", overflow: "hidden" }}>
    <TeacherSidebar active="focus" mode="admin"/>

    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(185,132,56,0.3)", background: "var(--st-paper)" }}>
        <div className="st-eyebrow">ФОКУС ГОРИМ</div>
        <div className="st-h2" style={{ fontSize: 19, marginTop: 2 }}>Идэвхтэй хичээл · 11-А · Физик</div>
      </div>

      <div style={{ flex: 1, padding: 28, display: "grid", gridTemplateColumns: "1fr 360px", gap: 22 }}>
        {/* main control */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* class code */}
          <div className="st-card-ember" style={{ padding: 28, textAlign: "center", position: "relative" }}>
            <CornerBracket corner="tl" color="#F4C99A"/>
            <CornerBracket corner="tr" color="#F4C99A"/>
            <CornerBracket corner="br" color="#F4C99A"/>
            <CornerBracket corner="bl" color="#F4C99A"/>
            <div className="st-eyebrow" style={{ color: "#F4C99A" }}>АНГИЙН КОД</div>
            <div style={{
              fontFamily: "var(--st-display)", fontWeight: 800, fontSize: 64,
              color: "#FBF3E2", letterSpacing: "0.16em", marginTop: 6, lineHeight: 1,
            }}>
              7 4 9 3
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: "#F4E8D1", opacity: 0.9 }}>
              Энэ кодыг сурагчдад зар. Кодыг 45 минутын дараа автоматаар хаана.
            </div>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 22 }}>
              <div>
                <div className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 32, color: "#FBF3E2" }}>22</div>
                <div style={{ fontSize: 10.5, color: "#F4C99A", letterSpacing: "0.1em" }}>НЭВТЭРСЭН</div>
              </div>
              <div style={{ width: 1, background: "rgba(244,201,154,0.3)" }}/>
              <div>
                <div className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 32, color: "#F4C99A" }}>12</div>
                <div style={{ fontSize: 10.5, color: "#F4C99A", letterSpacing: "0.1em" }}>ХҮЛЭЭГДЭЖ БУЙ</div>
              </div>
              <div style={{ width: 1, background: "rgba(244,201,154,0.3)" }}/>
              <div>
                <div className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 32, color: "#FBF3E2" }}>34</div>
                <div style={{ fontSize: 10.5, color: "#F4C99A", letterSpacing: "0.1em" }}>НИЙТ</div>
              </div>
            </div>
          </div>

          {/* activity selection */}
          <div className="st-card st-card-md">
            <div className="st-eyebrow">ЭНЭ ЦАГТ ХИЙХ АЖИЛЛАГАА</div>
            <div className="st-h3" style={{ marginTop: 4, marginBottom: 12 }}>Сурагчдын төхөөрөмж зөвхөн доорхид нэвтэрнэ:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { ic: "book", t: "Уншлага", sub: "Физик 11.4 — Хатуу биеийн динамик", sel: true },
                { ic: "target", t: "Дасгал", sub: "10 асуултын богино тест", sel: false },
                { ic: "chat", t: "AI Багштай", sub: "Зөвхөн тухайн сэдвээр", sel: false },
                { ic: "file", t: "Эссэ бичих", sub: "Сэдэв: \"Эргэх хөдөлгөөн миний амьдралд\"", sel: false },
              ].map((a, i) => (
                <div key={i} style={{
                  padding: 12,
                  border: a.sel ? "2px solid var(--st-ember)" : "1px solid rgba(185,132,56,0.3)",
                  background: a.sel ? "rgba(194,65,12,0.06)" : "var(--st-paper)",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <Icon name={a.ic} size={20} color={a.sel ? "#C2410C" : "#836340"}/>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--st-soot)" }}>{a.t}</div>
                    <div style={{ fontSize: 11, color: "var(--st-ink-3)", marginTop: 2, lineHeight: 1.4 }}>{a.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* lock options */}
          <div className="st-card st-card-md">
            <div className="st-eyebrow">ХОРИГЛОХ ЗҮЙЛС</div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5 }}>
              {[
                { l: "Бусад апп руу шилжих", on: true },
                { l: "Олимпиадын самбар",     on: true },
                { l: "Чат, мессеж",           on: true },
                { l: "Гадаад сургуулийн хаб", on: true },
                { l: "Загвар шалгалт",        on: false },
                { l: "Тасалбарын сан",        on: false },
              ].map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                  <div style={{
                    width: 32, height: 18, borderRadius: 999, padding: 2,
                    background: o.on ? "var(--st-ember)" : "var(--st-felt)",
                    transition: "background 0.15s",
                    display: "flex", alignItems: "center",
                    justifyContent: o.on ? "flex-end" : "flex-start",
                  }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#FBF3E2", boxShadow: "var(--st-shadow-sm)" }}/>
                  </div>
                  <span style={{ color: "var(--st-ink)" }}>{o.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right — student list */}
        <div className="st-card st-card-tight" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 14, borderBottom: "1px solid rgba(185,132,56,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="st-eyebrow">САНХҮҮ · 22 / 34</div>
              <div className="st-h3" style={{ marginTop: 4 }}>Сурагчдын байдал</div>
            </div>
            <span className="st-chip st-chip-ember"><span className="st-dot"/> Идэвхтэй</span>
          </div>
          <div className="st-scroll" style={{ overflowY: "auto", flex: 1, padding: "8px 6px" }}>
            {[
              { n: "Алтанзул Б.", s: "in", time: "12:04" },
              { n: "Болор-Эрдэнэ Б.", s: "in", time: "12:04" },
              { n: "Болормаа Д.", s: "in", time: "12:04" },
              { n: "Бямбасүрэн Г.", s: "in", time: "12:05" },
              { n: "Ганбат С.", s: "in", time: "12:05" },
              { n: "Долгорсүрэн Х.", s: "wait", time: "—" },
              { n: "Мөнхбат О.", s: "in", time: "12:06" },
              { n: "Намбардорж Ц.", s: "in", time: "12:06" },
              { n: "Намсрай Ц.", s: "leave", time: "12:09" },
              { n: "Энхбат Ш.", s: "in", time: "12:07" },
              { n: "Сараа Б.", s: "wait", time: "—" },
              { n: "Эрдэнэбулган", s: "wait", time: "—" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 6, fontSize: 12 }}>
                <div className="st-avatar" style={{ width: 24, height: 24, fontSize: 10, background: s.s === "in" ? "var(--st-moss)" : s.s === "leave" ? "var(--st-ember)" : "var(--st-felt-deep)" }}>
                  {s.n[0]}
                </div>
                <span style={{ flex: 1, color: "var(--st-ink)", fontWeight: 500 }}>{s.n}</span>
                <span style={{
                  fontSize: 10, padding: "1px 7px", borderRadius: 999, fontWeight: 600,
                  background: s.s === "in" ? "rgba(92,107,59,0.18)" : s.s === "leave" ? "rgba(194,65,12,0.18)" : "var(--st-felt)",
                  color: s.s === "in" ? "#4a5630" : s.s === "leave" ? "var(--st-cinnabar)" : "var(--st-ink-3)",
                }}>
                  {s.s === "in" ? "Орсон" : s.s === "leave" ? "Гарах" : "Хүлээгдэж"}
                </span>
                <span style={{ fontSize: 10, color: "var(--st-ink-3)", fontFamily: "var(--st-display)", minWidth: 32, textAlign: "right" }}>{s.time}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: "1px solid rgba(185,132,56,0.3)" }}>
            <button className="st-btn st-btn-primary" style={{ width: "100%" }}>
              <Icon name="lock" size={13} color="#FBF3E2"/> Фокус горим эхлүүлэх
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ===== Focus Mode — Student locked view (mobile) ========================

const FocusModeStudent = () => (
  <div style={{ width: 390, height: 844 }}>
    <div className="st-phone-bezel">
      <div className="st-phone-screen st-root st-felt-bg">
        {/* status bar */}
        <div style={{
          height: 44, padding: "0 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--st-soot)", color: "#F4E8D1",
          fontSize: 13, fontWeight: 600,
        }}>
          <span>12:08</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <Icon name="lock" size={12} color="#D4A24C"/>
            <span style={{ color: "#D4A24C" }}>Фокус</span>
          </div>
        </div>

        {/* lock header */}
        <div style={{
          background: "linear-gradient(180deg, #C2410C 0%, #7E1D0A 100%)",
          color: "#FBF3E2",
          padding: "22px 22px 20px",
          position: "relative",
        }}>
          <CornerBracket corner="tl" color="#F4C99A"/>
          <CornerBracket corner="tr" color="#F4C99A"/>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(42,24,16,0.35)",
              border: "1.5px solid #F4C99A",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="lock" size={18} color="#F4C99A"/>
            </div>
            <div style={{ flex: 1 }}>
              <div className="st-eyebrow" style={{ color: "#F4C99A" }}>ФОКУС ГОРИМ · ИДЭВХТЭЙ</div>
              <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 16, marginTop: 2 }}>Оюунгэрэл багшийн анги</div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: "#F4E8D1", opacity: 0.9, lineHeight: 1.45 }}>
            Зөвхөн доорх ажиллагаанд нэвтрэх боломжтой. Бусад апп, цахим хаягууд хаалттай.
          </div>
          <div style={{
            marginTop: 14, display: "flex", justifyContent: "space-between",
            background: "rgba(42,24,16,0.3)",
            padding: "8px 12px", borderRadius: 8,
            fontSize: 11.5, color: "#F4C99A",
          }}>
            <span>Дуусах: <b style={{ color: "#FBF3E2" }}>12:50</b></span>
            <span>Үлдсэн: <b style={{ color: "#FBF3E2" }}>42 мин</b></span>
          </div>
        </div>

        <Meander tone="ember" height={10}/>

        <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="st-eyebrow">ОДОО ХИЙХ</div>
          <div className="st-card-soot" style={{ padding: 18, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "linear-gradient(135deg, #D4A24C, #8C5F22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="book" size={22} color="#2A1810"/>
              </div>
              <div>
                <div className="st-eyebrow" style={{ color: "#D4A24C" }}>УНШЛАГА</div>
                <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 15, color: "#FBF3E2", marginTop: 2 }}>
                  Физик 11.4 — Хатуу биеийн динамик
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#D8BC85", lineHeight: 1.5 }}>
              7 хуудас · Уншсаны дараа богино тестэд орох болно.
            </div>
            <button className="st-btn st-btn-brass" style={{ width: "100%", marginTop: 14 }}>
              <Icon name="play" size={13} color="#2A1810"/> Уншиж эхлэх
            </button>
          </div>

          <div className="st-eyebrow" style={{ marginTop: 8 }}>ХААЛТТАЙ ХҮЧИН ЗҮЙЛС</div>
          <div className="st-card st-card-tight" style={{ padding: 0 }}>
            {[
              { ic: "trophy", l: "Олимпиадын самбар" },
              { ic: "chat", l: "Чат, мессеж" },
              { ic: "globe", l: "Гадаад сургуулийн хаб" },
              { ic: "ticket", l: "Тасалбарын сан" },
            ].map((x, i, a) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px",
                borderBottom: i < a.length - 1 ? "1px solid rgba(185,132,56,0.18)" : "none",
                opacity: 0.55,
              }}>
                <Icon name={x.ic} size={16} color="#836340"/>
                <span style={{ flex: 1, fontSize: 13, color: "var(--st-ink-2)" }}>{x.l}</span>
                <Icon name="lock" size={13} color="#836340"/>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }}/>
          <div style={{ fontSize: 10.5, color: "var(--st-ink-3)", textAlign: "center", lineHeight: 1.4 }}>
            Багш нэг удаагийн кодоор горим тавьсан. Хичээл дуусах эсвэл багш зогсоосноор автоматаар суларна.
          </div>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { BulkRoster, TeacherAcademy, FocusModeTeacher, FocusModeStudent });
