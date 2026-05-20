/* ─────────────────────────────────────────────────────────────
   Parent Portal (mobile + SMS), Wellbeing Pulse, School Admin
   ───────────────────────────────────────────────────────────── */

// ===== Parent Portal — Mobile with SMS preview ==========================

const ParentPortal = () =>
<div style={{ width: 390, height: 844 }}>
    <div className="st-phone-bezel">
      <div className="st-phone-screen st-root st-felt-bg">
        <div style={{ height: 44, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--st-soot)", color: "#F4E8D1", fontSize: 13, fontWeight: 600 }}>
          <span>14:22</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <span>2G</span>
            <span>67%</span>
          </div>
        </div>

        <div style={{ padding: "16px 18px 14px", background: "var(--st-soot)", color: "#F4E8D1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SoyomboFlame size={20} color="#D4A24C" />
            <div>
              <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 15 }}>studyTeach</div>
              <div style={{ fontSize: 9.5, color: "#B98438", letterSpacing: "0.15em" }}>ЭЦЭГ ЭХИЙН ХЭСЭГ</div>
            </div>
            <div style={{ flex: 1 }} />
            <Icon name="bell" size={18} color="#D4A24C" />
          </div>
        </div>

        <Meander tone="soot" height={10} />

        <div className="st-scroll" style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "16px 18px 8px" }}>
            <div className="st-eyebrow">МИНИЙ ХҮҮХДҮҮД</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {[
            { n: "Болор-Эрдэнэ", c: "11-Б", active: true, bg: "var(--st-ember)" },
            { n: "Дөлгөөн", c: "7-А", bg: "var(--st-sky)" }].
            map((c, i) =>
            <div key={i} style={{
              flex: 1, padding: 12,
              background: c.active ? "var(--st-paper)" : "var(--st-paper-2)",
              border: c.active ? "1.5px solid var(--st-ember)" : "1px solid rgba(185,132,56,0.3)",
              borderRadius: 10,
              display: "flex", alignItems: "center", gap: 8
            }}>
                  <div className="st-avatar" style={{ width: 30, height: 30, fontSize: 12, background: c.bg }}>{c.n[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--st-soot)" }}>{c.n}</div>
                    <div style={{ fontSize: 10, color: "var(--st-ink-3)" }}>{c.c}</div>
                  </div>
                </div>
            )}
            </div>
          </div>

          {/* upcoming olympiad */}
          <div style={{ padding: "8px 18px" }}>
            <div className="st-card-ember" style={{ padding: 16, position: "relative" }}>
              <CornerBracket corner="tl" color="#F4C99A" />
              <CornerBracket corner="tr" color="#F4C99A" />
              <div className="st-eyebrow" style={{ color: "#F4C99A" }}>УДАХГҮЙ · 23 ХОНОГ</div>
              <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 15, color: "#FBF3E2", marginTop: 4, lineHeight: 1.25 }}>
                XLI Улсын Математикийн Олимпиад
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 12, fontSize: 11, color: "#F4E8D1" }}>
                <div>
                  <div style={{ color: "#F4C99A", fontSize: 9.5, letterSpacing: "0.1em" }}>ОГНОО</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>6.12 · 09:00</div>
                </div>
                <div>
                  <div style={{ color: "#F4C99A", fontSize: 9.5, letterSpacing: "0.1em" }}>ТӨЛБӨР</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>15,000 ₮ · Төлсөн</div>
                </div>
                <div>
                  <div style={{ color: "#F4C99A", fontSize: 9.5, letterSpacing: "0.1em" }}>ТАНХИМ</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>МУИС · 213</div>
                </div>
              </div>
            </div>
          </div>

          {/* mock trajectory */}
          <div style={{ padding: "8px 18px" }}>
            <div className="st-card st-card-tight" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div className="st-eyebrow">ЭЕШ ЗАГВАРЫН АХИЦ</div>
                  <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 13, color: "var(--st-soot)", marginTop: 2 }}>Сүүлийн 6 долоо хоног</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 20, color: "var(--st-moss)" }}>680</div>
                  <div style={{ fontSize: 9.5, color: "var(--st-ink-3)" }}>+22 САР</div>
                </div>
              </div>
              <svg viewBox="0 0 320 60" style={{ width: "100%", height: 60 }}>
                <path d="M0 50 L60 46 L120 40 L180 34 L240 22 L300 14" stroke="#C2410C" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <line x1="0" x2="320" y1="32" y2="32" stroke="#3E5F73" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                {[[0, 50], [60, 46], [120, 40], [180, 34], [240, 22], [300, 14]].map(([x, y], i) =>
              <circle key={i} cx={x} cy={y} r="3" fill="#C2410C" stroke="#FBF3E2" strokeWidth="1.2" />
              )}
              </svg>
            </div>
          </div>

          {/* SMS callout */}
          <div style={{ padding: "8px 18px" }}>
            <div className="st-card st-card-tight" style={{
            padding: 14,
            background: "linear-gradient(180deg, #FBF3E2 0%, rgba(62,95,115,0.10) 100%)",
            borderColor: "var(--st-sky)"
          }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon name="sms" size={15} color="#3E5F73" />
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", color: "var(--st-sky)" }}>СМС МЭДЭГДЭЛ</div>
                <span className="st-chip st-chip-sky" style={{ marginLeft: "auto", fontSize: 9 }}>Идэвхтэй</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--st-ink)", lineHeight: 1.4 }}>
                Интернетгүй үед чухал зүйлийг СМС-ээр илгээнэ.
              </div>

              <div style={{ marginTop: 12, background: "var(--st-paper)", border: "1px solid rgba(62,95,115,0.3)", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, color: "var(--st-ink-3)", marginBottom: 6 }}>studyTeach SMS · +976 7771 8800</div>
                {[
              { dir: "in", t: "Болор-Эрдэнэ загвар шалгалт өгсөн: 680/800. Сэдэв: Физик. Дэлгэрэнгүй: STATUS илгээнэ үү." },
              { dir: "out", t: "STATUS" },
              { dir: "in", t: "Болор-Эрдэнэ: 11-Б · 23 хоног дотор Математикийн олимпиад. Төлсөн. И-Баримт: EB-3382-1109-7724." }].
              map((m, i) =>
              <div key={i} style={{ display: "flex", justifyContent: m.dir === "out" ? "flex-end" : "flex-start", margin: "5px 0" }}>
                    <div style={{
                  maxWidth: "82%", padding: "7px 10px", borderRadius: 10, fontSize: 11.5,
                  background: m.dir === "out" ? "var(--st-sky)" : "var(--st-felt)",
                  color: m.dir === "out" ? "#FBF3E2" : "var(--st-ink)", lineHeight: 1.4
                }}>{m.t}</div>
                  </div>
              )}
              </div>
              <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--st-ink-3)" }}>
                Богино код: <b style={{ color: "var(--st-ink)" }}>STATUS</b>, <b style={{ color: "var(--st-ink)" }}>СОНГОН</b> · USSD: <b style={{ color: "var(--st-ink)" }}>*1234#</b>
              </div>
            </div>
          </div>

          {/* activity feed */}
          <div style={{ padding: "8px 18px 22px" }}>
            <div className="st-eyebrow" style={{ marginBottom: 8 }}>СҮҮЛИЙН ҮЙЛ ЯВДАЛ</div>
            <div className="st-card st-card-tight" style={{ padding: 0 }}>
              {[
            { ic: "check", color: "#5C6B3B", t: "Загвар шалгалт дууссан", sub: "Физик · оноо 680/800", time: "13:42" },
            { ic: "cash", color: "#B98438", t: "QPay төлбөр амжилттай", sub: "15,000 ₮ · Математикийн Олимпиад", time: "Өчигдөр" },
            { ic: "school", color: "#3E5F73", t: "Шинэ хичээл эхэлсэн", sub: "AI Багш · Хүчний момент", time: "Өчигдөр" },
            { ic: "bell", color: "#C2410C", t: "Эссэ илгээх эцсийн өдөр ойртож байна", sub: "Гадаад сургууль · 12 хоног", time: "5.18" }].
            map((e, i, a) =>
            <div key={i} style={{ display: "flex", gap: 10, padding: "12px 14px", borderBottom: i < a.length - 1 ? "1px solid rgba(185,132,56,0.18)" : "none" }}>
                  <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: e.color + "22",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                    <Icon name={e.ic} size={14} color={e.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--st-soot)" }}>{e.t}</div>
                    <div style={{ fontSize: 11, color: "var(--st-ink-3)", marginTop: 1 }}>{e.sub}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--st-ink-3)", whiteSpace: "nowrap", marginTop: 2 }}>{e.time}</div>
                </div>
            )}
            </div>
          </div>
        </div>

        {/* bottom nav */}
        <div style={{
        display: "flex", justifyContent: "space-around", padding: "10px 0 14px",
        background: "var(--st-paper)", borderTop: "1px solid rgba(185,132,56,0.3)"
      }}>
          {[
        { ic: "home", l: "Нүүр", active: true },
        { ic: "chart", l: "Ахиц" },
        { ic: "cash", l: "Төлбөр" },
        { ic: "settings", l: "Тохиргоо" }].
        map((n, i) =>
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <Icon name={n.ic} size={20} color={n.active ? "#C2410C" : "#836340"} />
              <span style={{ fontSize: 10, color: n.active ? "var(--st-ember)" : "var(--st-ink-3)", fontWeight: n.active ? 700 : 500 }}>{n.l}</span>
            </div>
        )}
        </div>
      </div>
    </div>
  </div>;


