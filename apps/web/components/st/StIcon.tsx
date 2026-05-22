/**
 * Brass-line UI icon set. Ported from studyTeach (2)/motifs.jsx.
 * Closed inventory — new glyphs require ger-design-system review (ADR-0009).
 */
import type { CSSProperties } from 'react';

export type IconName =
  | 'home'
  | 'book'
  | 'chat'
  | 'trophy'
  | 'ticket'
  | 'chart'
  | 'users'
  | 'user'
  | 'upload'
  | 'download'
  | 'settings'
  | 'bell'
  | 'search'
  | 'filter'
  | 'check'
  | 'x'
  | 'plus'
  | 'minus'
  | 'arrow_r'
  | 'arrow_l'
  | 'chevron_r'
  | 'chevron_d'
  | 'chevron_u'
  | 'lock'
  | 'unlock'
  | 'play'
  | 'pause'
  | 'pencil'
  | 'sms'
  | 'phone'
  | 'wifi_off'
  | 'map'
  | 'clock'
  | 'target'
  | 'heart'
  | 'shield'
  | 'globe'
  | 'sparkle'
  | 'flag'
  | 'qr'
  | 'file'
  | 'folder'
  | 'star'
  | 'calendar'
  | 'cash'
  | 'award'
  | 'school'
  | 'yurt'
  | 'mic'
  | 'pin'
  | 'menu'
  | 'eye';

export interface StIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

