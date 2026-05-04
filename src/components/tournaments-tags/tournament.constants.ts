// Tournament type constants (kept for backward compat, no longer in API schema)
export const tournamentTypeLabelMap: Record<string, string> = {}
export const tournamentTypeClassMap: Record<string, string> = {}

export enum ETournamentStatus {
  SCHEDULED = 'SCHEDULED',
  REGISTRATION = 'REGISTRATION_OPEN',
  PRE_REGISTRATION = 'REGISTRATION_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export const tournamentStatusLabelMap: Record<string, string> = {
  SCHEDULED: 'Анонс',
  REGISTRATION_OPEN: 'Реєстрація відкрита',
  REGISTRATION_CLOSED: 'Реєстрація закрита',
  IN_PROGRESS: '◉ Live',
  COMPLETED: 'Завершено'
}

/** Значення `division` з API турніру. */
export const TOURNAMENT_DIVISION_VALUES = [
  'DIVISION_I',
  'DIVISION_II',
  'DIVISION_III'
] as const

export type TTournamentDivisionValue = typeof TOURNAMENT_DIVISION_VALUES[number]

/** Підпис дивізіону та пояснення MMR для tooltip (узгоджено з описом турніру). */
export const tournamentDivisionLabelMap: Record<TTournamentDivisionValue, string> = {
  DIVISION_I: 'Division I',
  DIVISION_II: 'Division II',
  DIVISION_III: 'Division III'
}

export const tournamentDivisionMmrHintMap: Record<TTournamentDivisionValue, string> = {
  DIVISION_I: 'Середній 0–2500 MMR, максимум гравця 3500',
  DIVISION_II: 'Середній 2500–4500 MMR, максимум гравця 5500',
  DIVISION_III: 'Середній 4500–7000 MMR, без обмеження максимуму гравця'
}

/** Ролі профілю (GET /auth/me → CurrentPlayerDto.roles[].name). */
export const PROFILE_CAPTAIN_ROLE_UA = 'Капітан'

/** Значення `tournamentStatus` для створення турніру (Nest). */
export const tournamentAdminStatusOptions = [
  { key: 'SCHEDULED', label: 'Анонс' },
  { key: 'REGISTRATION_OPEN', label: 'Реєстрація відкрита' },
  { key: 'REGISTRATION_CLOSED', label: 'Реєстрація закрита' },
  { key: 'IN_PROGRESS', label: 'Триває' },
  { key: 'COMPLETED', label: 'Завершено' }
] as const satisfies ReadonlyArray<{ key: keyof typeof tournamentStatusLabelMap; label: string }>

export const tournamentStatusClassMap: Record<string, string> = {
  SCHEDULED: `
    !border !border-gray-500/40 !bg-gray-500/10 !text-gray-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
  `,
  REGISTRATION_OPEN: `
    !border !border-green-500/40 !bg-green-500/10 !text-green-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
    shadow-[0_0_12px_rgba(34,197,94,0.2)]
  `,
  REGISTRATION_CLOSED: `
    !border !border-orange-500/40 !bg-orange-500/10 !text-orange-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
  `,
  IN_PROGRESS: `
    !border !border-red-500/40 !bg-red-500/10 !text-red-400
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide animate-pulse
  `,
  COMPLETED: `
    !border !border-yellow-500/40 !bg-yellow-500/10 !text-yellow-400
    rounded-lg px-10 py-6 text-sm font-semibold uppercase tracking-wide
  `
}
