import {
  PhSealCheck,
  PhSealWarning,
  PhCheck,
  PhExclamationMark,
  PhCheckCircle,
  PhXCircle,
  PhBroadcast,
  PhClock,
  PhFlagCheckered,
  PhTrophy
} from '@phosphor-icons/vue'

// Shared status vocabulary for the platform. Every domain status renders as
// icon + label (never color alone) so it stays readable for colorblind users.
// Consumed by <StatusBadge :preset="…" /> and reusable across all surfaces.

export type TStatusTone =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'gold'
  | 'neutral'
  | 'live'

export interface IStatusPreset {
  tone: TStatusTone
  icon: Component
  /** Ukrainian default label; callers may override via the `label` prop. */
  label: string
  /**
   * Glyph for icon-only seals. Seal icons with a knocked-out mark read thin at
   * 12–20px on a solid disc; a plain heavy check / mark stays legible there.
   */
  sealIcon?: Component
  /** Pulsing emphasis (e.g. a live match). Silenced under reduced-motion. */
  pulse?: boolean
}

export type TStatusPresetKey =
  | 'verified'
  | 'unverified'
  | 'win'
  | 'loss'
  | 'live'
  | 'upcoming'
  | 'completed'
  | 'prize'

export const STATUS_PRESETS: Record<TStatusPresetKey, IStatusPreset> = {
  verified: { tone: 'success', icon: PhSealCheck, sealIcon: PhCheck, label: 'Верифікований' },
  unverified: { tone: 'error', icon: PhSealWarning, sealIcon: PhExclamationMark, label: 'Не верифікований' },
  win: { tone: 'success', icon: PhCheckCircle, label: 'Перемога' },
  loss: { tone: 'error', icon: PhXCircle, label: 'Поразка' },
  live: { tone: 'live', icon: PhBroadcast, label: 'Live', pulse: true },
  upcoming: { tone: 'info', icon: PhClock, label: 'Незабаром' },
  completed: { tone: 'neutral', icon: PhFlagCheckered, label: 'Завершено' },
  prize: { tone: 'gold', icon: PhTrophy, label: 'Призовий фонд' }
}

// Tailwind class triples per tone — all built on semantic tokens.
// Text chips: tone-coloured label and hairline on a dark well — the neon
// system's "lit hairline" recipe rather than a flat tinted pill.
export const STATUS_TONE_CLASS: Record<TStatusTone, string> = {
  primary: 'text-primary border-primary/45 bg-primary/10',
  secondary: 'text-secondary border-secondary/45 bg-secondary/10',
  success: 'text-success border-success/45 bg-success/10',
  warning: 'text-warning border-warning/45 bg-warning/10',
  error: 'text-error border-error/45 bg-error/10',
  info: 'text-info border-info/45 bg-info/10',
  gold: 'text-gold border-gold/45 bg-gold/10',
  neutral: 'text-white/70 border-white/20 bg-white/[0.06]',
  live: 'text-error border-error/45 bg-error/10'
}

// Icon-only seals (e.g. the verification badge on an avatar): a crisp solid
// disc in the tone with a white glyph, a translucent neon ring in the same
// tone (replaces the old dark separator ring callers used to add) and a soft
// halo. No blur on the glyph — the seal icons are detailed and turn to mush.
export const STATUS_TONE_SOLID_CLASS: Record<TStatusTone, string> = {
  primary: 'text-white border-white/30 ring-2 ring-primary/40 bg-primary shadow-[0_0_10px_rgba(46,229,255,0.55)]',
  secondary: 'text-white border-white/30 ring-2 ring-secondary/40 bg-secondary shadow-[0_0_10px_rgba(168,85,247,0.55)]',
  success: 'text-white border-white/30 ring-2 ring-success/40 bg-success shadow-[0_0_10px_rgba(34,197,94,0.55)]',
  warning: 'text-white border-white/30 ring-2 ring-warning/40 bg-warning shadow-[0_0_10px_rgba(245,158,11,0.55)]',
  error: 'text-white border-white/30 ring-2 ring-error/40 bg-error shadow-[0_0_10px_rgba(239,68,68,0.55)]',
  info: 'text-white border-white/30 ring-2 ring-info/40 bg-info shadow-[0_0_10px_rgba(56,189,248,0.45)]',
  gold: 'text-white border-white/30 ring-2 ring-gold/40 bg-gold shadow-[0_0_10px_rgba(232,185,49,0.55)]',
  neutral: 'text-white border-white/30 ring-2 ring-white/20 bg-white/25',
  live: 'text-white border-white/30 ring-2 ring-error/40 bg-error shadow-[0_0_10px_rgba(239,68,68,0.55)]'
}