const GLYPHS: Record<IconName, JSX.Element> = {
  home: (
    <g>
      <path d="M3 11 L12 3 L21 11 M5 9 L5 21 L19 21 L19 9" />
      <path d="M10 21 L10 14 L14 14 L14 21" />
    </g>
  ),
  book: (
    <g>
      <path d="M4 4 L11 4 C 12 4, 12 5, 12 6 L 12 20 C 12 19, 12 18, 11 18 L 4 18 Z" />
      <path d="M20 4 L13 4 C 12 4, 12 5, 12 6 L 12 20 C 12 19, 12 18, 13 18 L 20 18 Z" />
    </g>
  ),
  chat: (
    <g>
      <path d="M4 5 L20 5 C 21 5, 21 6, 21 7 L 21 15 C 21 16, 20 17, 19 17 L 9 17 L 5 21 L 5 17 C 4 17, 3 16, 3 15 L 3 7 C 3 6, 4 5, 5 5 Z" />
    </g>
  ),
  trophy: (
    <g>
      <path d="M7 4 L17 4 L17 9 C 17 12, 14.5 14, 12 14 C 9.5 14, 7 12, 7 9 Z" />
      <path d="M7 6 L4 6 C 3 6, 3 7, 4 9 C 5 11, 7 11, 7 11" />
      <path d="M17 6 L20 6 C 21 6, 21 7, 20 9 C 19 11, 17 11, 17 11" />
      <path d="M9 14 L9 17 L15 17 L15 14" />
      <path d="M7 20 L17 20" />
      <path d="M12 17 L12 20" />
    </g>
  ),
  ticket: (
    <g>
      <path d="M3 8 C 4 8, 5 7, 5 6 L 5 5 L 19 5 L 19 6 C 19 7, 20 8, 21 8 L 21 16 C 20 16, 19 17, 19 18 L 19 19 L 5 19 L 5 18 C 5 17, 4 16, 3 16 Z" />
      <path d="M10 5 L10 19" strokeDasharray="2 2" />
    </g>
  ),
  chart: (
    <g>
      <path d="M4 4 L4 20 L20 20" />
      <path d="M7 16 L7 12 M11 16 L11 8 M15 16 L15 14 M19 16 L19 6" />
    </g>
  ),
  users: (
    <g>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19 C 3 15, 5 13, 9 13 C 13 13, 15 15, 15 19" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 13 C 19 13, 21 15, 21 18" />
    </g>
  ),
  user: (
    <g>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 21 C 4 16, 7 14, 12 14 C 17 14, 20 16, 20 21" />
    </g>
  ),
  upload: (
    <g>
      <path d="M12 16 L12 4 M7 9 L12 4 L17 9" />
      <path d="M4 16 L4 20 L20 20 L20 16" />
    </g>
  ),
  download: (
    <g>
      <path d="M12 4 L12 16 M7 11 L12 16 L17 11" />
      <path d="M4 16 L4 20 L20 20 L20 16" />
    </g>
  ),
  settings: (
    <g>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5" />
    </g>
  ),
  bell: (
    <g>
      <path d="M6 9 C 6 6, 9 4, 12 4 C 15 4, 18 6, 18 9 L 18 13 L 20 17 L 4 17 L 6 13 Z" />
      <path d="M10 20 C 10 21, 11 22, 12 22 C 13 22, 14 21, 14 20" />
    </g>
  ),
  search: (
    <g>
      <circle cx="11" cy="11" r="6" />
      <path d="M15.5 15.5 L20 20" />
    </g>
  ),
  filter: (
    <g>
      <path d="M3 5 L21 5 L14 13 L14 20 L10 18 L10 13 Z" />
    </g>
  ),
  check: (
    <g>
      <path d="M4 12 L10 18 L20 6" />
    </g>
  ),
  x: (
    <g>
      <path d="M5 5 L19 19 M19 5 L5 19" />
    </g>
  ),
  plus: (
    <g>
      <path d="M12 5 L12 19 M5 12 L19 12" />
    </g>
  ),
  minus: (
    <g>
      <path d="M5 12 L19 12" />
    </g>
  ),
  arrow_r: (
    <g>
      <path d="M4 12 L20 12 M14 6 L20 12 L14 18" />
    </g>
  ),
  arrow_l: (
    <g>
      <path d="M20 12 L4 12 M10 6 L4 12 L10 18" />
    </g>
  ),
  chevron_r: (
    <g>
      <path d="M9 5 L16 12 L9 19" />
    </g>
  ),
  chevron_d: (
    <g>
      <path d="M5 9 L12 16 L19 9" />
    </g>
  ),
  menu: (
    <g>
      <path d="M3.5 7 L20.5 7" />
      <path d="M3.5 12 L20.5 12" />
      <path d="M3.5 17 L20.5 17" />
    </g>
  ),
  chevron_u: (
    <g>
      <path d="M5 15 L12 8 L19 15" />
    </g>
  ),
  lock: (
    <g>
      <rect x="5" y="11" width="14" height="9" rx="1" />
      <path d="M8 11 L8 8 C 8 5, 10 4, 12 4 C 14 4, 16 5, 16 8 L 16 11" />
    </g>
  ),
  unlock: (
    <g>
      <rect x="5" y="11" width="14" height="9" rx="1" />
      <path d="M8 11 L8 8 C 8 5, 10 4, 12 4 C 14 4, 16 5, 16 8" />
    </g>
  ),
  play: (
    <g>
      <path d="M7 4 L20 12 L7 20 Z" fill="currentColor" stroke="none" />
    </g>
  ),
  pause: (
    <g>
      <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
    </g>
  ),
  pencil: (
    <g>
      <path d="M4 20 L4 16 L16 4 L20 8 L8 20 Z" />
      <path d="M13 7 L17 11" />
    </g>
  ),
  sms: (
    <g>
      <rect x="3" y="6" width="18" height="14" rx="1" />
      <path d="M3 6 L12 14 L21 6" />
    </g>
  ),
  phone: (
    <g>
      <path d="M5 4 L8 4 L10 9 L8 11 C 9 14, 11 16, 14 17 L 16 15 L 21 17 L 21 20 C 13 21, 4 12, 5 4 Z" />
    </g>
  ),
  wifi_off: (
    <g>
      <path d="M3 8 C 6 5, 9 4, 12 4 M14 5 L21 8 M2 2 L22 22" strokeLinecap="round" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </g>
  ),
  map: (
    <g>
      <path d="M3 6 L9 4 L15 6 L21 4 L21 18 L15 20 L9 18 L3 20 Z" />
      <path d="M9 4 L9 18 M15 6 L15 20" />
    </g>
  ),
  clock: (
    <g>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7 L12 12 L16 14" />
    </g>
  ),
  target: (
    <g>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </g>
  ),
  heart: (
    <g>
      <path d="M12 20 C 4 14, 4 7, 8 6 C 10 5, 11 6, 12 8 C 13 6, 14 5, 16 6 C 20 7, 20 14, 12 20 Z" />
    </g>
  ),
  shield: (
    <g>
      <path d="M12 4 L19 6 L19 12 C 19 16, 16 19, 12 21 C 8 19, 5 16, 5 12 L 5 6 Z" />
    </g>
  ),
  globe: (
    <g>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12 L20 12 M12 4 C 9 8, 9 16, 12 20 M12 4 C 15 8, 15 16, 12 20" />
    </g>
  ),
  sparkle: (
    <g>
      <path
        d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z"
        fill="currentColor"
        stroke="none"
      />
    </g>
  ),
  flag: (
    <g>
      <path d="M5 4 L5 20" />
      <path d="M5 5 C 9 4, 13 8, 19 5 L 19 13 C 13 16, 9 12, 5 13" />
    </g>
  ),
  qr: (
    <g>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
      <path d="M14 14 L14 17 L17 17 L17 14 M19 14 L19 16 M14 19 L17 19 L17 21 L21 21 L21 17" />
    </g>
  ),
  file: (
    <g>
      <path d="M6 3 L14 3 L19 8 L19 21 L6 21 Z" />
      <path d="M14 3 L14 8 L19 8" />
    </g>
  ),
  folder: (
    <g>
      <path d="M3 6 L10 6 L12 8 L21 8 L21 19 L3 19 Z" />
    </g>
  ),
  star: (
    <g>
      <path
        d="M12 3 L14.5 9 L21 9.5 L16 14 L17.5 20.5 L 12 17 L 6.5 20.5 L 8 14 L 3 9.5 L 9.5 9 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </g>
  ),
  calendar: (
    <g>
      <rect x="3" y="5" width="18" height="16" rx="1" />
      <path d="M3 10 L21 10 M8 3 L8 7 M16 3 L16 7" />
    </g>
  ),
  cash: (
    <g>
      <rect x="3" y="6" width="18" height="12" rx="1" />
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="7" cy="12" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="0.5" fill="currentColor" stroke="none" />
    </g>
  ),
  award: (
    <g>
      <circle cx="12" cy="9" r="5" />
      <path d="M8 13 L6 21 L10 19 L12 21 L14 19 L18 21 L16 13" />
    </g>
  ),
  school: (
    <g>
      <path d="M3 9 L12 4 L21 9 L12 14 Z" />
      <path d="M6 11 L6 17 C 6 18, 9 19, 12 19 C 15 19, 18 18, 18 17 L 18 11" />
      <path d="M21 9 L21 14" />
    </g>
  ),
  yurt: (
    <g>
      <path d="M4 20 L20 20 L18 10 L12 6 L6 10 Z" />
      <path d="M6 10 L18 10" />
      <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
    </g>
  ),
  mic: (
    <g>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 12 C 5 16, 8 18, 12 18 C 16 18, 19 16, 19 12" />
      <path d="M12 18 L12 21 M9 21 L15 21" />
    </g>
  ),
  pin: (
    <g>
      <path d="M12 3 C 8 3, 6 6, 6 10 C 6 14, 12 21, 12 21 C 12 21, 18 14, 18 10 C 18 6, 16 3, 12 3 Z" />
      <circle cx="12" cy="10" r="2.5" />
    </g>
  ),
  eye: (
    <g>
      <path d="M2 12 C 5 7, 8 5, 12 5 C 16 5, 19 7, 22 12 C 19 17, 16 19, 12 19 C 8 19, 5 17, 2 12 Z" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
};

export function StIcon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 1.7,
  className,
  style,
}: StIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={{
        fill: 'none',
        stroke: color,
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ...style,
      }}
    >
      {GLYPHS[name]}
    </svg>
  );
}