// ===== Wellbeing Pulse (mobile) =========================================

const WellbeingPulse = () =>
<div style={{ width: 390, height: 844 }}>
    <div className="st-phone-bezel">
      <div className="st-phone-screen st-root st-felt-bg">
        <div style={{ height: 44, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--st-soot)", color: "#F4E8D1", fontSize: 13, fontWeight: 600 }}>
          <span>20:11</span>
          <span style={{ fontSize: 11 }}>83%</span>
        </div>

        <div style={{ padding: "20px 22px 18px", background: "linear-gradient(180deg, #3E5F73 0%, #2A1810 100%)", color: "#F4E8D1", position: "relative" }}>
          <CornerBracket corner="tl" color="#D4A24C" />
          <CornerBracket corner="tr" color="#D4A24C" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Icon name="heart" size={20} color="#F4C99A" />
            <div className="st-eyebrow" style={{ color: "#F4C99A" }}>ДОЛОО ХОНОГИЙН ПУЛЬС · 3 / 5</div>
          </div>
          <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>
            Энэ долоо хоног та хэр сайн унтсан бэ?
          </div>
          <div style={{ fontSize: 12.5, color: "#D8BC85", marginTop: 8, lineHeight: 1.5 }}>
            Хариулт <b style={{ color: "#F4C99A" }}>нэрээ нууцлагдсан</b>. Багш, эцэг эхэд тус тусад нь харагдахгүй.
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 4 }}>
            {[0, 1, 2, 3, 4].map((i) =>
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 999, background: i < 3 ? "#D4A24C" : "rgba(244,201,154,0.18)" }} />
          )}
          </div>
        </div>

        <Meander tone="ember" height={10} />

        <div style={{ padding: 22, flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="st-eyebrow">1 (МУУ) — 5 (МАШ САЙН)</div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            {[
          { v: 1, l: "Маш муу" },
          { v: 2, l: "Муу" },
          { v: 3, l: "Дунд" },
          { v: 4, l: "Сайн", sel: true },
          { v: 5, l: "Маш сайн" }].
          map((o) =>
          <div key={o.v} style={{ textAlign: "center", flex: 1, cursor: "pointer" }}>
                <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: o.sel ? "linear-gradient(135deg, #C2410C 0%, #7E1D0A 100%)" : "var(--st-felt)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: o.sel ? "2px solid #F4C99A" : "1px solid rgba(185,132,56,0.4)",
              margin: "0 auto",
              boxShadow: o.sel ? "0 6px 18px rgba(194,65,12,0.3)" : "none"
            }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={o.sel ? "#FBF3E2" : "#836340"} strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="9" cy="10" r="0.5" fill={o.sel ? "#FBF3E2" : "#836340"} />
                    <circle cx="15" cy="10" r="0.5" fill={o.sel ? "#FBF3E2" : "#836340"} />
                    {o.v === 1 && <path d="M9 17 C 10 15, 14 15, 15 17" />}
                    {o.v === 2 && <path d="M9 16 C 10 15, 14 15, 15 16" />}
                    {o.v === 3 && <line x1="9" y1="15" x2="15" y2="15" />}
                    {o.v === 4 && <path d="M9 14 C 10 16, 14 16, 15 14" />}
                    {o.v === 5 && <path d="M8 13 C 10 17, 14 17, 16 13" />}
                  </svg>
                </div>
                <div style={{ fontSize: 10, color: o.sel ? "var(--st-soot)" : "var(--st-ink-3)", marginTop: 6, fontWeight: o.sel ? 700 : 500 }}>{o.l}</div>
                <div className="st-num" style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 14, color: o.sel ? "var(--st-ember)" : "var(--st-ink-3)" }}>{o.v}</div>
              </div>
          )}
          </div>

          <div className="st-divider" style={{ margin: "22px 0 16px" }} />

          <div className="st-eyebrow">НЭМЭЛТ · САЙН ДУРААР</div>
          <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 13, color: "var(--st-soot)", marginTop: 6, marginBottom: 10 }}>
            Юу таны нойронд саад болсон бэ?
          </div>
          <textarea className="st-input" placeholder="Хүсвэл бичээрэй..." style={{ minHeight: 80, resize: "none", fontSize: 13 }} />

          <div style={{ marginTop: 12, background: "rgba(194,138,26,0.10)", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 10, fontSize: 11, color: "var(--st-ink-2)", lineHeight: 1.45, border: "1px solid rgba(194,138,26,0.3)" }}>
            <Icon name="shield" size={14} color="#8C5F22" />
            <div>
              Хэрэв та <b>амиа золиослох, өөртөө хор хүргэх</b> зэрэг хэллэг бичвэл сургуулийн зөвлөгчид шууд илгээгдэнэ. Бусад тохиолдолд нэр нууц.
            </div>
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button className="st-btn st-btn-secondary" style={{ flex: 1 }}>Буцах</button>
            <button className="st-btn st-btn-primary" style={{ flex: 2 }}>
              Үргэлжлүүлэх (3 / 5) <Icon name="arrow_r" size={13} color="#FBF3E2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>;


