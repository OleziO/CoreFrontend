import dayjs from 'dayjs'
import type { LocationQuery } from 'vue-router'
import type { IFilterChipOption } from '@/components/filters/filters.d'
import { parseQueryArray } from '@/core/helpers'
import { tournamentStatuses } from '@/core/utils/formatters'

export type TTournamentSlotsFilter = 'open' | 'full'

/**
 * Фільтри списку турнірів. Живуть у query маршруту; сторінка і модалка
 * користуються одними й тими ж parse / build / match.
 */
export interface ITournamentsFilters {
  status: string[]
  /** `true` — з кваліфікацією. */
  qualification: boolean[]
  /** `true` — є призовий фонд. */
  prize: boolean[]
  slots: TTournamentSlotsFilter[]
  /** Початок турніру у межах [startsFrom, startsTo], формат YYYY-MM-DD. */
  startsFrom: string | null
  startsTo: string | null
}

export const TOURNAMENTS_FILTER_QUERY_KEYS = [
  'status', 'qualification', 'prize', 'slots', 'startsFrom', 'startsTo'
] as const

/** Статуси для фільтра: адмінські + «Завершений», якого немає у формах створення. */
export const TOURNAMENT_STATUS_FILTER_OPTIONS: readonly IFilterChipOption<string>[] = [
  ...tournamentStatuses.map(({ key, label }) => ({ value: key as string, label })),
  { value: 'COMPLETED', label: 'Завершений' }
]

export const TOURNAMENT_QUALIFICATION_OPTIONS: readonly IFilterChipOption<boolean>[] = [
  { value: true, label: 'З кваліфікацією' },
  { value: false, label: 'Одразу плей-оф' }
]

export const TOURNAMENT_PRIZE_OPTIONS: readonly IFilterChipOption<boolean>[] = [
  { value: true, label: 'З призовим' },
  { value: false, label: 'Без призового' }
]

export const TOURNAMENT_SLOTS_OPTIONS: readonly IFilterChipOption<TTournamentSlotsFilter>[] = [
  { value: 'open', label: 'Є вільні слоти' },
  { value: 'full', label: 'Слоти заповнено' }
]

export function createEmptyTournamentsFilters (): ITournamentsFilters {
  return {
    status: [],
    qualification: [],
    prize: [],
    slots: [],
    startsFrom: null,
    startsTo: null
  }
}

const parseFlag = (v: string) => Boolean(Number(v))
const isSlotsFilter = (v: string): v is TTournamentSlotsFilter => v === 'open' || v === 'full'

function toDateOrNull (value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return dayjs(value).isValid() ? value : null
}

export function parseTournamentsFilters (query: LocationQuery): ITournamentsFilters {
  return {
    status: parseQueryArray(query.status),
    qualification: parseQueryArray(query.qualification, parseFlag),
    prize: parseQueryArray(query.prize, parseFlag),
    slots: parseQueryArray(query.slots).filter(isSlotsFilter),
    startsFrom: toDateOrNull(query.startsFrom),
    startsTo: toDateOrNull(query.startsTo)
  }
}

export function buildTournamentsFilterQuery (f: ITournamentsFilters): Record<string, string | undefined> {
  return {
    status: f.status.length ? f.status.join(',') : undefined,
    qualification: f.qualification.length ? f.qualification.map(Number).join(',') : undefined,
    prize: f.prize.length ? f.prize.map(Number).join(',') : undefined,
    slots: f.slots.length ? f.slots.join(',') : undefined,
    startsFrom: f.startsFrom ?? undefined,
    startsTo: f.startsTo ?? undefined
  }
}

export function countActiveTournamentsFilters (f: ITournamentsFilters): number {
  let count = 0
  if (f.status.length) count += 1
  if (f.qualification.length) count += 1
  if (f.prize.length) count += 1
  if (f.slots.length) count += 1
  if (f.startsFrom || f.startsTo) count += 1
  return count
}

export function tournamentMatchesFilters (tournament: TTournament, f: ITournamentsFilters): boolean {
  if (f.status.length && !f.status.includes(String(tournament.tournamentStatus))) return false

  if (f.qualification.length && !f.qualification.includes(Boolean(tournament.hasQualification))) return false

  if (f.prize.length && !f.prize.includes(Number(tournament.prizePool) > 0)) return false

  if (f.slots.length) {
    const isFull = (tournament.teams?.length ?? 0) >= (tournament.tournamentSlots ?? 0)
    if (!f.slots.includes(isFull ? 'full' : 'open')) return false
  }

  if (f.startsFrom || f.startsTo) {
    const starts = dayjs(tournament.tournamentStartsAt)
    if (!starts.isValid()) return false
    if (f.startsFrom && starts.isBefore(dayjs(f.startsFrom), 'day')) return false
    if (f.startsTo && starts.isAfter(dayjs(f.startsTo), 'day')) return false
  }

  return true
}
