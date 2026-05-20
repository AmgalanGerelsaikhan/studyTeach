/* ─────────────────────────────────────────────────────────────
   Olympiad Directory + Filters (desktop)
   ───────────────────────────────────────────────────────────── */

const OlympiadDirectory = () => (
  <div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <StudentTopBar active="olympiad"/>

    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 0 }}>
      {/* filters */}
      <div className="st-scroll" style={{ background: "var(--st-paper-2)", borderRight: "1px solid rgba(185,132,56,0.4)", padding: 20, overflowY: "auto" }}>
        <div className="st-eyebrow">ШҮҮЛТҮҮР</div>
        <div className="st-h3" style={{ marginTop: 4, marginBottom: 14 }}>Олимпиадаа ол</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--st-ink)", marginBottom: 6, letterSpacing: "0.05em" }}>ХИЧЭЭЛ</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {[
              ["Математик", true], ["Физик", true], ["Хими", false],
              ["Биологи", false], ["Информатик", false], ["Англи", false],
              ["Монгол", false], ["Түүх", false],
            ].map(([s, a], i) => (
              <span key={i} className={"st-chip " + (a ? "st-chip-ember" : "")} style={{ cursor: "pointer" }}>{s}</span>
            ))}
          </div>
        </div>

        <FilterGrp t="АНГИ" opts={[["1-4", false], ["5-8", false], ["9-10", true], ["11-12", true]]} multi/>
        <FilterGrp t="ХҮРГЭЛТ" opts={[["Танхим", true], ["Цахим (proctored)", true], ["Холимог", false]]} multi/>
        <FilterGrp t="БҮС" opts={[
          ["Улаанбаатар", true], ["Дархан-Уул", true], ["Эрдэнэт", true],
          ["Дорнод бүс", false], ["Баруун бүс", false], ["Хангай", false],
        ]} multi/>
        <FilterGrp t="БҮРТГЭЛИЙН ХУГАЦАА" opts={[
          ["Энэ долоо хоног", true], ["Энэ сар", true], ["Дараа сар", false], ["Дараа улирал", false],
        ]} multi/>
        <FilterGrp t="ТӨЛБӨР" opts={[
          ["Үнэгүй", true], ["₮ < 10,000", false], ["₮ 10–50,000", false], ["₮ > 50,000", false],
        ]} multi/>

        <div style={{ marginTop: 12, padding: 10, background: "rgba(62,95,115,0.08)", border: "1px dashed rgba(62,95,115,0.3)", borderRadius: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#34526a", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Icon name="globe" size={12} color="#34526a"/> Цахим олимпиадууд
          </div>
          <div style={{ fontSize: 10.5, color: "var(--st-ink-2)", lineHeight: 1.4 }}>
            Хөдөө орон нутгийн сурагчдад зориулсан зайн оролцооны хувилбар.
          </div>
        </div>
      </div>

      {/* list */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(185,132,56,0.3)", display: "flex", alignItems: "center", gap: 12, background: "var(--st-paper)" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--st-cream)", border: "1.5px solid rgba(185,132,56,0.5)", borderRadius: 10, padding: "8px 14px" }}>
            <Icon name="search" size={15} color="#836340"/>
            <input className="st-input" style={{ border: "none", background: "transparent", padding: 0, fontSize: 13 }} placeholder="Олимпиадын нэр, зохион байгуулагч, сэдэв..."/>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="st-tab" data-active="true">Бүгд · 23</button>
            <button className="st-tab">Бүртгэлтэй · 3</button>
            <button className="st-tab">Хадгалсан · 8</button>
          </div>
        </div>

        <div style={{ padding: "14px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="st-eyebrow">5 САР 20 — 8 САР 30</div>
            <div className="st-h2" style={{ fontSize: 18, marginTop: 2 }}>23 олимпиад илэрц</div>
          </div>
          <select className="st-input" style={{ width: "auto", padding: "6px 12px", fontSize: 12 }}>
            <option>Хугацаагаар</option>
            <option>Огноогоор</option>
          </select>
        </div>

        <div className="st-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 22px 22px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { sub: "math", subj: "Математик", title: "XLI Улсын Математикийн Олимпиад", org: "БНХӨҮХ", date: "6 САР 12 · 09:00", days: 23, grade: "9-12-р", venue: "Улаанбаатар · МУИС", online: false, fee: "₮ 15,000", registered: true, regClose: "5 САР 28" },
              { sub: "physics", subj: "Физик", title: "Орхон-Сэлэнгэ бүсийн Физик Олимпиад", org: "Дархан Хэрлэн ЕБС", date: "6 САР 28 · 10:00", days: 39, grade: "10-12-р", venue: "Цахим · proctored", online: true, fee: "Үнэгүй", registered: true, regClose: "6 САР 10" },
              { sub: "english", subj: "Англи хэл", title: "ХҮЭГ Англи хэлний Үндэсний АХ", org: "ХҮЭГ", date: "7 САР 5 · 14:00", days: 46, grade: "11-12-р", venue: "Дархан · ХҮЭГ", online: false, fee: "₮ 25,000", registered: true, regClose: "6 САР 20" },
              { sub: "info", subj: "Информатик", title: "Mongolia Code-Cup 2026 (зайн)", org: "Зорь", date: "7 САР 15 · 13:00", days: 56, grade: "8-12-р", venue: "Цахим · proctored", online: true, fee: "Үнэгүй", registered: false, regClose: "7 САР 1", spotsLeft: 124 },
              { sub: "chem", subj: "Хими", title: "Хан-Уул Химийн Олимпиад", org: "ХУ Боловсролын Газар", date: "7 САР 20 · 09:30", days: 61, grade: "9-12-р", venue: "Улаанбаатар · 23-р сургууль", online: false, fee: "₮ 8,000", registered: false, regClose: "7 САР 7" },
              { sub: "bio", subj: "Биологи", title: "Шинжлэх ухааны Цогц Олимпиад · Биологи", org: "ШУА", date: "8 САР 8 · 09:00", days: 80, grade: "11-12-р", venue: "Холимог · УБ + цахим", online: true, fee: "₮ 10,000", registered: false, regClose: "7 САР 25" },
            ].map((o, i) => <OlympCard key={i} {...o}/>)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const OlympCard = ({ sub, subj, title, org, date, days, grade, venue, online, fee, registered, regClose, spotsLeft }) => (
  <div className="st-card st-card-md" style={{ display: "flex", gap: 16, position: "relative" }}>
    {registered && (
      <div style={{ position: "absolute", top: 14, right: 14 }}>
        <span className="st-chip st-chip-moss"><Icon name="check" size={10} color="#4a5630"/> Бүртгэлтэй</span>
      </div>
    )}
    <div style={{
      width: 56, height: 56, borderRadius: 12,
      background: "var(--st-felt)",
      border: "1.5px solid rgba(185,132,56,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <SubjectGlyph subject={sub} size={28} color="#9A2F08"/>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        <span className="st-chip st-chip-ember">{subj}</span>
        {online && <span className="st-chip st-chip-sky"><Icon name="globe" size={10} color="#34526a"/> Цахим</span>}
        <span className="st-chip" style={{ fontSize: 10 }}>{grade}</span>
      </div>
      <div className="st-h2" style={{ fontSize: 17, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--st-ink-3)", display: "flex", gap: 14, flexWrap: "wrap" }}>
        <span><Icon name="school" size={11} color="#836340" style={{ verticalAlign: "-1px", marginRight: 4 }}/>{org}</span>
        <span><Icon name="calendar" size={11} color="#836340" style={{ verticalAlign: "-1px", marginRight: 4 }}/>{date}</span>
        <span><Icon name="pin" size={11} color="#836340" style={{ verticalAlign: "-1px", marginRight: 4 }}/>{venue}</span>
        <span><Icon name="cash" size={11} color="#836340" style={{ verticalAlign: "-1px", marginRight: 4 }}/>{fee}</span>
      </div>
    </div>
    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, minWidth: 130 }}>
      <div>
        <div className="st-num" style={{ fontFamily: "var(--st-display)", fontSize: 26, fontWeight: 700, color: "var(--st-ember)", lineHeight: 1 }}>{days}</div>
        <div style={{ fontSize: 10, color: "var(--st-ink-3)", letterSpacing: "0.1em" }}>ХОНОГ</div>
      </div>
      <div style={{ fontSize: 10.5, color: "var(--st-ink-3)" }}>Бүртгэл: {regClose}</div>
      {spotsLeft && <div style={{ fontSize: 10.5, color: "var(--st-cinnabar)", fontWeight: 600 }}>{spotsLeft} зай үлдсэн</div>}
      {registered
        ? <button className="st-btn st-btn-sm st-btn-secondary"><Icon name="ticket" size={12} color="#3A2818"/> Тасалбар</button>
        : <button className="st-btn st-btn-sm st-btn-primary">Бүртгүүлэх →</button>
      }
    </div>
  </div>
);

Object.assign(window, { OlympiadDirectory, OlympCard });
