// patterns.jsx — Mongolian textile-inspired SVG patterns
// All patterns are abstract geometric primitives (no copying of any specific
// piece of art). Tokens: ulzii (eternal knot), khee (horn pattern), uulen (cloud)

const PATTERN_INK  = 'var(--lacquer-deep)';
const PATTERN_INK2 = 'var(--lacquer)';
const PATTERN_BG   = 'transparent';

// ───────────── eternal-knot (ulzii) band ─────────────
function UlziiBand({ color = PATTERN_INK, height = 22 }) {
  // Inline SVG that tiles horizontally
  return (
    <svg width="100%" height={height} viewBox="0 0 80 22" preserveAspectRatio="xMidYMid"
         style={{ display: 'block' }}>
      <defs>
        <pattern id="ulzii" x="0" y="0" width="40" height="22" patternUnits="userSpaceOnUse">
          {/* Square spiral knot — simplified */}
          <g stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="square">
            <rect x="6" y="3" width="28" height="16" />
            <path d="M 12 3 L 12 13 L 28 13 L 28 9 L 16 9 L 16 19" />
            <path d="M 28 19 L 28 13" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ulzii)" />
    </svg>
  );
}

// ───────────── horn pattern (ever khee) — repeating curls ─────────────
function KheeBand({ color = PATTERN_INK, height = 16 }) {
  return (
    <svg width="100%" height={height} viewBox="0 0 64 16" preserveAspectRatio="xMidYMid"
         style={{ display: 'block' }}>
      <defs>
        <pattern id="khee" x="0" y="0" width="32" height="16" patternUnits="userSpaceOnUse">
          <g stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round">
            <path d="M 2 14 C 2 6, 10 6, 10 10 C 10 12, 6 12, 6 10" />
            <path d="M 14 14 C 14 6, 22 6, 22 10 C 22 12, 18 12, 18 10" />
            <path d="M 26 14 C 26 6, 30 6, 30 8" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#khee)" />
    </svg>
  );
}

// ───────────── cloud band (uulen khee) ─────────────
function UulenBand({ color = PATTERN_INK, height = 18 }) {
  return (
    <svg width="100%" height={height} viewBox="0 0 80 18" preserveAspectRatio="xMidYMid"
         style={{ display: 'block' }}>
      <defs>
        <pattern id="uulen" x="0" y="0" width="40" height="18" patternUnits="userSpaceOnUse">
          <g stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round">
            <path d="M 0 14 C 4 14, 4 4, 10 4 C 16 4, 16 14, 22 14 C 28 14, 28 4, 34 4 C 38 4, 40 8, 40 14" />
            <circle cx="10" cy="14" r="1.2" fill={color}/>
            <circle cx="22" cy="14" r="1.2" fill={color}/>
            <circle cx="34" cy="14" r="1.2" fill={color}/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#uulen)" />
    </svg>
  );
}

// ───────────── diamond chain (alkhmal) ─────────────
function DiamondChain({ color = PATTERN_INK, height = 12 }) {
  return (
    <svg width="100%" height={height} viewBox="0 0 60 12" preserveAspectRatio="xMidYMid"
         style={{ display: 'block' }}>
      <defs>
        <pattern id="diamond" x="0" y="0" width="20" height="12" patternUnits="userSpaceOnUse">
          <g stroke={color} strokeWidth="1.2" fill="none">
            <path d="M 0 6 L 10 1 L 20 6 L 10 11 Z" />
            <circle cx="10" cy="6" r="1.2" fill={color}/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#diamond)" />
    </svg>
  );
}

// ───────────── center medallion (toono — ger roof crown) ─────────────
function ToonoMedallion({ size = 64, color = 'var(--brass-deep)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="brassR" cx="35%" cy="35%">
          <stop offset="0%" stopColor="var(--brass-soft)" />
          <stop offset="60%" stopColor="var(--brass)" />
          <stop offset="100%" stopColor="var(--brass-deep)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#brassR)" stroke={color} strokeWidth="1.5"/>
      <circle cx="50" cy="50" r="36" fill="none" stroke={color} strokeWidth="1" opacity="0.5"/>
      {/* radial spokes like ger crown */}
      {Array.from({length: 12}).map((_, i) => {
        const a = (i * 30) * Math.PI / 180;
        const x1 = 50 + Math.cos(a) * 18;
        const y1 = 50 + Math.sin(a) * 18;
        const x2 = 50 + Math.cos(a) * 36;
        const y2 = 50 + Math.sin(a) * 36;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.2"/>;
      })}
      <circle cx="50" cy="50" r="14" fill="var(--lacquer)" stroke="var(--lacquer-deep)" strokeWidth="1.5"/>
      <circle cx="46" cy="46" r="3" fill="rgba(255,220,180,0.6)"/>
    </svg>
  );
}

