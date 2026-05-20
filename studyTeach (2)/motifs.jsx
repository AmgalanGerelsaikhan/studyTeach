/* ─────────────────────────────────────────────────────────────
   Decorative SVG motifs — Mongolian traditional patterns
   Khamar khee (meander), Ulzii (eternal knot), Soyombo flame,
   brass corner brackets.
   ───────────────────────────────────────────────────────────── */

const Meander = ({ tone = "brass", height = 14, width = "100%", flip = false }) => {
  const stroke = tone === "ember" ? "#F4C99A" : tone === "soot" ? "#D4A24C" : "#B98438";
  const cls = "st-meander " + (tone === "ember" ? "st-meander-ember" : tone === "soot" ? "st-meander-soot" : "");
  return (
    <div
      className={cls}
      style={{ height, width, transform: flip ? "scaleY(-1)" : "none" }}
      aria-hidden="true"
    />
  );
};

// Ulzii — Mongolian eternal knot, interlocking rectangular loops
const Ulzii = ({ size = 56, color = "#B98438", strokeWidth = 1.6, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={style} aria-hidden="true">
    <g fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
      {/* outer frame */}
      <rect x="6" y="6" width="36" height="36" rx="1" />
      {/* interlocking inner loops */}
      <path d="M14 6 L14 14 L6 14" />
      <path d="M34 6 L34 14 L42 14" />
      <path d="M14 42 L14 34 L6 34" />
      <path d="M34 42 L34 34 L42 34" />
      <rect x="14" y="14" width="20" height="20" />
      <path d="M20 14 L20 20 L14 20" />
      <path d="M28 14 L28 20 L34 20" />
      <path d="M20 34 L20 28 L14 28" />
      <path d="M28 34 L28 28 L34 28" />
      <rect x="20" y="20" width="8" height="8" />
    </g>
  </svg>
);

// Soyombo flame — abstract three-tongue flame, top of national symbol
const SoyomboFlame = ({ size = 32, color = "#C2410C", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={style} aria-hidden="true">
    <g fill={color}>
      <path d="M16 4 C 14 8, 13 10, 14 14 C 14.5 11, 15.5 9, 16 8 C 16.5 9, 17.5 11, 18 14 C 19 10, 18 8, 16 4 Z" />
      <path d="M9 9 C 8 13, 8 15, 10 18 C 10 15, 10.5 13.5, 11 12.5 C 11.5 14, 12 16, 12.5 18 C 13 14, 11.5 11, 9 9 Z" />
      <path d="M23 9 C 24 13, 24 15, 22 18 C 22 15, 21.5 13.5, 21 12.5 C 20.5 14, 20 16, 19.5 18 C 19 14, 20.5 11, 23 9 Z" />
      <circle cx="16" cy="22" r="1.5" />
      <path d="M10 24 L22 24 L22 25 L10 25 Z" />
      <path d="M11 26 L21 26 L21 27 L11 27 Z" />
    </g>
  </svg>
);

// Khas / sun-moon — sun arc above crescent (top of soyombo, abstracted)
const SunMoon = ({ size = 24, color = "#B98438", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={style} aria-hidden="true">
    <g fill={color}>
      <circle cx="16" cy="10" r="3" />
      <path d="M9 18 C 10 22, 13 24, 16 24 C 19 24, 22 22, 23 18 C 21 20, 18 21, 16 21 C 14 21, 11 20, 9 18 Z" />
    </g>
  </svg>
);

// Brass tack (decorative stud)
const BrassTack = ({ size = 8 }) => (
  <span
    style={{
      display: "inline-block",
      width: size, height: size,
      borderRadius: "50%",
      background: "radial-gradient(circle at 30% 30%, #D4A24C 0%, #8C5F22 80%)",
      boxShadow: "0 0 0 1px rgba(42,24,16,0.2), 0 1px 1px rgba(42,24,16,0.3)",
      flexShrink: 0,
    }}
  />
);

// Wood-joinery corner bracket — placed absolutely
const CornerBracket = ({ corner = "tl", color = "#B98438", size = 18 }) => {
  const pos = {
    tl: { top: 6, left: 6, transform: "rotate(0deg)" },
    tr: { top: 6, right: 6, transform: "rotate(90deg)" },
    br: { bottom: 6, right: 6, transform: "rotate(180deg)" },
    bl: { bottom: 6, left: 6, transform: "rotate(270deg)" },
  }[corner];
  return (
    <svg
      className="st-corner-bracket"
      width={size} height={size}
      viewBox="0 0 18 18"
      style={{ position: "absolute", ...pos }}
      aria-hidden="true"
    >
      <path d="M0 1 L8 1 M1 0 L1 8" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="1.5" cy="1.5" r="1" fill={color} />
    </svg>
  );
};

// Pattern band — used as full-width hero divider, multi-row meander
const PatternBand = ({ tone = "brass", style = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2, ...style }}>
    <Meander tone={tone} height={10} />
    <div style={{ height: 1, background: tone === "ember" ? "#F4C99A" : tone === "soot" ? "#D4A24C" : "#B98438", opacity: 0.6 }} />
    <Meander tone={tone} height={10} flip />
  </div>
);

// Subject icon — flat brass-on-cream geometric glyphs (no emoji)
const SubjectGlyph = ({ subject, size = 24, color = "#9A2F08" }) => {
  const paths = {
    math: <g fill={color}><circle cx="6" cy="6" r="2.2"/><rect x="12" y="3.8" width="9" height="4.4" rx="1"/><path d="M3 14 L9 20 M9 14 L3 20" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M13 17 L21 17 M13 19.5 L21 19.5" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/></g>,
    physics: <g fill="none" stroke={color} strokeWidth="1.6"><circle cx="12" cy="12" r="2.2" fill={color}/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></g>,
    chem: <g fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round"><path d="M10 3 L10 9 L5 19 C 4 20.5, 5 22, 7 22 L 17 22 C 19 22, 20 20.5, 19 19 L 14 9 L 14 3"/><circle cx="11" cy="16" r="1" fill={color} stroke="none"/><circle cx="14" cy="18" r="1.2" fill={color} stroke="none"/></g>,
    bio: <g fill={color}><path d="M5 19 C 5 12, 10 7, 19 5 C 19 12, 14 17, 5 19 Z"/><path d="M19 5 L5 19" stroke="#FBF3E2" strokeWidth="0.8" fill="none"/></g>,
    history: <g fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round"><path d="M4 5 L4 21 L20 21 L20 7 L18 5 Z"/><path d="M4 5 L18 5 L20 7"/><path d="M8 10 L16 10 M8 13 L16 13 M8 16 L14 16"/></g>,
    english: <g fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"><path d="M3 5 L3 19 M3 5 L8 5 C 10 5, 10 9, 8 9 L 3 9 M3 9 L9 9 C 11 9, 11 13, 9 13 L 3 13"/><path d="M14 19 L14 5 L20 5 L20 7 M14 11 L18 11 M14 19 L20 19 L20 17"/></g>,
    mongolian: <g fill={color}><path d="M6 4 L6 20 L10 20 L10 11 L14 20 L18 20 L18 4 L14 4 L14 13 L10 4 Z"/></g>,
    info: <g fill="none" stroke={color} strokeWidth="1.6"><rect x="3" y="5" width="18" height="12" rx="1"/><path d="M2 20 L22 20"/><path d="M7 9 L9 11 L7 13 M11 13 L15 13" strokeLinecap="round"/></g>,
  }[subject] || <circle cx="12" cy="12" r="6" fill={color}/>;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{paths}</svg>;
};

// Icon utility — minimal brass-line icons for nav/UI
const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.7 }) => {
  const s = { width: size, height: size, fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  const i = {
    home:     <g><path d="M3 11 L12 3 L21 11 M5 9 L5 21 L19 21 L19 9"/><path d="M10 21 L10 14 L14 14 L14 21"/></g>,
    book:     <g><path d="M4 4 L11 4 C 12 4, 12 5, 12 6 L 12 20 C 12 19, 12 18, 11 18 L 4 18 Z"/><path d="M20 4 L13 4 C 12 4, 12 5, 12 6 L 12 20 C 12 19, 12 18, 13 18 L 20 18 Z"/></g>,
    chat:     <g><path d="M4 5 L20 5 C 21 5, 21 6, 21 7 L 21 15 C 21 16, 20 17, 19 17 L 9 17 L 5 21 L 5 17 C 4 17, 3 16, 3 15 L 3 7 C 3 6, 4 5, 5 5 Z"/></g>,
    trophy:   <g><path d="M7 4 L17 4 L17 9 C 17 12, 14.5 14, 12 14 C 9.5 14, 7 12, 7 9 Z"/><path d="M7 6 L4 6 C 3 6, 3 7, 4 9 C 5 11, 7 11, 7 11"/><path d="M17 6 L20 6 C 21 6, 21 7, 20 9 C 19 11, 17 11, 17 11"/><path d="M9 14 L9 17 L15 17 L15 14"/><path d="M7 20 L17 20"/><path d="M12 17 L12 20"/></g>,
    ticket:   <g><path d="M3 8 C 4 8, 5 7, 5 6 L 5 5 L 19 5 L 19 6 C 19 7, 20 8, 21 8 L 21 16 C 20 16, 19 17, 19 18 L 19 19 L 5 19 L 5 18 C 5 17, 4 16, 3 16 Z"/><path d="M10 5 L10 19" strokeDasharray="2 2"/></g>,
    chart:    <g><path d="M4 4 L4 20 L20 20"/><path d="M7 16 L7 12 M11 16 L11 8 M15 16 L15 14 M19 16 L19 6"/></g>,
    users:    <g><circle cx="9" cy="8" r="3"/><path d="M3 19 C 3 15, 5 13, 9 13 C 13 13, 15 15, 15 19"/><circle cx="17" cy="9" r="2.5"/><path d="M16 13 C 19 13, 21 15, 21 18"/></g>,
    user:     <g><circle cx="12" cy="8" r="3.5"/><path d="M4 21 C 4 16, 7 14, 12 14 C 17 14, 20 16, 20 21"/></g>,
    upload:   <g><path d="M12 16 L12 4 M7 9 L12 4 L17 9"/><path d="M4 16 L4 20 L20 20 L20 16"/></g>,
    download: <g><path d="M12 4 L12 16 M7 11 L12 16 L17 11"/><path d="M4 16 L4 20 L20 20 L20 16"/></g>,
    settings: <g><circle cx="12" cy="12" r="3"/><path d="M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5"/></g>,
    bell:     <g><path d="M6 9 C 6 6, 9 4, 12 4 C 15 4, 18 6, 18 9 L 18 13 L 20 17 L 4 17 L 6 13 Z"/><path d="M10 20 C 10 21, 11 22, 12 22 C 13 22, 14 21, 14 20"/></g>,
    search:   <g><circle cx="11" cy="11" r="6"/><path d="M15.5 15.5 L20 20"/></g>,
    filter:   <g><path d="M3 5 L21 5 L14 13 L14 20 L10 18 L10 13 Z"/></g>,
    check:    <g><path d="M4 12 L10 18 L20 6"/></g>,
    x:        <g><path d="M5 5 L19 19 M19 5 L5 19"/></g>,
    plus:     <g><path d="M12 5 L12 19 M5 12 L19 12"/></g>,
    minus:    <g><path d="M5 12 L19 12"/></g>,
    arrow_r:  <g><path d="M4 12 L20 12 M14 6 L20 12 L14 18"/></g>,
    arrow_l:  <g><path d="M20 12 L4 12 M10 6 L4 12 L10 18"/></g>,
    chevron_r:<g><path d="M9 5 L16 12 L9 19"/></g>,
    chevron_d:<g><path d="M5 9 L12 16 L19 9"/></g>,
    chevron_u:<g><path d="M5 15 L12 8 L19 15"/></g>,
    lock:     <g><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11 L8 8 C 8 5, 10 4, 12 4 C 14 4, 16 5, 16 8 L 16 11"/></g>,
    unlock:   <g><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11 L8 8 C 8 5, 10 4, 12 4 C 14 4, 16 5, 16 8"/></g>,
    play:     <g><path d="M7 4 L20 12 L7 20 Z" fill={color} stroke="none"/></g>,
    pause:    <g><rect x="6" y="4" width="4" height="16" fill={color} stroke="none"/><rect x="14" y="4" width="4" height="16" fill={color} stroke="none"/></g>,
    pencil:   <g><path d="M4 20 L4 16 L16 4 L20 8 L8 20 Z"/><path d="M13 7 L17 11"/></g>,
    sms:      <g><rect x="3" y="6" width="18" height="14" rx="1"/><path d="M3 6 L12 14 L21 6"/></g>,
    phone:    <g><path d="M5 4 L8 4 L10 9 L8 11 C 9 14, 11 16, 14 17 L 16 15 L 21 17 L 21 20 C 13 21, 4 12, 5 4 Z"/></g>,
    wifi_off: <g><path d="M3 8 C 6 5, 9 4, 12 4 M14 5 L21 8 M2 2 L22 22" strokeLinecap="round"/><circle cx="12" cy="18" r="1.5" fill={color} stroke="none"/></g>,
    map:      <g><path d="M3 6 L9 4 L15 6 L21 4 L21 18 L15 20 L9 18 L3 20 Z"/><path d="M9 4 L9 18 M15 6 L15 20"/></g>,
    clock:    <g><circle cx="12" cy="12" r="8"/><path d="M12 7 L12 12 L16 14"/></g>,
    target:   <g><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.5" fill={color} stroke="none"/></g>,
    heart:    <g><path d="M12 20 C 4 14, 4 7, 8 6 C 10 5, 11 6, 12 8 C 13 6, 14 5, 16 6 C 20 7, 20 14, 12 20 Z"/></g>,
    shield:   <g><path d="M12 4 L19 6 L19 12 C 19 16, 16 19, 12 21 C 8 19, 5 16, 5 12 L 5 6 Z"/></g>,
    globe:    <g><circle cx="12" cy="12" r="8"/><path d="M4 12 L20 12 M12 4 C 9 8, 9 16, 12 20 M12 4 C 15 8, 15 16, 12 20"/></g>,
    sparkle:  <g><path d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z" fill={color} stroke="none"/></g>,
    flag:     <g><path d="M5 4 L5 20"/><path d="M5 5 C 9 4, 13 8, 19 5 L 19 13 C 13 16, 9 12, 5 13"/></g>,
    qr:       <g><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3" fill={color} stroke="none"/><rect x="16" y="5" width="3" height="3" fill={color} stroke="none"/><rect x="5" y="16" width="3" height="3" fill={color} stroke="none"/><path d="M14 14 L14 17 L17 17 L17 14 M19 14 L19 16 M14 19 L17 19 L17 21 L21 21 L21 17"/></g>,
    file:     <g><path d="M6 3 L14 3 L19 8 L19 21 L6 21 Z"/><path d="M14 3 L14 8 L19 8"/></g>,
    folder:   <g><path d="M3 6 L10 6 L12 8 L21 8 L21 19 L3 19 Z"/></g>,
    star:     <g><path d="M12 3 L14.5 9 L21 9.5 L16 14 L17.5 20.5 L 12 17 L 6.5 20.5 L 8 14 L 3 9.5 L 9.5 9 Z" fill={color} stroke={color} strokeLinejoin="round"/></g>,
    calendar: <g><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10 L21 10 M8 3 L8 7 M16 3 L16 7"/></g>,
    cash:     <g><rect x="3" y="6" width="18" height="12" rx="1"/><circle cx="12" cy="12" r="2.5"/><circle cx="7" cy="12" r="0.5" fill={color} stroke="none"/><circle cx="17" cy="12" r="0.5" fill={color} stroke="none"/></g>,
    award:    <g><circle cx="12" cy="9" r="5"/><path d="M8 13 L6 21 L10 19 L12 21 L14 19 L18 21 L16 13"/></g>,
    school:   <g><path d="M3 9 L12 4 L21 9 L12 14 Z"/><path d="M6 11 L6 17 C 6 18, 9 19, 12 19 C 15 19, 18 18, 18 17 L 18 11"/><path d="M21 9 L21 14"/></g>,
    yurt:     <g><path d="M4 20 L20 20 L18 10 L12 6 L6 10 Z"/><path d="M6 10 L18 10"/><circle cx="12" cy="7" r="1" fill={color} stroke="none"/></g>,
    mic:      <g><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 12 C 5 16, 8 18, 12 18 C 16 18, 19 16, 19 12"/><path d="M12 18 L12 21 M9 21 L15 21"/></g>,
    pin:      <g><path d="M12 3 C 8 3, 6 6, 6 10 C 6 14, 12 21, 12 21 C 12 21, 18 14, 18 10 C 18 6, 16 3, 12 3 Z"/><circle cx="12" cy="10" r="2.5"/></g>,
    eye:      <g><path d="M2 12 C 5 7, 8 5, 12 5 C 16 5, 19 7, 22 12 C 19 17, 16 19, 12 19 C 8 19, 5 17, 2 12 Z"/><circle cx="12" cy="12" r="3"/></g>,
  }[name] || <circle cx="12" cy="12" r="4"/>;
  return <svg style={s} viewBox="0 0 24 24" aria-hidden="true">{i}</svg>;
};

Object.assign(window, { Meander, Ulzii, SoyomboFlame, SunMoon, BrassTack, CornerBracket, PatternBand, SubjectGlyph, Icon });
