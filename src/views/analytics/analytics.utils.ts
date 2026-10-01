import { getPlayerRankImageSrc } from '@/core/helpers'
import type { TIconName } from '@/components/Icon.vue'

/**
 * Ординальна шкала рангів (Герольд → Титан): один відтінок бренд-ціану, що світлішає
 * з рангом. Кроки перевірено dataviz-валідатором на темній поверхні `--ds-surface`
 * (монотонна яскравість, крок ΔL ≥ 0.06, темний край ≥ 2:1 до фону).
 */
export const ANALYTICS_RANK_RAMP = [
  '#006670', '#007d8a', '#0095a5', '#00acbd', '#00c3d4', '#33d8e8', '#95e8f1', '#d8f5f8'
] as const

/**
 * Категоріальні кольори серій — не більше трьох + нейтральний «решта».
 * cyan-600 / secondary / pink-500 проходять перевірку на дальтонізм (ΔE ≥ 8 між сусідами).
 */
export const ANALYTICS_SERIES = {
  primary: '#0aa3c2',
  secondary: '#a855f7',
  pink: '#f00fc0',
  muted: 'rgba(255, 255, 255, 0.14)'
} as const

const numberFormat = new Intl.NumberFormat('uk-UA')
const compactFormat = new Intl.NumberFormat('uk-UA', { notation: 'compact', maximumFractionDigits: 1 })
const timeFormat = new Intl.DateTimeFormat('uk-UA', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Kyiv'
})

export function formatAnalyticsNumber (value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return numberFormat.format(Math.round(value))
}

/** Компактний запис для великих чисел (12,9 тис.); до 10 000 — повне число з роздільниками. */
export function formatAnalyticsCompact (value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value >= 10_000 ? compactFormat.format(value) : numberFormat.format(Math.round(value))
}

export function formatAnalyticsPercent (part: number, total: number): string {
  if (!total) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

/** «HH:MM» за Києвом або порожній рядок, якщо дати немає. */
export function formatAnalyticsTime (iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return timeFormat.format(date)
}

const uahFormat = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 })
const uahCompactFormat = new Intl.NumberFormat('uk-UA', { notation: 'compact', maximumFractionDigits: 1 })
const monthFormat = new Intl.DateTimeFormat('uk-UA', { month: 'short', timeZone: 'UTC' })
const dayFormat = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** Копійки → «₴12 400»; `compact` — «₴12,4 тис.» для поділок шкали. */
export function formatAnalyticsUah (kopecks: number | null | undefined, compact = false): string {
  if (kopecks == null || !Number.isFinite(kopecks)) return '—'
  const uah = kopecks / 100
  return `₴${compact && uah >= 10_000 ? uahCompactFormat.format(uah) : uahFormat.format(Math.round(uah))}`
}

/** «2026-09» → «вер.»; ключ місяця вже за Києвом, тож форматуємо в UTC без зсуву. */
export function formatAnalyticsMonth (month: string): string {
  const [year, monthIndex] = month.split('-').map(Number)
  if (!year || !monthIndex) return month
  return monthFormat.format(new Date(Date.UTC(year, monthIndex - 1, 1)))
}

/** «2026-09-30» → «30 вер.». */
export function formatAnalyticsDay (date: string): string {
  const [year, monthIndex, day] = date.split('-').map(Number)
  if (!year || !monthIndex || !day) return date
  return dayFormat.format(new Date(Date.UTC(year, monthIndex - 1, day)))
}

/** Сума виручки по всіх джерелах, копійки. */
export function sumAnalyticsRevenue (sources: TAnalyticsRevenueBySource | null | undefined): number {
  return sources ? sources.vip + sources.entryFees + sources.donations : 0
}

/** Медаль для стовпчика рангу: п'ята зірка тиру (`x5`); Титан має єдину медаль `81`. */
export function getRankBucketImageSrc (rankNumber: number): string {
  return getPlayerRankImageSrc(rankNumber >= 8 ? 81 : rankNumber * 10 + 5)
}

/** Гарна верхня межа шкали та поділки для стовпчикової діаграми (кроки 1 / 2 / 5 × 10ⁿ). */
export function getAnalyticsNiceScale (max: number, targetTicks = 4): { max: number; ticks: number[] } {
  if (!Number.isFinite(max) || max <= 0) return { max: targetTicks, ticks: [0, 1, 2, 3, 4] }
  const rough = max / targetTicks
  const power = 10 ** Math.floor(Math.log10(rough))
  const normalized = rough / power
  const stepBase = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const step = stepBase * power
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let tick = 0; tick <= top + step / 2; tick += step) ticks.push(tick)
  return { max: top, ticks }
}

/** Білий чи чорнильний текст поверх кольорової заливки — за відносною яскравістю HEX-кольору. */
export function getAnalyticsInkOnFill (hex: string): string {
  const match = /^#?([\da-f]{6})$/i.exec(hex.trim())
  if (!match) return '#f5f9ff'
  const int = Number.parseInt(match[1], 16)
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const luminance =
    0.2126 * channel((int >> 16) & 255) + 0.7152 * channel((int >> 8) & 255) + 0.0722 * channel(int & 255)
  return luminance > 0.45 ? '#07080f' : '#f5f9ff'
}

export const analyticsSocialIconMap: Record<TAnalyticsSocialChannel, TIconName> = {
  discord: 'discord',
  telegram: 'telegram',
  youtube: 'youtube',
  instagram: 'instagram',
  tiktok: 'tiktok',
  twitch: 'twitch'
}

export const analyticsSocialSourceLabelMap: Record<TAnalyticsSocialSource, string> = {
  live: 'Наживо',
  manual: 'Вручну',
  unavailable: 'Немає даних'
}

export const analyticsTournamentStatusLabelMap: Record<TAnalyticsTournament['status'], string> = {
  REGISTRATION: 'Реєстрація',
  QUALIFICATIONS: 'Кваліфікація',
  PLAYOFF: 'Плей-оф',
  COMPLETED: 'Завершено'
}
