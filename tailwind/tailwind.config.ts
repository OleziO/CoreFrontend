import type { Config } from 'tailwindcss'
import { colors } from './tailwind.colors'

const spacing = Array.from({ length: 400 }, (_, index) => index).map(index => `${index}px`)

// Typography scale — Display / H1–H4 / Body / Small / Caption. Exposed as
// `text-display`, `text-h1` … `text-caption` (size + line-height + tracking +
// weight baked in). Headings should also use `font-display` (Russo One) and are
// set uppercase with open tracking — the esports headline register.
const fontSize = {
  display: ['3.5rem', { lineHeight: '1.05', letterSpacing: '0.02em', fontWeight: '700' }],
  h1: ['2.5rem', { lineHeight: '1.1', letterSpacing: '0.02em', fontWeight: '700' }],
  h2: ['2rem', { lineHeight: '1.15', letterSpacing: '0.02em', fontWeight: '700' }],
  h3: ['1.5rem', { lineHeight: '1.2', letterSpacing: '0.01em', fontWeight: '600' }],
  h4: ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
  body: ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
  small: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
  caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }]
} as const

// Elevation ladder — flat → floating. Glow tokens are the neon accents (cyan,
// pink, violet, gold) for focus / hover emphasis; `glow-*-soft` is the resting
// halo a neon card carries, `glow-*` the lit hover/focus state.
const boxShadow = {
  'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.35)',
  'elevation-2': '0 4px 12px rgba(0, 0, 0, 0.45)',
  'elevation-3': '0 8px 24px rgba(0, 0, 0, 0.5)',
  'elevation-4': '0 16px 48px rgba(0, 0, 0, 0.6)',
  // Card edge: a deep even drop shadow plus a faint cyan halo so the card lifts
  // off the near-black page and already hints at the neon it lights on hover.
  card: '0 10px 28px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(46, 229, 255, 0.05)',
  'glow-primary': '0 0 18px rgba(46, 229, 255, 0.45), 0 0 48px rgba(46, 229, 255, 0.18)',
  'glow-primary-soft': '0 0 12px rgba(46, 229, 255, 0.2)',
  'glow-pink': '0 0 18px rgba(255, 47, 210, 0.45), 0 0 48px rgba(255, 47, 210, 0.18)',
  'glow-secondary': '0 0 18px rgba(168, 85, 247, 0.45), 0 0 48px rgba(168, 85, 247, 0.18)',
  'glow-gold': '0 0 18px rgba(232, 185, 49, 0.45), 0 0 48px rgba(232, 185, 49, 0.18)'
}

// Radii — sharper than Tailwind's defaults. Neon reads best on crisp edges, so
// the whole scale is pulled in one step: cards (`rounded-2xl`) land on 12px,
// controls (`rounded-xl`) on 10px, chips (`rounded-lg`) on 8px.
const borderRadius = {
  none: '0',
  sm: '3px',
  DEFAULT: '5px',
  md: '6px',
  lg: '8px',
  xl: '10px',
  '2xl': '12px',
  '3xl': '16px',
  full: '9999px'
}

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    screens: {
      '2xs': '450px',
      xs: '580px',
      xsl: '600px',
      sm: '640px',
      '2sm': '700px',
      md: '768px',
      '2md': '850px',
      lg: '992px',
      '2lg': '1000px',
      nm: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    colors,
    extend: {
      spacing,
      fontSize,
      boxShadow,
      borderRadius,
      // All three faces cover Cyrillic. `sans` is the body default (see
      // `_base.scss`), `display` the uppercase headline face, `mono` the
      // HUD / system-label face (`.sys-label`, ids, timestamps).
      fontFamily: {
        sans: ['"Exo 2"', 'system-ui', 'sans-serif'],
        inter: ['"Exo 2"', 'system-ui', 'sans-serif'],
        display: ['"Russo One"', '"Exo 2"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    }
  },
  plugins: [
    require('@tailwindcss/container-queries')
  ]
} satisfies Config
