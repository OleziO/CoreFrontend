// Tournament type constants (kept for backward compat, no longer in API schema)
export const tournamentTypeLabelMap: Record<string, string> = {}
export const tournamentTypeClassMap: Record<string, string> = {}

export const TOURNAMENT_STATUS_VALUES = ['REGISTRATION', 'QUALIFICATIONS', 'PLAYOFF'] as const
export type TTournamentStatusValue = (typeof TOURNAMENT_STATUS_VALUES)[number]

export enum ETournamentStatus {
  REGISTRATION = 'REGISTRATION',
  QUALIFICATIONS = 'QUALIFICATIONS',
  PLAYOFF = 'PLAYOFF'
}

/**
 * Скільки команд вміщає сітка плей-оф. Дзеркалить `PLAYOFF_TEAM_LIMIT` бекенду:
 * турнір без кваліфікації не має турнірної таблиці, тож його слоти не можуть
 * перевищувати цю межу.
 */
export const PLAYOFF_TEAM_LIMIT = 8

/**
 * Статуси, у яких команда ще може приєднатися до турніру й сплатити внесок.
 * Дзеркалить `isJoinableStatus` на бекенді: вікно реєстрації свідомо може
 * заходити в кваліфікацію, а чи відкрита реєстрація — вирішують дати.
 */
export const JOINABLE_TOURNAMENT_STATUSES: readonly string[] = [
  'REGISTRATION',
  'QUALIFICATIONS'
]

export function isJoinableTournamentStatus (status?: string | null): boolean {
  return !!status && JOINABLE_TOURNAMENT_STATUSES.includes(status)
}

export const tournamentStatusLabelMap: Record<TTournamentStatusValue, string> = {
  REGISTRATION: 'Реєстрація',
  QUALIFICATIONS: 'Кваліфікація',
  PLAYOFF: 'Плей-оф'
}

/** Значення статусу при створенні турніру, у порядку життєвого циклу. */
export const tournamentCreateStatusOptions: ReadonlyArray<{
  key: TTournamentStatusValue
  label: string
}> = [
  { key: 'REGISTRATION', label: 'Реєстрація' },
  { key: 'QUALIFICATIONS', label: 'Кваліфікація' },
  { key: 'PLAYOFF', label: 'Плей-оф' }
]

export const tournamentAdminStatusOptions: ReadonlyArray<{
  key: TTournamentStatusValue
  label: string
}> = [
  { key: 'REGISTRATION', label: 'Реєстрація' },
  { key: 'QUALIFICATIONS', label: 'Кваліфікація' },
  { key: 'PLAYOFF', label: 'Плей-оф' }
]

type TRatedPlayer = { rating?: number | null }

/**
 * Точний середній рейтинг основи, БЕЗ округлення — дзеркалить бекенд
 * (computeTeamAvgRating у team-rating.util.ts).
 *
 * Округлювати тут не можна: допуск рахується за точним значенням. `rating` у
 * БД — `real`, тому дробовий АВГ звичайна річ, і склад з АВГ 3500.4 бекенд у
 * Початковий НЕ пустить, а округлений до 3500 — пустив би. Тоді фронт показав
 * би кнопку «Приєднатися», а запит впав би з помилкою.
 *
 * Для показу є computeTeamAvgRatingRounded.
 */
export function computeTeamAvgRating (
  players: TRatedPlayer[] | null | undefined
): number | null {
  const list = players ?? []
  if (!list.length) return null
  return list.reduce((acc, p) => acc + (Number(p.rating) || 0), 0) / list.length
}

/** Середній рейтинг для показу — округлений, щоб збігатися з `avgRating` з API. */
export function computeTeamAvgRatingRounded (
  players: TRatedPlayer[] | null | undefined
): number | null {
  const avg = computeTeamAvgRating(players)
  return avg == null ? null : Math.round(avg)
}

export const PROFILE_CAPTAIN_ROLE_UA = 'Капітан'

export const tournamentStatusClassMap: Record<string, string> = {
  REGISTRATION: `
    !border !border-cyan-500/40 !bg-cyan-500/10 !text-cyan-300
    rounded-lg !px-10 !py-6 text-sm font-semibold uppercase tracking-wide
    shadow-[0_0_12px_rgba(34,211,238,0.2)]
  `,
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
