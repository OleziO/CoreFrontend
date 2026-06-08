// Tournament type constants (kept for backward compat, no longer in API schema)
export const tournamentTypeLabelMap: Record<string, string> = {}
export const tournamentTypeClassMap: Record<string, string> = {}

export const TOURNAMENT_STATUS_VALUES = ['QUALIFICATIONS', 'PLAYOFF'] as const
export type TTournamentStatusValue = (typeof TOURNAMENT_STATUS_VALUES)[number]

export enum ETournamentStatus {
  QUALIFICATIONS = 'QUALIFICATIONS',
  PLAYOFF = 'PLAYOFF'
}

export const tournamentStatusLabelMap: Record<TTournamentStatusValue, string> = {
  QUALIFICATIONS: 'Кваліфікація',
  PLAYOFF: 'Плей-оф'
}

/** Значення статусу при створенні турніру. */
export const tournamentCreateStatusOptions: ReadonlyArray<{
  key: TTournamentStatusValue
  label: string
}> = [
  { key: 'QUALIFICATIONS', label: 'Кваліфікація' },
  { key: 'PLAYOFF', label: 'Плей-оф' }
]

export const tournamentAdminStatusOptions: ReadonlyArray<{
  key: TTournamentStatusValue
  label: string
}> = [
  { key: 'QUALIFICATIONS', label: 'Кваліфікація' },
  { key: 'PLAYOFF', label: 'Плей-оф' }
]

export const TOURNAMENT_DIVISION_VALUES = [
  'DIVISION_I',
  'DIVISION_II',
  'DIVISION_III'
] as const

export type TTournamentDivisionValue = typeof TOURNAMENT_DIVISION_VALUES[number]

const TOURNAMENT_DIVISION_VALUE_SET = new Set<string>(TOURNAMENT_DIVISION_VALUES)

export function normalizeTournamentDivision (
  raw: string | null | undefined
): TTournamentDivisionValue | null {
  if (raw == null || typeof raw !== 'string') return null
  let s = raw.trim()
  if (!s) return null
  s = s
    .replace(/\u0406/g, 'I')
    .replace(/\u0456/g, 'i')
    .replace(/\u0399/g, 'I')
    .replace(/\u03B9/g, 'i')
  s = s.toUpperCase()

  const aliases: Record<string, TTournamentDivisionValue> = {
    DIVISION_3: 'DIVISION_III'
  }

  const key = aliases[s] ?? s
  return TOURNAMENT_DIVISION_VALUE_SET.has(key) ? (key as TTournamentDivisionValue) : null
}

/**
 * Якщо API не повернув `division`, оцінюємо за середнім рейтингом основи
 * (ті самі пороги, що в tournamentDivisionMmrHintMap).
 */
export function inferTournamentDivisionFromAvgRating (avg: number): TTournamentDivisionValue {
  if (avg <= 3500) return 'DIVISION_I'
  if (avg <= 5500) return 'DIVISION_II'
  return 'DIVISION_III'
}

/** Дивізіон для відображення: спочатку нормалізоване значення API, інакше — за середнім рейтингом основи. */
export function resolveTeamDivisionForDisplay (
  rawDivision: string | null | undefined,
  mainAvgRatingRounded: number | null | undefined
): TTournamentDivisionValue | null {
  const fromApi = normalizeTournamentDivision(rawDivision)
  if (fromApi != null) return fromApi
  const avg = mainAvgRatingRounded
  if (avg == null || Number.isNaN(Number(avg))) return null
  return inferTournamentDivisionFromAvgRating(Number(avg))
}

/** Підпис дивізіону (ключі як у API турніру / команди). */
export const tournamentDivisionLabelMap: Record<TTournamentDivisionValue, string> = {
  DIVISION_I: 'Дивізіон I',
  DIVISION_II: 'Дивізіон II',
  DIVISION_III: 'Дивізіон III'
}

/** Стилі тега дивізіону — рамка, градієнт на темному фоні картки / hero. */
export const tournamentDivisionTagClassMap: Record<TTournamentDivisionValue, string> = {
  DIVISION_I: `
    border border-cyan-400/45
    bg-gradient-to-b from-cyan-400/[0.18] via-sky-950/50 to-black/45
    text-cyan-50
    ring-1 ring-inset ring-cyan-300/15
    shadow-[0_0_14px_rgba(34,211,238,0.18)]
  `,
  DIVISION_II: `
    border border-fuchsia-400/42
    bg-gradient-to-b from-fuchsia-500/[0.16] via-violet-950/50 to-black/45
    text-fuchsia-50
    ring-1 ring-inset ring-fuchsia-300/12
    shadow-[0_0_16px_rgba(217,70,239,0.18)]
  `,
  DIVISION_III: `
    border border-amber-400/48
    bg-gradient-to-b from-amber-400/[0.14] via-amber-950/45 to-black/45
    text-amber-50
    ring-1 ring-inset ring-amber-300/15
    shadow-[0_0_16px_rgba(251,191,36,0.22)]
  `
}

export const tournamentDivisionCardChipClassMap: Record<TTournamentDivisionValue, string> = {
  DIVISION_I: 'border border-cyan-500/25 bg-cyan-950/25 text-cyan-100/95',
  DIVISION_II: 'border border-fuchsia-500/25 bg-fuchsia-950/25 text-fuchsia-100/95',
  DIVISION_III: 'border border-amber-500/25 bg-amber-950/20 text-amber-100/95'
}

export const tournamentDivisionMmrHintMap: Record<TTournamentDivisionValue, string> = {
  DIVISION_I: 'Середній MMR команди: 0–2 500 • Макс. MMR гравця: 3 500',
  DIVISION_II: 'Середній MMR команди: 2 500–4 500 • Макс. MMR гравця: 5 500',
  DIVISION_III: 'Середній MMR команди: 4 500–7 000 • Макс. MMR гравця: без обмежень'
}

export const PROFILE_CAPTAIN_ROLE_UA = 'Капітан'

export const tournamentStatusClassMap: Record<string, string> = {
  QUALIFICATIONS: `
    !border !border-green-500/40 !bg-green-500/10 !text-green-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
    shadow-[0_0_12px_rgba(34,197,94,0.2)]
  `,
  PLAYOFF: `
    !border !border-red-500/40 !bg-red-500/10 !text-red-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide animate-pulse
  `
}
