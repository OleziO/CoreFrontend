import twColors from 'tailwindcss/colors'

// ─────────────────────────────────────────────────────────────────────────────
// Semantic design tokens — the single source of visual truth (Tailwind alias
// `@colors`). The brand is EVOLVED, not replaced: the cyan primary is pushed to
// an electric neon `#2ee5ff`, gold `#e8b931` stays the prize accent, and a hot
// pink `#ff2fd2` + neon violet `#a855f7` join as counter-accents. Everything
// sits on a deep indigo near-black surface ladder (hue 240°) so the neon reads.
//
// Surface ladder (dark → light, white text ≥ 14:1 on every step):
//   background #07080f → surface #0d0f1c → gray-950 #10121f →
//   elevated-surface #141729 → overlay #1b1f36 → gray-800 #222741
//
// Legacy keys (`dark.*`, `accent.gold`, `bg-primary`) are preserved so existing
// classes (`bg-bg-primary`, `bg-dark-navy`, `text-accent-gold`, …) keep working,
// but they are PINNED to the ladder above. New surfaces should reference the
// semantic tokens below. Keep in sync with `src/assets/styles/_tokens.scss`.
// ─────────────────────────────────────────────────────────────────────────────

// Surface ladder — also consumed by the legacy keys and the gray ramp below so
// there is exactly one place to retune the theme's darkness.
const surfaces = {
  background: '#07080f',
  surface: '#0d0f1c',
  'elevated-surface': '#141729',
  overlay: '#1b1f36'
}

// Gray — Tailwind's neutral ramp for text/icons, with the dark end re-pinned to
// the indigo surface ladder. Cards use `from-gray-900 … to-gray-950` as their
// fill and badges use `ring-gray-900` to match, so gray-900 === elevated-surface.
const gray = {
  ...twColors.gray,
  800: '#222741',
  900: surfaces['elevated-surface'],
  950: '#10121f'
}

// Primary — electric brand cyan. DEFAULT is the 400 step; `text-primary`,
// `border-primary/40`, `bg-primary/10` all resolve through it.
const primary = {
  50: '#e9fdff',
  100: '#c9f9ff',
  200: '#98f2ff',
  300: '#66ecff',
  400: '#2ee5ff',
  500: '#0fc8e8',
  600: '#0aa3c2',
  700: '#0c819a',
  800: '#12677b',
  900: '#145566',
  DEFAULT: '#2ee5ff'
}

// Secondary — neon violet counter-accent for non-prize highlights / categories.
const secondary = {
  ...twColors.violet,
  DEFAULT: '#a855f7'
}

// Pink — hot neon accent. Reserved for live / hero gradient ends / the second
// stop of the chrome hairline. Never a fill for large areas.
const pink = {
  50: '#fff0fb',
  100: '#ffd9f5',
  200: '#ffb3ec',
  300: '#ff80e0',
  400: '#ff2fd2',
  500: '#f00fc0',
  600: '#c9089f',
  700: '#a1077f',
  800: '#7d0a63',
  900: '#5c0a4a',
  DEFAULT: '#ff2fd2'
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
  gray,
  red: twColors.red,
  green: twColors.green,
  orange: twColors.orange,
  yellow: twColors.yellow,
  blue: twColors.blue,
  purple: twColors.purple,

  // ─── Surface / elevation ladder ───────────────────────────────────────────
  // background → page, surface → panel / chrome, elevated-surface → cards,
  // overlay → menus/poppers sitting above cards (lighter than cards, so the
  // ladder reads top-down).
  ...surfaces,

  // ─── Brand & status semantic tokens ───────────────────────────────────────
  primary,
  secondary,
  pink,
  gold,
  success,
  warning,
  error,
  info,
  danger: error, // alias — keeps any `*-danger` usages aligned with `error`

  // ─── Legacy keys (do not remove — referenced by existing classes) ─────────
  dark: {
    900: surfaces.background,
    800: '#1c1c1c',
    700: '#2c2c2c',
    navy: surfaces.surface,
    card: surfaces['elevated-surface']
  },
  'bg-primary': surfaces.background,
  accent: {
    gold: '#e8b931'
  }
}
