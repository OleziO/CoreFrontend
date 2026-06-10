import twColors from 'tailwindcss/colors'

// ─────────────────────────────────────────────────────────────────────────────
// Semantic design tokens — the single source of visual truth (Tailwind alias
// `@colors`). The brand is EVOLVED, not replaced: cyan #43bfee primary + gold
// #e8b931 accent over the dark base #0A0711 / navy #0b1121 / card #1e2330.
//
// Legacy keys (`dark.*`, `accent.gold`, `bg-primary`) are preserved verbatim so
// existing classes (`bg-bg-primary`, `bg-dark-navy`, `text-accent-gold`, …) keep
// working. New surfaces should reference the semantic tokens below.
// ─────────────────────────────────────────────────────────────────────────────

// Primary — brand cyan. DEFAULT pinned to #43bfee so existing `text-primary` /
// `border-primary` keep their exact appearance, now with opacity-modifier support.
const primary = {
  50: '#ecf9fe',
  100: '#d0f1fd',
  200: '#a6e6fb',
  300: '#6fd4f6',
  400: '#43bfee',
  500: '#1fa6dc',
  600: '#1486bd',
  700: '#136a98',
  800: '#15587b',
  900: '#164a67',
  DEFAULT: '#43bfee'
}

// Secondary — violet counter-accent for non-prize highlights / categories.
const secondary = {
  ...twColors.violet,
  DEFAULT: '#8b5cf6'
}

// Gold — reserved for prize / elite / verified-elite accents only.
const gold = {
  50: '#fdf9ed',
  100: '#faf0cc',
  200: '#f4df95',
  300: '#eecb5e',
  400: '#e8b931',
  500: '#d99e1c',
  600: '#bd7b16',
  700: '#975916',
  800: '#7c4719',
  900: '#693c19',
  DEFAULT: '#e8b931'
}

// Status — win/success, caution, loss/error, neutral info.
const success = { ...twColors.green, DEFAULT: '#22c55e' }
const warning = { ...twColors.amber, DEFAULT: '#f59e0b' }
const error = { ...twColors.red, DEFAULT: '#ef4444' }
const info = { ...twColors.sky, DEFAULT: '#38bdf8' }

export const colors = {
  transparent: 'transparent',
  current: 'currentColor',
  white: twColors.white,
  black: twColors.black,

  // Incidental Tailwind ramps still referenced across legacy files.
  gray: twColors.gray,
  red: twColors.red,
  green: twColors.green,
  orange: twColors.orange,
  yellow: twColors.yellow,
  blue: twColors.blue,
  purple: twColors.purple,

  // ─── Surface / elevation ladder ───────────────────────────────────────────
  // background → app abyss, surface → navy panel, elevated-surface → cards,
  // overlay → menus/poppers sitting above cards.
  background: '#0A0711',
  surface: '#0b1121',
  'elevated-surface': '#1e2330',
  overlay: '#141a28',

  // ─── Brand & status semantic tokens ───────────────────────────────────────
  primary,
  secondary,
  gold,
  success,
  warning,
  error,
  info,
  danger: error, // alias — keeps any `*-danger` usages aligned with `error`

  // ─── Legacy keys (do not remove — referenced by existing classes) ─────────
  dark: {
    900: '#0A0711',
    800: '#1c1c1c',
    700: '#2c2c2c',
    navy: '#0b1121',
    card: '#1e2330'
  },
  'bg-primary': '#0A0711',
  accent: {
    gold: '#e8b931'
  }
}
