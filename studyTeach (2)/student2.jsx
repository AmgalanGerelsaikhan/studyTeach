/* ─────────────────────────────────────────────────────────────
   EGSh Mock Test + Score-Band Predictor (desktop)
   Digital Ticket (mobile, offline-ready)
   ───────────────────────────────────────────────────────────── */

// ===== EGSh Mock Test ====================================================

const EGShMock = () =>
<div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", flexDirection: "column" }}>
    <StudentTopBar active="egsh" />

    {/* Test header bar — soot, urgent */}
    <div style={{
    background: "linear-gradient(180deg, #2A1810 0%, #1A0F08 100%)",
    color: "#F4E8D1",
    padding: "12px 26px",
    display: "flex", alignItems: "center", gap: 20,
    borderBottom: "1px solid #8C5F22"
  }}>
      <div>
        <div className="st-eyebrow" style={{ color: "#D4A24C" }}>ЗАГВАР ШАЛГАЛТ · ПРОКТОР ХЭЛБЭР</div>
        <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 17, marginTop: 2 }}>
          ЭЕШ Физик · Бүрэн загвар №3 · 2026
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ textAlign: "center" }}>
        <div className="st-eyebrow" style={{ color: "#B98438" }}>ҮЛДСЭН ХУГАЦАА</div>
        <div className="st-num" style={{ fontFamily: "var(--st-display)", fontSize: 26, fontWeight: 700, color: "#FBF3E2" }}>
          01:23:47
        </div>
      </div>
      <div style={{ width: 1, height: 38, background: "#5C4530", margin: "0 4px" }} />
      <div style={{ textAlign: "center", minWidth: 80 }}>
        <div className="st-eyebrow" style={{ color: "#B98438" }}>АСУУЛТ</div>
        <div className="st-num" style={{ fontFamily: "var(--st-display)", fontSize: 22, fontWeight: 700, color: "#FBF3E2" }}>
          14 <span style={{ color: "#8C5F22", fontSize: 14 }}>/ 50</span>
        </div>
      </div>
      <div style={{ width: 1, height: 38, background: "#5C4530", margin: "0 4px" }} />
      <button className="st-btn st-btn-sm" style={{ background: "rgba(255,255,255,0.06)", color: "#D8BC85", border: "1px solid #8C5F22" }}>
        <Icon name="eye" size={13} color="#D4A24C" /> Камер идэвхтэй
      </button>
      <button className="st-btn st-btn-sm" style={{ background: "var(--st-ember)", color: "#FBF3E2", border: "1px solid #7E1D0A" }}>
        <Icon name="lock" size={12} color="#FBF3E2" /> Таб түгжээтэй
      </button>
    </div>

    {/* progress bar */}
    <div style={{ height: 4, background: "#1A0F08" }}>
      <div style={{ height: "100%", width: "28%", background: "linear-gradient(90deg, var(--st-brass) 0%, var(--st-ember) 100%)" }} />
    </div>

    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", minHeight: 0 }}>
      {/* CENTER — current question */}
      <div className="st-scroll" style={{ padding: "28px 36px", overflowY: "auto" }}>
        {/* Question card */}
        <div className="st-card" style={{ padding: 28, position: "relative" }}>
          <CornerBracket corner="tl" />
          <CornerBracket corner="tr" />

          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
            <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: "linear-gradient(135deg, #C2410C, #7E1D0A)",
            color: "#FBF3E2",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 18
          }}>14</div>
            <div>
              <div className="st-eyebrow">МЕХАНИК · ХАТУУ БИЕИЙН ДИНАМИК</div>
              <div style={{ fontSize: 12, color: "var(--st-ink-3)", marginTop: 2 }}>3 оноо · Олон сонголт</div>
            </div>
            <div style={{ flex: 1 }} />
            <button className="st-btn st-btn-sm st-btn-ghost"><Icon name="flag" size={13} color="#836340" /> Тэмдэглэх</button>
          </div>

          <div style={{ fontFamily: "var(--st-display)", fontSize: 19, color: "var(--st-soot)", lineHeight: 1.4, marginBottom: 18 }}>
            Эргэх төвөөсөө <b>r = 0.8 м</b> зайтай цэг дээр <b>F = 60 Н</b> хүчийг 30°-ийн өнцгөөр түрхэв. Хатуу биед үүсэх момент юутай тэнцүү вэ?
          </div>

          {/* diagram */}
          <div style={{
          background: "var(--st-paper-2)",
          border: "1px solid rgba(185,132,56,0.4)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          display: "flex", justifyContent: "center"
        }}>
            <svg viewBox="0 0 380 140" style={{ width: 380, height: 140 }}>
              <rect x="40" y="98" width="280" height="8" fill="#8C5F22" rx="2" />
              <circle cx="60" cy="102" r="7" fill="#2A1810" />
              <line x1="60" y1="102" x2="280" y2="102" stroke="#3E5F73" strokeWidth="1.2" strokeDasharray="3 2" />
              <text x="170" y="120" fontSize="12" fill="#3E5F73" fontFamily="Bitter" textAnchor="middle">r = 0.8 м</text>
              <line x1="280" y1="102" x2="340" y2="40" stroke="#C2410C" strokeWidth="2.4" markerEnd="url(#ah2)" />
              <defs>
                <marker id="ah2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0 0 L8 4 L0 8 Z" fill="#C2410C" />
                </marker>
              </defs>
              <text x="345" y="42" fontSize="14" fill="#C2410C" fontFamily="Bitter" fontWeight="700">F = 60 Н</text>
              <path d="M280 102 A 22 22 0 0 0 296 84" fill="none" stroke="#5C4530" strokeWidth="1" />
              <text x="304" y="98" fontSize="11" fill="#5C4530" fontFamily="Bitter">30°</text>
              <text x="55" y="124" fontSize="10" fill="#5C4530" fontFamily="Bitter" textAnchor="middle">O</text>
            </svg>
          </div>

          {/* answer choices */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
          { k: "А", v: "M = 24 Н·м", sel: false },
          { k: "Б", v: "M = 48 Н·м", sel: false },
          { k: "В", v: "M = 41.6 Н·м", sel: true },
          { k: "Г", v: "M = 96 Н·м", sel: false }].
          map((c, i) =>
          <label key={i} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 16px",
            background: c.sel ? "rgba(194,65,12,0.08)" : "var(--st-paper)",
            border: c.sel ? "1.5px solid var(--st-ember)" : "1px solid rgba(185,132,56,0.3)",
            borderRadius: 10,
            cursor: "pointer"
          }}>
                <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: c.sel ? "var(--st-ember)" : "var(--st-felt)",
              color: c.sel ? "#FBF3E2" : "var(--st-ink)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 13,
              border: c.sel ? "1px solid #7E1D0A" : "1px solid rgba(185,132,56,0.4)",
              flexShrink: 0
            }}>{c.k}</div>
                <div style={{ fontFamily: "var(--st-display)", fontSize: 15, color: "var(--st-ink)" }}>{c.v}</div>
              </label>
          )}
          </div>
        </div>

        {/* nav buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
          <button className="st-btn st-btn-secondary"><Icon name="arrow_l" size={14} color="#3A2818" /> Өмнөх</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="st-btn st-btn-ghost">Алгасах</button>
            <button className="st-btn st-btn-primary">Хадгалах ба үргэлжлүүлэх <Icon name="arrow_r" size={14} color="#FBF3E2" /></button>
          </div>
        </div>
      </div>

      {/* RIGHT — question grid + predictor */}
      <div style={{
      background: "var(--st-paper-2)",
      borderLeft: "1px solid rgba(185,132,56,0.4)",
      padding: 18,
      display: "flex", flexDirection: "column", gap: 18, minHeight: 0
    }}>
        {/* Question map */}
        <div className="st-card st-card-tight" style={{ padding: 14 }}>
          <div className="st-eyebrow">АСУУЛТЫН ЗУРАГ</div>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
            {Array.from({ length: 50 }, (_, i) => {
            const n = i + 1;
            let s = "todo";
            if (n < 14) s = "done";
            if (n === 14) s = "current";
            if ([6, 9, 11].includes(n)) s = "flagged";
            const bg = s === "done" ? "var(--st-moss)" : s === "current" ? "var(--st-ember)" : s === "flagged" ? "var(--st-brass)" : "var(--st-felt)";
            const fg = s === "todo" ? "var(--st-ink-2)" : "#FBF3E2";
            return (
              <div key={i} style={{
                width: "100%", aspectRatio: "1",
                background: bg, color: fg,
                borderRadius: 4, fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--st-display)",
                border: s === "current" ? "2px solid #7E1D0A" : "none"
              }}>{n}</div>);

          })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", fontSize: 10, color: "var(--st-ink-3)" }}>
            <span><i style={{ display: "inline-block", width: 8, height: 8, background: "var(--st-moss)", borderRadius: 2, marginRight: 4 }} />Бөглөсөн</span>
            <span><i style={{ display: "inline-block", width: 8, height: 8, background: "var(--st-ember)", borderRadius: 2, marginRight: 4 }} />Одоо</span>
            <span><i style={{ display: "inline-block", width: 8, height: 8, background: "var(--st-brass)", borderRadius: 2, marginRight: 4 }} />Тэмдэглэсэн</span>
          </div>
        </div>

        {/* Live predictor */}
        <div className="st-card-soot" style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div className="st-eyebrow" style={{ color: "#D4A24C" }}>МЭДЭГДЭЛ · ОНОО ТААВАР</div>
          <div className="st-h3" style={{ color: "#FBF3E2", marginTop: 6, marginBottom: 12 }}>Шууд бус таамаг</div>

          {/* big band */}
          <div style={{ position: "relative", padding: "8px 0 24px" }}>
            <svg viewBox="0 0 260 80" style={{ width: "100%" }}>
              {/* score scale */}
              <rect x="0" y="40" width="260" height="8" rx="4" fill="#3a2818" />
              <defs>
                <linearGradient id="bandg2" x1="0" x2="1">
                  <stop offset="0" stopColor="#C28A1A" stopOpacity="0.5" />
                  <stop offset="0.5" stopColor="#C2410C" stopOpacity="0.95" />
                  <stop offset="1" stopColor="#C28A1A" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              {/* band */}
              <rect x="120" y="35" width="100" height="18" rx="9" fill="url(#bandg2)" />
              <text x="170" y="48" fill="#FBF3E2" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="Bitter">640 – 720</text>
              {/* mean tick */}
              <line x1="172" y1="22" x2="172" y2="35" stroke="#F4C99A" strokeWidth="1.6" />
              <text x="172" y="18" fill="#FBF3E2" fontSize="14" fontWeight="700" textAnchor="middle" fontFamily="Bitter">680</text>
              {[400, 500, 600, 700, 800].map((v, i) =>
            <g key={i}>
                  <line x1={i * 65} x2={i * 65} y1="48" y2="56" stroke="#8C5F22" strokeWidth="1" />
                  <text x={i * 65} y="68" fontSize="9" fill="#B98438" textAnchor="middle">{v}</text>
                </g>
            )}
            </svg>
          </div>

          <div style={{ fontSize: 11.5, color: "#D8BC85", lineHeight: 1.5 }}>
            Одоогийн ахицаар бол ЭЕШ Физикийн оноо <b style={{ color: "#FBF3E2" }}>640–720</b> хооронд унах магадлал <b style={{ color: "#F4C99A" }}>76%</b>.
          </div>

          {/* breakdown */}
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#D8BC85" }}>
              <span>Механик</span>
              <span style={{ color: "#7E8E4C", fontWeight: 600 }}>Хүчтэй · 85%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#D8BC85" }}>
              <span>Цахилгаан соронзон</span>
              <span style={{ color: "#C28A1A", fontWeight: 600 }}>Дунд · 58%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#D8BC85" }}>
              <span>Дулаан, термодинамик</span>
              <span style={{ color: "#E2570D", fontWeight: 600 }}>Сул · 34%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#D8BC85" }}>
              <span>Атом, цөмийн физик</span>
              <span style={{ color: "#7E8E4C", fontWeight: 600 }}>Хүчтэй · 78%</span>
            </div>
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10, color: "#8C5F22", lineHeight: 1.4, marginTop: 12, paddingTop: 10, borderTop: "1px solid #3a2818" }}>
            Дотоодын 11-р ангийн 2,847 сурагчтай харьцуулсан перцентил: <b style={{ color: "#D4A24C" }}>74-р хувь</b>
          </div>
        </div>
      </div>
    </div>
  </div>;