// ===== School Admin — Boys-at-Risk =====================================

const SigChip = ({ kind }) => {
  const data = {
    attn: { l: "Ирц", c: "#C2410C" },
    score: { l: "Оноо", c: "#C28A1A" },
    engage: { l: "Оролцоо", c: "#9A2F08" },
    parent: { l: "Эцэг эх", c: "#3E5F73" }
  }[kind];
  return (
    <span style={{
      fontSize: 9.5, padding: "2px 6px", borderRadius: 4,
      background: data.c + "22", color: data.c, fontWeight: 700,
      border: "1px solid " + data.c + "55"
    }}>{data.l}</span>);

};

const AdminSidebar = ({ active = "risk" }) =>
<div style={{ width: 220, background: "var(--st-soot)", color: "#F4E8D1", display: "flex", flexDirection: "column", borderRight: "1px solid #8C5F22", flexShrink: 0 }}>
    <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #3a2818" }}>
      <SoyomboFlame size={22} color="#D4A24C" />
      <div>
        <div style={{ fontFamily: "var(--st-display)", fontWeight: 700, fontSize: 15 }}>studyTeach</div>
        <div style={{ fontSize: 9.5, color: "#B98438", letterSpacing: "0.14em" }}>23-Р СУРГУУЛЬ · ЗАХИРАЛ</div>
      </div>
    </div>
    <div style={{ padding: 10, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
      {[
    { k: "ana", ic: "chart", l: "Шинжилгээ" },
    { k: "stu", ic: "users", l: "Бүх сурагчид" },
    { k: "tea", ic: "school", l: "Багш нар" },
    { k: "risk", ic: "shield", l: "Дэмжлэгт хамруулах", chip: 9 },
    { k: "dorm", ic: "yurt", l: "Дотуур байр" },
    { k: "cpd", ic: "award", l: "БХБСХ кредит" },
    { k: "fin", ic: "cash", l: "Санхүү" }].
    map((it) =>
    <button key={it.k} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 12px",
      background: active === it.k ? "rgba(212,162,76,0.18)" : "transparent",
      border: active === it.k ? "1px solid #8C5F22" : "none",
      borderLeft: active === it.k ? "3px solid #D4A24C" : "3px solid transparent",
      borderRadius: 6,
      color: active === it.k ? "#FBF3E2" : "#D8BC85",
      fontSize: 12.5, fontWeight: active === it.k ? 600 : 500,
      textAlign: "left", cursor: "pointer"
    }}>
          <Icon name={it.ic} size={15} color={active === it.k ? "#D4A24C" : "#8C5F22"} />
          <span style={{ flex: 1 }}>{it.l}</span>
          {it.chip && <span style={{ fontSize: 9, padding: "1px 6px", background: "var(--st-ember)", color: "#FBF3E2", borderRadius: 999 }}>{it.chip}</span>}
        </button>
    )}
    </div>
    <div style={{ padding: "12px 14px", borderTop: "1px solid #3a2818", display: "flex", alignItems: "center", gap: 10 }}>
      <div className="st-avatar st-avatar-sky" style={{ width: 32, height: 32, fontSize: 12 }}>Б</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#FBF3E2" }}>Болдбаатар З.</div>
        <div style={{ fontSize: 10.5, color: "#B98438" }}>Захирал</div>
      </div>
    </div>
  </div>;