// ───────────── Side decorative column (vertical band) ─────────────
function SideRail({ height = '100%', width = 18 }) {
  return (
    <div className="decor-side" style={{
      width, height, position: 'relative',
      borderLeft: '1px solid var(--ink-line)',
      borderRight: '1px solid var(--ink-line)',
    }}>
      <svg width="100%" height="100%" viewBox="0 0 18 200" preserveAspectRatio="xMidYMin slice"
           style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="sideKhee" x="0" y="0" width="18" height="40" patternUnits="userSpaceOnUse">
            <g stroke="var(--lacquer-deep)" strokeWidth="1.2" fill="none" strokeLinecap="round">
              <path d="M 9 4 C 4 4, 4 14, 9 14 C 14 14, 14 4, 9 4 Z" />
              <circle cx="9" cy="22" r="1.4" fill="var(--lacquer-deep)"/>
              <path d="M 9 26 C 4 26, 4 36, 9 36 C 14 36, 14 26, 9 26 Z" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sideKhee)"/>
      </svg>
    </div>
  );
}

// ───────────── A small "corner ornament" — like khaadag tie ─────────────
function CornerOrnament({ size = 24, color = 'var(--lacquer-deep)' }) {
  return (
    <svg className="decor-corner" width={size} height={size} viewBox="0 0 24 24" style={{display:'block'}}>
      <g stroke={color} strokeWidth="1.4" fill="none">
        <path d="M 2 2 L 12 2 M 2 2 L 2 12" strokeLinecap="round"/>
        <path d="M 6 2 C 6 6, 10 6, 10 2" />
        <circle cx="2" cy="2" r="1.2" fill={color}/>
      </g>
    </svg>
  );
}

// ───────────── Striped photo placeholder ─────────────
function PhotoSlot({ label = 'photo', w = 280, h = 180, tone = 'lacquer' }) {
  const stripe = tone === 'lacquer' ? 'var(--lacquer-tint)' : 'var(--felt-2)';
  const stripe2 = tone === 'lacquer' ? 'var(--lacquer-soft)' : 'var(--felt-3)';
  return (
    <div style={{
      width: w, height: h,
      backgroundImage: `repeating-linear-gradient(135deg, ${stripe} 0 12px, ${stripe2} 12px 24px)`,
      border: '1px solid var(--ink-line)',
      borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)',
      letterSpacing: '.1em', textTransform: 'uppercase',
      position: 'relative', overflow: 'hidden',
    }}>
      <span style={{ background: 'var(--paper)', padding: '4px 10px', border: '1px solid var(--ink-line)' }}>
        {label}
      </span>
    </div>
  );
}

// ───────────── Brass dial (used for score-band predictor) ─────────────
function BrassDial({ value = 720, min = 0, max = 800, label = 'predicted', size = 240 }) {
  const angle = -120 + (value - min) / (max - min) * 240; // -120 to +120
  const a = angle * Math.PI / 180;
  const cx = size / 2;
  const cy = size / 2 + 12;
  const r = size * 0.36;
  const nx = cx + Math.sin(a) * r;
  const ny = cy - Math.cos(a) * r;

  // Tick marks
  const ticks = [];
  for (let i = 0; i <= 8; i++) {
    const t = -120 + (i * 30);
    const ta = t * Math.PI / 180;
    const inner = r + 4;
    const outer = r + (i % 2 === 0 ? 14 : 8);
    ticks.push(
      <line key={i}
        x1={cx + Math.sin(ta) * inner} y1={cy - Math.cos(ta) * inner}
        x2={cx + Math.sin(ta) * outer} y2={cy - Math.cos(ta) * outer}
        stroke="var(--brass-deep)" strokeWidth={i % 2 === 0 ? 2 : 1}/>
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:'block'}}>
      <defs>
        <radialGradient id="dialBrass" cx="40%" cy="35%">
          <stop offset="0%" stopColor="oklch(0.94 0.04 85)"/>
          <stop offset="50%" stopColor="var(--brass)"/>
          <stop offset="100%" stopColor="var(--brass-deep)"/>
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r+22} fill="url(#dialBrass)" stroke="var(--brass-deep)" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={r+10} fill="var(--paper)" stroke="var(--brass-deep)" strokeWidth="0.8"/>
      {ticks}
      {/* danger / target zone */}
      <path
        d={`M ${cx + Math.sin(60*Math.PI/180)*r} ${cy - Math.cos(60*Math.PI/180)*r}
            A ${r} ${r} 0 0 1 ${cx + Math.sin(120*Math.PI/180)*r} ${cy - Math.cos(120*Math.PI/180)*r}`}
        stroke="var(--lacquer)" strokeWidth="6" fill="none" opacity="0.7"/>
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="6" fill="var(--ink)"/>
      <circle cx={cx} cy={cy} r="3" fill="var(--brass-soft)"/>
      {/* Labels */}
      <text x={cx} y={cy + r + 36} textAnchor="middle" fill="var(--ink-2)"
            style={{fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'.18em', textTransform:'uppercase'}}>
        {label}
      </text>
      <text x={cx} y={cy - r - 24} textAnchor="middle" fill="var(--ink)"
            style={{fontFamily:'var(--font-display)', fontSize:38, fontWeight:600}}>
        {value}
      </text>
    </svg>
  );
}

Object.assign(window, {
  UlziiBand, KheeBand, UulenBand, DiamondChain,
  ToonoMedallion, SideRail, CornerOrnament, PhotoSlot, BrassDial,
});
