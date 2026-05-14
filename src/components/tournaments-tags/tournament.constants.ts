// Tournament type constants (kept for backward compat, no longer in API schema)
export const tournamentTypeLabelMap: Record<string, string> = {}
export const tournamentTypeClassMap: Record<string, string> = {}

/** Усі значення `tournamentStatus` з API (POST/PATCH — лише ці два). */
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

/** Статуси для фільтрів / оновлення в адмінці. */
export const tournamentAdminStatusOptions: ReadonlyArray<{
  key: TTournamentStatusValue
  label: string
}> = [
  { key: 'QUALIFICATIONS', label: 'Кваліфікація' },
  { key: 'PLAYOFF', label: 'Плей-оф' }
]

/** Значення `division` з API турніру. */
export const TOURNAMENT_DIVISION_VALUES = [
  'DIVISION_I',
  'DIVISION_II',
  'DIVISION_III'
] as const

export type TTournamentDivisionValue = typeof TOURNAMENT_DIVISION_VALUES[number]

/** Підпис дивізіону (ключі як у API турніру / команди). */
export const tournamentDivisionLabelMap: Record<TTournamentDivisionValue, string> = {
  DIVISION_I: 'Дивізіон I',
  DIVISION_II: 'Дивізіон II',
  DIVISION_III: 'Дивізіон III'
}

/** Стилі тега дивізіону — в дусі TournamentStatusTag: рамка, легкий внутрішній градієнт, glow. */
export const tournamentDivisionTagClassMap: Record<TTournamentDivisionValue, string> = {
  DIVISION_I: `
    border border-sky-400/35
    bg-gradient-to-b from-sky-500/[0.20] via-sky-950/35 to-black/35
    text-sky-100
    shadow-[0_0_18px_rgba(56,189,248,0.22)]
  `,
  DIVISION_II: `
    border border-violet-400/38
    bg-gradient-to-b from-violet-500/[0.22] via-violet-950/35 to-black/35
    text-violet-100
    shadow-[0_0_20px_rgba(167,139,250,0.24)]
  `,
  DIVISION_III: `
    border border-amber-400/40
    bg-gradient-to-b from-amber-500/[0.20] via-amber-950/35 to-black/35
    text-amber-100
    shadow-[0_0_22px_rgba(251,191,36,0.28)]
  `
}

export const tournamentDivisionMmrHintMap: Record<TTournamentDivisionValue, string> = {
  DIVISION_I: 'Максимальний MMR гравця ≤ 3 500',
  DIVISION_II: 'Максимальний MMR гравця ≤ 5 500',
  DIVISION_III: 'Максимальний MMR гравця ≤ 7 000'
}

/** Ролі профілю (GET /auth/me → CurrentPlayerDto.roles[].name). */
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