// ===== Digital Ticket (mobile, offline) ==================================

const DigitalTicket = () =>
<div style={{ width: 390, height: 844 }}>
    <div className="st-phone-bezel">
      <div className="st-phone-screen st-root">
        {/* status bar */}
        <div style={{
        height: 44, padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--st-soot)", color: "#F4E8D1",
        fontSize: 13, fontWeight: 600
      }}>
          <span>9:41</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="wifi_off" size={12} color="#C28A1A" />
            <span style={{ fontSize: 10, color: "#C28A1A", marginRight: 2 }}>Офлайн</span>
            <span style={{ fontSize: 11 }}>87%</span>
          </div>
        </div>

        {/* nav header */}
        <div style={{
        padding: "14px 18px 12px",
        background: "var(--st-soot)",
        color: "#F4E8D1",
        display: "flex", alignItems: "center", gap: 12
      }}>
          <Icon name="chevron_r" size={20} color="#D4A24C" style={{ transform: "rotate(180deg)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 15 }}>Тасалбарын сан</div>
            <div style={{ fontSize: 11, color: "#B98438" }}>2 идэвхтэй · 4 архивлагдсан</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#C28A1A", background: "rgba(194,65,12,0.18)", padding: "3px 7px", borderRadius: 999, border: "1px solid #8C5F22" }}>
            <span className="st-dot" style={{ width: 5, height: 5, background: "#C28A1A" }} />
            Офлайн бэлэн
          </div>
        </div>

        {/* meander */}
        <Meander tone="soot" height={10} />

        {/* ticket */}
        <div className="st-felt-bg" style={{ padding: "20px 16px", flex: 1, overflowY: "auto" }}>
          <div style={{
          background: "var(--st-paper)",
          borderRadius: 18,
          border: "1px solid rgba(185,132,56,0.5)",
          boxShadow: "var(--st-shadow-lg)",
          overflow: "hidden",
          position: "relative"
        }}>
            {/* top — venue strip */}
            <div style={{
            background: "linear-gradient(180deg, #C2410C 0%, #7E1D0A 100%)",
            color: "#FBF3E2",
            padding: "16px 18px",
            position: "relative"
          }}>
              <CornerBracket corner="tl" color="#F4C99A" />
              <CornerBracket corner="tr" color="#F4C99A" />
              <div className="st-eyebrow" style={{ color: "#F4C99A" }}>УЛСЫН ОЛИМПИАД · МАТЕМАТИК</div>
              <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 19, marginTop: 6, lineHeight: 1.2 }}>
                XLI Улсын Математикийн Олимпиад
              </div>
              <div style={{ fontSize: 11.5, color: "#F4E8D1", marginTop: 4, opacity: 0.9 }}>
                АИАА · Боловсролын Яам зохион байгуулна
              </div>
            </div>

            {/* perforation */}
            <div style={{ position: "relative", height: 18, background: "var(--st-paper)" }}>
              <div style={{
              position: "absolute", top: "50%", left: 0, right: 0,
              borderTop: "1.5px dashed rgba(185,132,56,0.6)",
              transform: "translateY(-50%)"
            }} />
              <div style={{
              position: "absolute", top: "50%", left: -10,
              width: 20, height: 20,
              background: "var(--st-cream)",
              borderRadius: "50%",
              transform: "translateY(-50%)",
              boxShadow: "inset -2px 0 4px rgba(42,24,16,0.15)"
            }} />
              <div style={{
              position: "absolute", top: "50%", right: -10,
              width: 20, height: 20,
              background: "var(--st-cream)",
              borderRadius: "50%",
              transform: "translateY(-50%)",
              boxShadow: "inset 2px 0 4px rgba(42,24,16,0.15)"
            }} />
            </div>

            {/* body */}
            <div style={{ padding: "0 20px 18px" }}>
              {/* student name */}
              <div className="st-eyebrow">БҮРТГЭГДСЭН СУРАГЧ</div>
              <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 18, color: "var(--st-soot)", marginTop: 4 }}>Амгалан

            </div>
              <div style={{ fontSize: 12, color: "var(--st-ink-3)", marginTop: 2 }}>
                11-р анги · 23-р сургууль · Улаанбаатар
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                <TicketRow eyebrow="ОГНОО" value="2026.06.12" sub="БЯМБА · 09:00" />
                <TicketRow eyebrow="БҮРТГЭЛ" value="#MA-2026-0142" sub="Хэшлэгдсэн" />
                <TicketRow eyebrow="ТАНХИМ" value="МУИС · 213" sub="2 давхар, А корпус" />
                <TicketRow eyebrow="СУУДАЛ" value="14-Б" sub="3-р эгнээ" />
              </div>

              {/* QR */}
              <div style={{
              marginTop: 18,
              background: "linear-gradient(180deg, #FBF3E2 0%, #EFE0BF 100%)",
              border: "1.5px solid var(--st-brass)",
              borderRadius: 14,
              padding: 16,
              display: "flex", alignItems: "center", gap: 14,
              position: "relative"
            }}>
                <div style={{
                width: 90, height: 90,
                background: "var(--st-soot)",
                borderRadius: 8,
                padding: 6,
                display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 1
              }}>
                  {Array.from({ length: 121 }, (_, i) => {
                  const seed = (i * 13 + 7) % 100;
                  const on = seed < 52 || i < 3 || i > 117 || i % 11 === 0 || i % 11 === 10;
                  const corner = i < 33 && i % 11 < 3 || i < 33 && i % 11 > 7 || i > 87 && i % 11 < 3;
                  return (
                    <div key={i} style={{
                      background: corner ? "#FBF3E2" : on ? "#FBF3E2" : "transparent",
                      aspectRatio: "1"
                    }} />);

                })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--st-display)", fontSize: 12, fontWeight: 700, color: "var(--st-soot)" }}>
                    Танхимд харуулна уу
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--st-ink-3)", marginTop: 4, lineHeight: 1.4 }}>
                    Гарын үсэгтэй QR · 256-бит
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 10.5, color: "var(--st-moss)" }}>
                    <Icon name="check" size={11} color="#5C6B3B" /> Офлайн ажиллана
                  </div>
                </div>
              </div>

              {/* receipt strip */}
              <div style={{
              marginTop: 14,
              background: "var(--st-paper-2)",
              border: "1px solid rgba(185,132,56,0.3)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 11,
              color: "var(--st-ink-2)",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
                <div>
                  <div style={{ color: "var(--st-ink-3)", fontSize: 10 }}>И-Баримт</div>
                  <div style={{ fontFamily: "var(--st-display)", fontWeight: 600 }}>EB-3382-1109-7724</div>
                </div>
                <div>
                  <div style={{ color: "var(--st-ink-3)", fontSize: 10, textAlign: "right" }}>Төлбөр</div>
                  <div className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, color: "var(--st-soot)" }}>15,000 ₮</div>
                </div>
              </div>
            </div>
          </div>

          {/* save / share */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="st-btn st-btn-secondary" style={{ flex: 1 }}>
              <Icon name="download" size={14} color="#3A2818" /> PNG татах
            </button>
            <button className="st-btn st-btn-secondary" style={{ flex: 1 }}>
              <Icon name="map" size={14} color="#3A2818" /> Газрын зураг
            </button>
          </div>

          {/* offline notice */}
          <div style={{
          marginTop: 14,
          background: "rgba(194,138,26,0.15)",
          border: "1px solid rgba(194,138,26,0.4)",
          borderRadius: 10,
          padding: 12,
          display: "flex", gap: 10, alignItems: "flex-start"
        }}>
            <Icon name="wifi_off" size={16} color="#8C5F22" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--st-soot)" }}>Офлайн горим идэвхтэй</div>
              <div style={{ fontSize: 11, color: "var(--st-ink-2)", marginTop: 2, lineHeight: 1.4 }}>
                Энэ тасалбар интернетгүй ч танхимд харагдана. Сүүлд шинэчилсэн: <b>5 САР 19 · 18:42</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;


const TicketRow = ({ eyebrow, value, sub }) =>
<div>
    <div className="st-eyebrow" style={{ fontSize: 9.5, color: "var(--st-brass-dark)" }}>{eyebrow}</div>
    <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 14, color: "var(--st-soot)", marginTop: 2 }}>{value}</div>
    <div style={{ fontSize: 10.5, color: "var(--st-ink-3)", marginTop: 1 }}>{sub}</div>
  </div>;


Object.assign(window, { EGShMock, DigitalTicket, TicketRow });