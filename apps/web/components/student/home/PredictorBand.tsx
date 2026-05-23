'use client';

import type { PredictorResponse } from '@studyteach/contracts';

/**
 * EGSh score-band visualization. Mirrors studyTeach (2)/student.jsx → the
 * inline SVG in the sidebar of StudentHome. Renders a track with a gradient
 * band over the predicted range and a current-marker dot + label.
 *
 * Reused by:
 *   - student home right sidebar
 *   - EGSh score surface
 *
 * Range: scaled to EGSh 400–800 scale; pct comes from PredictorResponse
 * (mean of last-N-weeks percent-correct). Convert pct (0..100) → EGSh
 * scaled score with a simple linear mapping: 400 + pct * 4. That's a
 * placeholder — real EGSh equating happens in S07.
 */
interface Props {
  predictor: PredictorResponse | null;
}

const SVG_W = 260;
const SVG_H = 80;
const TICK_LABELS = [400, 500, 600, 700, 800];

function pctToEgsh(pct: number): number {
  return Math.round(400 + pct * 4);
}

function pctToX(pct: number): number {
  return pct * 2.6;
}

export function PredictorBand({ predictor }: Props) {
  if (!predictor || !predictor.band) {
    return null;
  }
  const { low, mid, high } = predictor.band;
  const lowX = pctToX(low);
  const midX = pctToX(mid);
  const highX = pctToX(high);
  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="block h-[80px] w-full">
      <defs>
        <linearGradient id="st-predictor-band" x1="0" x2="1">
          <stop offset="0" stopColor="#C28A1A" stopOpacity="0.7" />
          <stop offset="0.5" stopColor="#C2410C" stopOpacity="0.9" />
          <stop offset="1" stopColor="#C28A1A" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* track */}
      <rect x="0" y="56" width={SVG_W} height="6" rx="3" fill="#3a2818" />
      {/* band */}
      <rect
        x={lowX}
        y="52"
        width={Math.max(8, highX - lowX)}
        height="14"
        rx="7"
        fill="url(#st-predictor-band)"
      />
      {/* ticks */}
      {TICK_LABELS.map((label, i) => {
        const x = i * (SVG_W / (TICK_LABELS.length - 1));
        return (
          <g key={label}>
            <line x1={x} x2={x} y1="62" y2="68" stroke="#8C5F22" strokeWidth="1" />
            <text x={x} y="78" fill="#B98438" fontSize="9" textAnchor="middle">
              {label}
            </text>
          </g>
        );
      })}
      {/* current marker */}
      <g>
        <line
          x1={midX}
          x2={midX}
          y1="14"
          y2="54"
          stroke="#F4C99A"
          strokeWidth="1.4"
          strokeDasharray="2 2"
        />
        <circle cx={midX} cy="59" r="6" fill="#F4C99A" stroke="#2A1810" strokeWidth="2" />
        <text
          x={midX}
          y="28"
          fill="#FBF3E2"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="Bitter"
        >
          {pctToEgsh(mid)}
        </text>
      </g>
    </svg>
  );
}
