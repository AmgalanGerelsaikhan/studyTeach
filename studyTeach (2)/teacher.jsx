/* ─────────────────────────────────────────────────────────────
   TEACHER SCREENS
   Dual-mode dashboard, Bulk roster, Teacher Academy course, Focus Mode
   ───────────────────────────────────────────────────────────── */

const TeacherSidebar = ({ active = "home", mode = "admin" }) => (
  <div style={{
    width: 220, background: "var(--st-soot)", color: "#F4E8D1",
    display: "flex", flexDirection: "column", flexShrink: 0,
    borderRight: "1px solid #8C5F22",
  }}>
    <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #3a2818" }}>
      <SoyomboFlame size={22} color="#D4A24C"/>
      <div>
        <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 15 }}>studyTeach</div>
        <div style={{ fontSize: 9.5, color: "#B98438", letterSpacing: "0.16em" }}>БАГШ · 23 СУРГУУЛЬ</div>
      </div>
    </div>

    {/* mode toggle */}
    <div style={{ padding: "12px 14px" }}>
      <div className="st-eyebrow" style={{ color: "#B98438", marginBottom: 6 }}>ГОРИМ</div>
      <div style={{
        display: "flex", background: "#1A0F08",
        border: "1px solid #3a2818", borderRadius: 10, padding: 3,
      }}>
        {[
          { k: "admin", l: "Сурагчид" },
          { k: "self", l: "Би өөрөө" },
        ].map(({ k, l }) => (
          <button key={k} style={{
            flex: 1, padding: "7px 8px",
            border: "none",
            borderRadius: 7,
            background: mode === k ? "linear-gradient(180deg, #C2410C, #7E1D0A)" : "transparent",
            color: mode === k ? "#FBF3E2" : "#8C5F22",
            fontFamily: "var(--st-sans)",
            fontWeight: 600,
            fontSize: 11.5,
            cursor: "pointer",
          }}>{l}</button>
        ))}
      </div>
    </div>

    <div style={{ padding: "4px 10px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
      {[
        { k: "home",     ic: "home",     l: "Удирдлагын самбар" },
        { k: "students", ic: "users",    l: "Сурагчид · 142" },
        { k: "roster",   ic: "upload",   l: "Бүртгэл оруулах" },
        { k: "analytics",ic: "chart",    l: "Шинжилгээ" },
        { k: "academy",  ic: "school",   l: "Багшийн академи", chip: "3 идэвхтэй" },
        { k: "focus",    ic: "lock",     l: "Фокус горим" },
        { k: "resources",ic: "folder",   l: "Хичээлийн материал" },
      ].map((it) => (
        <button key={it.k} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px",
          background: active === it.k ? "rgba(212,162,76,0.18)" : "transparent",
          border: active === it.k ? "1px solid #8C5F22" : "1px solid transparent",
          borderLeft: active === it.k ? "3px solid #D4A24C" : "3px solid transparent",
          borderRadius: 6,
          color: active === it.k ? "#FBF3E2" : "#D8BC85",
          fontSize: 12.5, fontWeight: active === it.k ? 600 : 500,
          textAlign: "left",
          cursor: "pointer",
        }}>
          <Icon name={it.ic} size={15} color={active === it.k ? "#D4A24C" : "#8C5F22"}/>
          <span style={{ flex: 1 }}>{it.l}</span>
          {it.chip && (
            <span style={{
              fontSize: 9, padding: "1px 6px",
              background: "var(--st-ember)", color: "#FBF3E2", borderRadius: 999,
            }}>{it.chip}</span>
          )}
        </button>
      ))}
    </div>

    <div style={{ padding: "12px 14px", borderTop: "1px solid #3a2818", display: "flex", alignItems: "center", gap: 10 }}>
      <div className="st-avatar st-avatar-sky" style={{ width: 32, height: 32, fontSize: 12 }}>О</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#FBF3E2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Оюунгэрэл Ц.</div>
        <div style={{ fontSize: 10.5, color: "#B98438" }}>Физикийн багш</div>
      </div>
      <Icon name="settings" size={14} color="#8C5F22"/>
    </div>
  </div>
);

// ===== Teacher Dashboard — Admin Mode ====================================

