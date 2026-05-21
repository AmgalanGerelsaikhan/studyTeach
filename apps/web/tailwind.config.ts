import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ger Interior tokens — see docs/DESIGN_SYSTEM.md
        cream: 'var(--st-cream)',
        paper: 'var(--st-paper)',
        'paper-2': 'var(--st-paper-2)',
        felt: 'var(--st-felt)',
        'felt-deep': 'var(--st-felt-deep)',
        ember: 'var(--st-ember)',
        'ember-bright': 'var(--st-ember-bright)',
        'ember-deep': 'var(--st-ember-deep)',
        cinnabar: 'var(--st-cinnabar)',
        brass: 'var(--st-brass)',
        'brass-bright': 'var(--st-brass-bright)',
        'brass-dark': 'var(--st-brass-dark)',
        soot: 'var(--st-soot)',
        ink: 'var(--st-ink)',
        'ink-2': 'var(--st-ink-2)',
        'ink-3': 'var(--st-ink-3)',
        steppe: 'var(--st-steppe)',
        sky: 'var(--st-sky)',
        'sky-bright': 'var(--st-sky-bright)',
        moss: 'var(--st-moss)',
        'moss-bright': 'var(--st-moss-bright)',
        success: 'var(--st-success)',
        warn: 'var(--st-warn)',
        danger: 'var(--st-danger)',
      },
      fontFamily: {
        display: ['Bitter', 'Roboto Slab', 'Georgia', 'serif'],
        sans: ['Manrope', '-apple-system', 'Segoe UI', 'Noto Sans', 'sans-serif'],
        mongol: ['"Noto Serif Mongolian"', 'serif'],
      },
      borderRadius: {
        'st-sm': 'var(--st-r-sm)',
        'st-md': 'var(--st-r-md)',
        'st-lg': 'var(--st-r-lg)',
        'st-xl': 'var(--st-r-xl)',
      },
    },
  },
  plugins: [],
};

export default config;