const SchoolAdminRisk = () =>
<div className="st-root st-felt-bg" style={{ width: 1280, height: 820, display: "flex", overflow: "hidden" }}>
    <AdminSidebar active="risk" />

    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(185,132,56,0.3)", background: "var(--st-paper)", display: "flex", alignItems: "flex-start" }}>
        <div>
          <div className="st-eyebrow">ДЭМЖЛЭГТ ХАМРУУЛАХ САМБАР</div>
          <div className="st-h2" style={{ fontSize: 19, marginTop: 2 }}>9 хүүхэд шалгуурт нийцлээ</div>
          <div style={{ fontSize: 12, color: "var(--st-ink-3)", marginTop: 4, maxWidth: 620, lineHeight: 1.45 }}>
            Эдгээр сурагчид <b>сурах боломжоо алдаж болзошгүй</b> сигналуудтай. Зөвхөн та болон томилогдсон багш нар харна — сурагчид өөрсдөдөө харагдахгүй.
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="st-btn st-btn-secondary"><Icon name="download" size={13} color="#3A2818" /> CSV экспорт</button>
      </div>

      <div className="st-scroll" style={{ flex: 1, padding: 22, overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          <Metric eyebrow="ИДЭВХТЭЙ ДОХИО" big="9" sub="3 шинэ долоо хоног" tint="ember" warn />
          <Metric eyebrow="ХОЛБОО ТОГТООСОН" big="6" sub="2 долоо хоногт" tint="moss" trend="up" />
          <Metric eyebrow="ДУНДАЖ НАС" big="14.2" sub="9-11 анги" tint="brass" />
          <Metric eyebrow="ХАЯГДЛЫН БУУРАЛТ" big="−18%" sub="ӨМНӨХ ОНТОЙ" tint="moss" />
        </div>

        <div className="st-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(185,132,56,0.3)", display: "flex", alignItems: "center", gap: 12 }}>
            <div className="st-h3">Шалгуурт нийцсэн сурагчид</div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 4 }}>
              {["Бүгд", "Шинэ", "Ажиллаж буй"].map((t, i) =>
            <button key={t} className="st-tab" data-active={i === 0}>{t}</button>
            )}
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "var(--st-paper-2)" }}>
                {["Сурагч", "Анги", "Ирц", "Оноо (Δ)", "Олимп.", "Сигналууд", "Багш", ""].map((h, i) =>
              <th key={i} style={{ textAlign: "left", padding: "10px 14px", color: "var(--st-ink-3)", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
              )}
              </tr>
            </thead>
            <tbody>
              {[
            { n: "Энхбаяр Г.", g: "10-А", attn: 64, score: 412, sd: -42, ol: 0, sig: ["attn", "score", "engage"], t: "Оюунгэрэл Ц.", st: "Шинэ" },
            { n: "Цэрэн-Эрдэнэ Б.", g: "11-Б", attn: 71, score: 480, sd: -28, ol: 1, sig: ["attn", "score"], t: "Алтантуяа Б.", st: "Ажиллаж буй" },
            { n: "Болд-Эрдэнэ С.", g: "9-В", attn: 58, score: 445, sd: -34, ol: 0, sig: ["attn", "score", "engage", "parent"], t: "—", st: "Шинэ" },
            { n: "Мөнхбат Д.", g: "11-А", attn: 76, score: 528, sd: -18, ol: 2, sig: ["score"], t: "Оюунгэрэл Ц.", st: "Ажиллаж буй" },
            { n: "Сүх-Очир Б.", g: "10-Б", attn: 82, score: 462, sd: -22, ol: 0, sig: ["score", "engage"], t: "Цэцэгмаа Д.", st: "Ажиллаж буй" },
            { n: "Чулуун Б.", g: "9-А", attn: 49, score: 388, sd: -55, ol: 0, sig: ["attn", "score", "engage", "parent"], t: "—", st: "Шинэ" },
            { n: "Эрдэнэ-Очир", g: "11-В", attn: 73, score: 502, sd: -12, ol: 1, sig: ["score"], t: "Алтантуяа Б.", st: "Ажиллаж буй" },
            { n: "Энхтайван Ц.", g: "10-А", attn: 67, score: 425, sd: -38, ol: 0, sig: ["attn", "score", "engage"], t: "Цэцэгмаа Д.", st: "Шинэ" },
            { n: "Баатарсайхан О.", g: "11-А", attn: 78, score: 488, sd: -24, ol: 1, sig: ["score"], t: "Оюунгэрэл Ц.", st: "Ажиллаж буй" }].
            map((r, i) =>
            <tr key={i} style={{ borderBottom: "1px solid rgba(185,132,56,0.18)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="st-avatar st-avatar-sky" style={{ width: 28, height: 28, fontSize: 11 }}>{r.n[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--st-ink)" }}>{r.n}</div>
                        <div style={{ fontSize: 10, color: "var(--st-ink-3)" }}>{r.st === "Шинэ" ? "✱ Шинэ долоо хоног" : "Дэмжлэг үргэлжилнэ"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}><span className="st-chip">{r.g}</span></td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className="st-num" style={{ color: r.attn < 70 ? "var(--st-ember)" : "var(--st-ink)", fontWeight: 600 }}>{r.attn}%</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div className="st-num" style={{ fontWeight: 600 }}>{r.score}</div>
                    <div className="st-num" style={{ fontSize: 10, color: "var(--st-ember)" }}>↓ {r.sd}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className="st-num" style={{ color: r.ol === 0 ? "var(--st-ink-3)" : "var(--st-ink)" }}>{r.ol}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {r.sig.map((s) => <SigChip key={s} kind={s} />)}
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 11, color: r.t === "—" ? "var(--st-ember)" : "var(--st-ink)" }}>{r.t}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button className="st-btn st-btn-sm st-btn-secondary">Дэлгэрэнгүй →</button>
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: "var(--st-ink-3)", lineHeight: 1.5, padding: "10px 14px", background: "rgba(62,95,115,0.07)", borderRadius: 8, border: "1px dashed rgba(62,95,115,0.3)" }}>
          <b style={{ color: "var(--st-ink-2)" }}>Хэлбэр:</b> Энэхүү жагсаалт сурагчдыг "бүтэлгүйтэх эрсдэлд" гэж тэмдэглэдэггүй. Зөвхөн <b>дэмжлэг үзүүлэх боломжтой</b> сурагчдыг харуулна. Сигналууд: ирц, загвар шалгалтын ахиц, олимпиадын оролцоо, эцэг эхийн мэдээлсэн тасалдал.
        </div>
      </div>
    </div>
  </div>;


Object.assign(window, { ParentPortal, WellbeingPulse, SchoolAdminRisk, AdminSidebar, SigChip });