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

/** Усі три дивізіони доступні для створення/редагування турніру. */
export const TOURNAMENT_DIVISION_CREATE_VALUES = [
  'DIVISION_I',
  'DIVISION_II',
  'DIVISION_III'
] as const

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

export interface IDivisionRule {
  label: string
  /** Нижня межа середнього рейтингу, включно. */
  minAvg: number
  /** Верхня межа середнього рейтингу, включно; null — без обмежень. */
  maxAvg: number | null
  /** Ліміт по окремому гравцю, включно; null — без ліміту. */
  maxPlayerRating: number | null
}

/**
 * Дзеркало бекенду: src/tournaments/tournament-division.util.ts (DIVISION_RULES).
 * Межі включні з обох боків, тому АВГ рівно 7000 підходить і під DIVISION_II,
 * і під DIVISION_III — це нормально, бо команда може грати вгору, а на картці
 * показуємо найнижчий збіг.
 *
 * Увага: «Аматорський» тепер НАЙВИЩИЙ дивізіон (раніше був найнижчим).
 */
export const DIVISION_RULES: Record<TTournamentDivisionValue, IDivisionRule> = {
  DIVISION_I: { label: 'Початковий', minAvg: 0, maxAvg: 3500, maxPlayerRating: 5500 },
  DIVISION_II: { label: 'Любительський', minAvg: 0, maxAvg: 7000, maxPlayerRating: null },
  DIVISION_III: { label: 'Аматорський', minAvg: 7000, maxAvg: null, maxPlayerRating: null }
}

/** За зростанням сили. Порядок важливий: resolveTeamDivision бере перший збіг. */
const DIVISIONS_BY_STRENGTH: readonly TTournamentDivisionValue[] = [
  'DIVISION_I',
  'DIVISION_II',
  'DIVISION_III'
]

type TRatedPlayer = { rating?: number | null }

/**
 * Точний середній рейтинг основи, БЕЗ округлення — дзеркалить бекенд
 * (computeTeamAvgRating у tournament-division.util.ts).
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

/**
 * Чи може склад зайти в турнір цього дивізіону. Саме це — не власний дивізіон
 * команди — вирішує допуск, і саме це дозволяє грати вгору.
 */
export function isTeamEligibleForDivision (
  players: TRatedPlayer[] | null | undefined,
  division: TTournamentDivisionValue
): boolean {
  const list = players ?? []
  const avg = computeTeamAvgRating(list)
  if (avg == null) return false

  const rule = DIVISION_RULES[division]
  if (avg < rule.minAvg) return false
  if (rule.maxAvg != null && avg > rule.maxAvg) return false

  // Локальна змінна, щоб TypeScript звузив тип усередині колбека.
  const cap = rule.maxPlayerRating
  if (cap != null && list.some((p) => (Number(p.rating) || 0) > cap)) return false

  return true
}

/** Найнижчий дивізіон, якому склад відповідає. Лише для відображення. */
export function resolveTeamDivision (
  players: TRatedPlayer[] | null | undefined
): TTournamentDivisionValue | null {
  const list = players ?? []
  if (!list.length) return null
  return DIVISIONS_BY_STRENGTH.find((d) => isTeamEligibleForDivision(list, d)) ?? null
}

/** Дивізіон для відображення: значення з API, інакше — рахуємо зі складу основи. */
export function resolveTeamDivisionForDisplay (
  rawDivision: string | null | undefined,
  mainPlayers: TRatedPlayer[] | null | undefined
): TTournamentDivisionValue | null {
  const fromApi = normalizeTournamentDivision(rawDivision)
  if (fromApi != null) return fromApi
  return resolveTeamDivision(mainPlayers)
}

/** Підпис дивізіону (ключі як у API турніру / команди). Джерело — DIVISION_RULES. */
export const tournamentDivisionLabelMap: Record<TTournamentDivisionValue, string> = {
  DIVISION_I: DIVISION_RULES.DIVISION_I.label,
  DIVISION_II: DIVISION_RULES.DIVISION_II.label,
  DIVISION_III: DIVISION_RULES.DIVISION_III.label
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
  DIVISION_I: 'Середній MMR команди: 0–3 500, максимум 5 500 на гравця',
  DIVISION_II: 'Середній MMR команди: 0–7 000, без ліміту на гравця',
  DIVISION_III: 'Середній MMR команди: 7 000+, без ліміту на гравця'
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
