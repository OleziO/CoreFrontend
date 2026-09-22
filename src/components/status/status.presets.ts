import {
  PhSealCheck,
  PhSealWarning,
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
  verified: { tone: 'success', icon: PhSealCheck, label: 'Верифікований' },
  unverified: { tone: 'error', icon: PhSealWarning, label: 'Не верифікований' },
  win: { tone: 'success', icon: PhCheckCircle, label: 'Перемога' },
  loss: { tone: 'error', icon: PhXCircle, label: 'Поразка' },
  live: { tone: 'live', icon: PhBroadcast, label: 'Live', pulse: true },
  upcoming: { tone: 'info', icon: PhClock, label: 'Незабаром' },
  completed: { tone: 'neutral', icon: PhFlagCheckered, label: 'Завершено' },
  prize: { tone: 'gold', icon: PhTrophy, label: 'Призовий фонд' }
}

// Tailwind class triples per tone — all built on semantic tokens.
export const STATUS_TONE_CLASS: Record<TStatusTone, string> = {
  primary: 'text-primary border-primary/40 bg-primary/25',
  secondary: 'text-secondary border-secondary/40 bg-secondary/25',
  success: 'text-success border-success/40 bg-success/25',
  warning: 'text-warning border-warning/40 bg-warning/25',
  error: 'text-error border-error/40 bg-error/25',
  info: 'text-info border-info/40 bg-info/25',
  gold: 'text-gold border-gold/40 bg-gold/25',
  neutral: 'text-white/70 border-white/15 bg-white/15',
  live: 'text-error border-error/40 bg-error/25'
}

// Solid fill — used for icon-only seals (e.g. the verification badge on an
// avatar). A solid tone with a white glyph reads far better than a same-hue
// icon on a translucent tint of the same color.
export const STATUS_TONE_SOLID_CLASS: Record<TStatusTone, string> = {
  primary: 'text-white border-white/25 bg-primary',
  secondary: 'text-white border-white/25 bg-secondary',
  success: 'text-white border-white/25 bg-success',
  warning: 'text-black border-black/20 bg-warning',
  error: 'text-white border-white/25 bg-error',
  info: 'text-white border-white/25 bg-info',
  gold: 'text-black border-black/20 bg-gold',
  neutral: 'text-white border-white/25 bg-white/25',
  live: 'text-white border-white/25 bg-error'
}
