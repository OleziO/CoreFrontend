import {
  PhSealCheck,
  PhSealWarning,
  PhCheckCircle,
  PhXCircle,
  PhBroadcast,
  PhClock,
  PhFlagCheckered,
  PhTrophy,
  PhShieldChevron
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
  | 'division'

export const STATUS_PRESETS: Record<TStatusPresetKey, IStatusPreset> = {
  verified: { tone: 'success', icon: PhSealCheck, label: 'Верифікований' },
  unverified: { tone: 'neutral', icon: PhSealWarning, label: 'Не верифікований' },
  win: { tone: 'success', icon: PhCheckCircle, label: 'Перемога' },
  loss: { tone: 'error', icon: PhXCircle, label: 'Поразка' },
  live: { tone: 'live', icon: PhBroadcast, label: 'Live', pulse: true },
  upcoming: { tone: 'info', icon: PhClock, label: 'Незабаром' },
  completed: { tone: 'neutral', icon: PhFlagCheckered, label: 'Завершено' },
  prize: { tone: 'gold', icon: PhTrophy, label: 'Призовий фонд' },
  division: { tone: 'primary', icon: PhShieldChevron, label: 'Дивізіон' }
}

// Tailwind class triples per tone — all built on semantic tokens.
export const STATUS_TONE_CLASS: Record<TStatusTone, string> = {
  primary: 'text-primary border-primary/40 bg-primary/10',
  secondary: 'text-secondary border-secondary/40 bg-secondary/10',
  success: 'text-success border-success/40 bg-success/10',
  warning: 'text-warning border-warning/40 bg-warning/10',
  error: 'text-error border-error/40 bg-error/10',
  info: 'text-info border-info/40 bg-info/10',
  gold: 'text-gold border-gold/40 bg-gold/10',
  neutral: 'text-white/70 border-white/15 bg-white/5',
  live: 'text-error border-error/40 bg-error/10'
}
