/**
 * Ger Interior motifs — Soyombo flame, Khamar khee meander, Ulzii eternal knot,
 * brass corner brackets, brass tacks. Closed inventory in v2.0.0 per ADR-0009.
 * Source: studyTeach (2)/motifs.jsx.
 */
import type { CSSProperties } from 'react';

type SVGProps = {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

export function StSoyomboFlame({
  size = 32,
  color = 'var(--st-ember)',
  className,
  style,
}: SVGProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={style}
      aria-hidden="true"
    >
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
}

export function StUlzii({ size = 56, color = 'var(--st-brass)', className, style }: SVGProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <g fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
        <rect x="6" y="6" width="36" height="36" rx="1" />
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
}

type MeanderTone = 'brass' | 'ember' | 'soot';

export function StMeander({
  tone = 'brass',
  height = 14,
  flip = false,
  className,
}: {
  tone?: MeanderTone;
  height?: number;
  flip?: boolean;
  className?: string;
}) {
  const stroke = tone === 'ember' ? '#F4C99A' : tone === 'soot' ? '#D4A24C' : '#B98438';
  const svg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='14' viewBox='0 0 56 14'><g fill='none' stroke='${encodeURIComponent(stroke)}' stroke-width='1.4'><path d='M0 12 L0 4 L8 4 L8 8 L4 8 L4 6 L12 6 L12 10 L20 10 L20 2 L36 2 L36 10 L44 10 L44 6 L52 6 L52 8 L48 8 L48 4 L56 4 L56 12'/></g></svg>`;
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        height,
        width: '100%',
        backgroundRepeat: 'repeat-x',
        backgroundSize: `auto ${height}px`,
        backgroundImage: `url("${svg}")`,
        transform: flip ? 'scaleY(-1)' : 'none',
      }}
    />
  );
}

export function StPatternBand({ tone = 'brass' }: { tone?: MeanderTone }) {
  const lineColor = tone === 'ember' ? '#F4C99A' : tone === 'soot' ? '#D4A24C' : '#B98438';
  return (
    <div className="flex flex-col gap-[2px]" aria-hidden="true">
      <StMeander tone={tone} height={10} />
      <div style={{ height: 1, background: lineColor, opacity: 0.6 }} />
      <StMeander tone={tone} height={10} flip />
    </div>
  );
}

export function StBrassTack({ size = 8 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #D4A24C 0%, #8C5F22 80%)',
        boxShadow: '0 0 0 1px rgba(42,24,16,0.2), 0 1px 1px rgba(42,24,16,0.3)',
        flexShrink: 0,
      }}
    />
  );
}

export function StCornerBracket({
  corner = 'tl',
  color = 'var(--st-brass)',
  size = 18,
}: {
  corner?: 'tl' | 'tr' | 'br' | 'bl';
  color?: string;
  size?: number;
}) {
  const pos: Record<string, CSSProperties> = {
    tl: { top: 6, left: 6, transform: 'rotate(0deg)' },
    tr: { top: 6, right: 6, transform: 'rotate(90deg)' },
    br: { bottom: 6, right: 6, transform: 'rotate(180deg)' },
    bl: { bottom: 6, left: 6, transform: 'rotate(270deg)' },
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      aria-hidden="true"
      style={{ position: 'absolute', ...pos[corner] }}
    >
      <path d="M0 1 L8 1 M1 0 L1 8" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="1.5" cy="1.5" r="1" fill={color} />
    </svg>
  );
}

export function StSubjectGlyph({
  subject,
  size = 24,
  color = 'var(--st-ember-deep)',
}: {
  subject: 'math' | 'physics' | 'chem' | 'bio' | 'history' | 'english' | 'mongolian' | 'info';
  size?: number;
  color?: string;
}) {
  const paths: Record<string, JSX.Element> = {
    math: (
      <g fill={color}>
        <circle cx="6" cy="6" r="2.2" />
        <rect x="12" y="3.8" width="9" height="4.4" rx="1" />
        <path
          d="M3 14 L9 20 M9 14 L3 20"
          stroke={color}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M13 17 L21 17 M13 19.5 L21 19.5"
          stroke={color}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    ),
    physics: (
      <g fill="none" stroke={color} strokeWidth="1.6">
        <circle cx="12" cy="12" r="2.2" fill={color} />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </g>
    ),
    chem: (
      <g fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round">
        <path d="M10 3 L10 9 L5 19 C 4 20.5, 5 22, 7 22 L 17 22 C 19 22, 20 20.5, 19 19 L 14 9 L 14 3" />
        <circle cx="11" cy="16" r="1" fill={color} stroke="none" />
        <circle cx="14" cy="18" r="1.2" fill={color} stroke="none" />
      </g>
    ),
    bio: (
      <g fill={color}>
        <path d="M5 19 C 5 12, 10 7, 19 5 C 19 12, 14 17, 5 19 Z" />
        <path d="M19 5 L5 19" stroke="#FBF3E2" strokeWidth="0.8" fill="none" />
      </g>
    ),
    history: (
      <g fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round">
        <path d="M4 5 L4 21 L20 21 L20 7 L18 5 Z" />
        <path d="M4 5 L18 5 L20 7" />
        <path d="M8 10 L16 10 M8 13 L16 13 M8 16 L14 16" />
      </g>
    ),
    english: (
      <g fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
        <path d="M3 5 L3 19 M3 5 L8 5 C 10 5, 10 9, 8 9 L 3 9 M3 9 L9 9 C 11 9, 11 13, 9 13 L 3 13" />
        <path d="M14 19 L14 5 L20 5 L20 7 M14 11 L18 11 M14 19 L20 19 L20 17" />
      </g>
    ),
    mongolian: (
      <g fill={color}>
        <path d="M6 4 L6 20 L10 20 L10 11 L14 20 L18 20 L18 4 L14 4 L14 13 L10 4 Z" />
      </g>
    ),
    info: (
      <g fill="none" stroke={color} strokeWidth="1.6">
        <rect x="3" y="5" width="18" height="12" rx="1" />
        <path d="M2 20 L22 20" />
        <path d="M7 9 L9 11 L7 13 M11 13 L15 13" strokeLinecap="round" />
      </g>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {paths[subject]}
    </svg>
  );
}
