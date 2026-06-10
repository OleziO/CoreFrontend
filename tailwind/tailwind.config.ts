import type { Config } from 'tailwindcss'
import { colors } from './tailwind.colors'

const spacing = Array.from({ length: 400 }, (_, index) => index).map(index => `${index}px`)

// Typography scale — Display / H1–H4 / Body / Small / Caption. Exposed as
// `text-display`, `text-h1` … `text-caption` (size + line-height + tracking +
// weight baked in). Headings should also use `font-display` (Chakra Petch).
const fontSize = {
  display: ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
  h1: ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
  h2: ['2rem', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '700' }],
  h3: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
  h4: ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
  body: ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
  small: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
  caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }]
} as const

// Elevation ladder — flat → floating. Glow tokens are reserved brand accents
// (primary cyan, prize gold) for focus / hover emphasis, used sparingly.
const boxShadow = {
  'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.30)',
  'elevation-2': '0 4px 12px rgba(0, 0, 0, 0.35)',
  'elevation-3': '0 8px 24px rgba(0, 0, 0, 0.40)',
  'elevation-4': '0 16px 48px rgba(0, 0, 0, 0.50)',
  'glow-primary': '0 0 16px rgba(67, 191, 238, 0.45)',
  'glow-gold': '0 0 16px rgba(232, 185, 49, 0.45)'
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
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        display: ['"Chakra Petch"', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/container-queries')
  ]
} satisfies Config