const TeacherDashboard = () => (
  <div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", overflow: "hidden" }}>
    <TeacherSidebar active="home" mode="admin"/>

    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* top bar */}
      <div style={{
        display: "flex", alignItems: "center", padding: "14px 24px", gap: 14,
        borderBottom: "1px solid rgba(185,132,56,0.3)",
        background: "var(--st-paper)",
      }}>
        <div>
          <div className="st-eyebrow">УДИРДЛАГЫН САМБАР · СУРАГЧДЫН ГОРИМ</div>
          <div className="st-h2" style={{ fontSize: 19, marginTop: 2 }}>Миний сурагчид</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative", width: 240 }}>
          <Icon name="search" size={14} color="#836340" style={{ position: "absolute", top: 11, left: 10 }}/>
          <input className="st-input" placeholder="Сурагчийн нэр, регистр..." style={{ paddingLeft: 32, fontSize: 12.5 }}/>
        </div>
        <button className="st-btn st-btn-secondary st-btn-sm"><Icon name="filter" size={13} color="#3A2818"/> Шүүлтүүр</button>
        <button className="st-btn st-btn-primary"><Icon name="plus" size={13} color="#FBF3E2"/> Олимпиад нэмэх</button>
      </div>

      <div className="st-scroll" style={{ flex: 1, padding: 22, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18, minHeight: 0 }}>
        {/* metric strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <Metric eyebrow="11-А АНГИ" big="34" sub="сурагч · 28 идэвхтэй" tint="brass"/>
          <Metric eyebrow="БҮРТГЭСЭН ОЛИМПИАД" big="6" sub="3 төлөгдсөн · 2 хүлээгдэж" tint="ember"/>
          <Metric eyebrow="ДУНДАЖ ЭЕШ ТААВАР" big="612" sub="ӨМНӨ САР +18" tint="moss" trend="up"/>
          <Metric eyebrow="АНХААРАЛ ШААРДАХ" big="4" sub="сэдвийн цоорхой бүхий" tint="ember" warn/>
        </div>

        {/* main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
          {/* Class matrix */}
          <div className="st-card st-card-md">
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div className="st-eyebrow">ШИНЖИЛГЭЭ · 11-А АНГИ · ФИЗИК</div>
                <div className="st-h3" style={{ marginTop: 4 }}>Сэдвийн эзэмшилтийн матриц</div>
              </div>
              <div style={{ flex: 1 }} />
              <select className="st-input" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}>
                <option>11-А (34)</option>
              </select>
            </div>

            {/* matrix */}
            <div style={{ overflowX: "auto" }} className="st-scroll">
              <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: 540, fontSize: 11.5 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--st-ink-3)", fontWeight: 600, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid rgba(185,132,56,0.3)" }}>Сурагч</th>
                    {["Кинематик", "Динамик", "Эргэлт", "Соронзон", "Дулаан", "Атом"].map((t) => (
                      <th key={t} style={{ padding: "6px 4px", color: "var(--st-ink-3)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textAlign: "center", borderBottom: "1px solid rgba(185,132,56,0.3)" }}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { n: "Алтанзул Б.", g: ["m","m","p","p","d","i"] },
                    { n: "Болор-Эрдэнэ Б.", g: ["m","m","d","p","i","p"], hi: true },
                    { n: "Болормаа Д.", g: ["m","p","p","i","i","-"] },
                    { n: "Бямбасүрэн Г.", g: ["p","p","d","d","d","i"] },
                    { n: "Ганбат С.", g: ["m","m","m","p","p","d"] },
                    { n: "Долгорсүрэн Х.", g: ["p","d","i","-","-","-"], warn: true },
                    { n: "Мөнхбат О.", g: ["p","p","p","d","i","i"] },
                    { n: "Намбардорж Ц.", g: ["m","m","p","p","p","d"] },
                    { n: "Сараа Б.", g: ["i","-","-","-","-","-"], warn: true },
                    { n: "Энхбат Ш.", g: ["m","p","p","d","d","i"] },
                  ].map((r, i) => (
                    <tr key={i} style={{ background: r.hi ? "rgba(212,162,76,0.12)" : "transparent" }}>
                      <td style={{ padding: "7px 8px", color: "var(--st-ink)", borderBottom: "1px solid rgba(185,132,56,0.18)", fontWeight: r.hi ? 700 : 500 }}>
                        {r.warn && <Icon name="flag" size={11} color="#C2410C" style={{ marginRight: 6, verticalAlign: "-1px" }}/>}
                        {r.n}
                      </td>
                      {r.g.map((g, j) => (
                        <td key={j} style={{ padding: "5px 4px", textAlign: "center", borderBottom: "1px solid rgba(185,132,56,0.18)" }}>
                          <MatrixCell level={g}/>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 10.5, color: "var(--st-ink-3)", flexWrap: "wrap" }}>
              <LegendDot color="#5C6B3B" label="Бүрэн эзэмшсэн"/>
              <LegendDot color="#7E8E4C" label="Тогтсон"/>
              <LegendDot color="#C28A1A" label="Хөгжиж буй"/>
              <LegendDot color="#C2410C" label="Танилцсан"/>
              <LegendDot color="#E8D5AF" label="Эхлээгүй"/>
            </div>
          </div>

          {/* Upcoming events + delegation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* delegation status */}
            <div className="st-card st-card-md">
              <div className="st-eyebrow">ДЭЛЭГАЦИ · УЛСЫН АХ</div>
              <div className="st-h3" style={{ marginTop: 4, marginBottom: 12 }}>Физик · 6 САР 12</div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ position: "relative", width: 80, height: 80 }}>
                  <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#E8D5AF" strokeWidth="8"/>
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#C2410C" strokeWidth="8"
                      strokeDasharray="213" strokeDashoffset="60" strokeLinecap="round"
                      transform="rotate(-90 40 40)"/>
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 20, color: "var(--st-soot)" }}>14</span>
                    <span style={{ fontSize: 9, color: "var(--st-ink-3)" }}>/ 20</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--st-ink-2)" }}>Бүртгэгдсэн</span>
                    <span style={{ color: "var(--st-moss)", fontWeight: 600 }}>14</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--st-ink-2)" }}>Төлбөр төлөгдсөн</span>
                    <span style={{ color: "var(--st-moss)", fontWeight: 600 }}>12</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--st-ink-2)" }}>Хүлээгдэж буй</span>
                    <span style={{ color: "#C28A1A", fontWeight: 600 }}>2</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--st-ink-2)" }}>Боломжтой</span>
                    <span style={{ color: "var(--st-ink-3)" }}>6 / 20</span>
                  </div>
                </div>
              </div>

              <button className="st-btn st-btn-secondary st-btn-sm" style={{ width: "100%" }}>
                <Icon name="cash" size={13} color="#3A2818"/> QPay нэхэмжлэх (180,000 ₮)
              </button>
              <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--st-ink-3)", textAlign: "center" }}>
                И-Баримт автоматаар үүснэ
              </div>
            </div>

            {/* boys at risk teaser */}
            <div className="st-card st-card-md" style={{ borderLeft: "3px solid var(--st-ember)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon name="shield" size={15} color="#C2410C"/>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--st-ember)" }}>ДЭМЖЛЭГТ ХАМРУУЛАХ</div>
              </div>
              <div className="st-h3" style={{ marginBottom: 6 }}>4 сурагчид анхаарал хэрэгтэй</div>
              <div style={{ fontSize: 12, color: "var(--st-ink-2)", lineHeight: 1.5 }}>
                Ирц, загвар шалгалт, оролцооны нийт дохио буурсан. Дэмжлэг үзүүлэх үйл явц эхлүүлэх боломжтой.
              </div>
              <button className="st-btn st-btn-secondary st-btn-sm" style={{ marginTop: 10 }}>
                Жагсаалт харах <Icon name="arrow_r" size={12} color="#3A2818"/>
              </button>
            </div>
          </div>
        </div>

        {/* meander accent */}
        <Meander tone="brass" height={12}/>

        {/* second row — mock test trends */}
        <div className="st-card st-card-md">
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div className="st-eyebrow">ЗАГВАР ШАЛГАЛТЫН ЧИГ ХАНДЛАГА</div>
              <div className="st-h3" style={{ marginTop: 4 }}>11-А ангийн дундаж · сүүлийн 8 долоо хоног</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 6 }}>
              {["Физик", "Математик", "Хими"].map((s, i) => (
                <button key={s} className="st-tab" data-active={i === 0}>{s}</button>
              ))}
            </div>
          </div>

          {/* chart */}
          <div style={{ height: 180, position: "relative" }}>
            <svg viewBox="0 0 900 180" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#C2410C" stopOpacity="0.25"/>
                  <stop offset="1" stopColor="#C2410C" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* horiz gridlines */}
              {[40, 80, 120, 160].map((y, i) => (
                <line key={i} x1="40" x2="880" y1={y} y2={y} stroke="#E8D5AF" strokeWidth="1"/>
              ))}
              {/* y-axis labels */}
              {[
                [40, "700"],
                [80, "600"],
                [120, "500"],
                [160, "400"],
              ].map(([y, l]) => (
                <text key={l} x="10" y={y + 4} fontSize="10" fill="#836340" fontFamily="Bitter">{l}</text>
              ))}
              {/* national avg line */}
              <line x1="40" x2="880" y1="92" y2="92" stroke="#3E5F73" strokeWidth="1.4" strokeDasharray="6 4" opacity="0.7"/>
              <text x="820" y="86" fontSize="10" fill="#3E5F73" fontFamily="Bitter">Улсын дундаж</text>
              {/* area + line */}
              <path d="M40 140 L160 132 L280 120 L400 116 L520 102 L640 90 L760 78 L880 68 L880 180 L40 180 Z" fill="url(#trendg)"/>
              <path d="M40 140 L160 132 L280 120 L400 116 L520 102 L640 90 L760 78 L880 68" stroke="#C2410C" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
              {[
                [40, 140], [160, 132], [280, 120], [400, 116], [520, 102], [640, 90], [760, 78], [880, 68],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3.4" fill="#C2410C" stroke="#FBF3E2" strokeWidth="1.4"/>
              ))}
              {/* x labels */}
              {["W1","W2","W3","W4","W5","W6","W7","W8"].map((l, i) => (
                <text key={l} x={40 + i * 120} y="175" fontSize="10" fill="#836340" fontFamily="Bitter" textAnchor="middle">{l}</text>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Metric = ({ eyebrow, big, sub, tint = "brass", trend, warn }) => {
  const tints = {
    brass: { bg: "var(--st-paper)", num: "var(--st-ink)", accent: "var(--st-brass-dark)" },
    ember: { bg: "linear-gradient(180deg, #FBF3E2 0%, rgba(194,65,12,0.10) 100%)", num: "var(--st-cinnabar)", accent: "var(--st-cinnabar)" },
    moss:  { bg: "linear-gradient(180deg, #FBF3E2 0%, rgba(92,107,59,0.10) 100%)", num: "var(--st-moss)", accent: "var(--st-moss)" },
  }[tint];
  return (
    <div className="st-card" style={{ padding: 14, background: tints.bg }}>
      <div className="st-eyebrow" style={{ color: tints.accent }}>{eyebrow}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 6 }}>
        <span className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 30, color: tints.num, lineHeight: 1 }}>{big}</span>
        {trend === "up" && <Icon name="arrow_r" size={14} color="#5C6B3B" style={{ transform: "rotate(-45deg)", marginBottom: 6 }}/>}
        {warn && <span className="st-dot" style={{ background: "#C2410C", marginBottom: 8 }}/>}
      </div>
      <div style={{ fontSize: 11, color: "var(--st-ink-3)", marginTop: 4 }}>{sub}</div>
    </div>
  );
};

const MatrixCell = ({ level }) => {
  const colors = { m: "#5C6B3B", p: "#7E8E4C", d: "#C28A1A", i: "#C2410C", "-": "#E8D5AF" };
  const labels = { m: "Б", p: "Т", d: "Х", i: "Т", "-": "—" };
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 5,
      background: colors[level],
      color: level === "-" ? "#836340" : "#FBF3E2",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700, fontFamily: "var(--st-display)",
    }}>{labels[level]}</div>
  );
};

const LegendDot = ({ color, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    <i style={{ display: "inline-block", width: 10, height: 10, background: color, borderRadius: 3 }}/>
    {label}
  </span>
);

Object.assign(window, { TeacherSidebar, TeacherDashboard, Metric, MatrixCell, LegendDot });
