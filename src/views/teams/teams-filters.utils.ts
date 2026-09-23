import type { LocationQuery } from 'vue-router'
import type { IFilterChipOption } from '@/components/filters/filters.d'
import { parseQueryArray } from '@/core/helpers'
import { computeTeamAvgRatingRounded } from '@/components/tournaments-tags/tournament.constants'

/** Основний склад — 5 слотів; «повна» команда має всі пʼять зайнятими. */
export const TEAM_MAIN_SLOTS = 5

export type TTeamRosterFilter = 'open' | 'full'

/**
 * Фільтри списку команд. Живуть у query маршруту; сторінка і модалка
 * користуються одними й тими ж parse / build / match.
 */
export interface ITeamsFilters {
  /** `approved` — верифіковані, `applied` — ні (ключі `teamStatus` з teams.enums). */
  status: string[]
  ratingFrom: number | null
  ratingTo: number | null
  roster: TTeamRosterFilter[]
  /** `true` — з тренером. */
  coach: boolean[]
  /** `true` — зараз грає в турнірі. */
  playing: boolean[]
}

export const TEAMS_FILTER_QUERY_KEYS = ['status', 'ratingFrom', 'ratingTo', 'roster', 'coach', 'playing'] as const

export const TEAM_ROSTER_OPTIONS: readonly IFilterChipOption<TTeamRosterFilter>[] = [
  { value: 'open', label: 'Є вільні місця' },
  { value: 'full', label: 'Повний склад', hint: `${TEAM_MAIN_SLOTS}/${TEAM_MAIN_SLOTS}` }
]

export const TEAM_COACH_OPTIONS: readonly IFilterChipOption<boolean>[] = [
  { value: true, label: 'З тренером' },
  { value: false, label: 'Без тренера' }
]

export const TEAM_ACTIVITY_OPTIONS: readonly IFilterChipOption<boolean>[] = [
  { value: true, label: 'Грає в турнірі' },
  { value: false, label: 'Не в турнірі' }
]

export function createEmptyTeamsFilters (): ITeamsFilters {
  return {
    status: [],
    ratingFrom: null,
    ratingTo: null,
    roster: [],
    coach: [],
    playing: []
  }
}

function toNumberOrNull (value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const parseFlag = (v: string) => Boolean(Number(v))
const isRosterFilter = (v: string): v is TTeamRosterFilter => v === 'open' || v === 'full'

export function parseTeamsFilters (query: LocationQuery): ITeamsFilters {
  return {
    status: parseQueryArray(query.status),
    ratingFrom: toNumberOrNull(query.ratingFrom),
    ratingTo: toNumberOrNull(query.ratingTo),
    roster: parseQueryArray(query.roster).filter(isRosterFilter),
    coach: parseQueryArray(query.coach, parseFlag),
    playing: parseQueryArray(query.playing, parseFlag)
  }
}

export function buildTeamsFilterQuery (f: ITeamsFilters): Record<string, string | undefined> {
  let ratingFrom = f.ratingFrom
  let ratingTo = f.ratingTo
  if (ratingFrom != null && ratingTo != null && ratingFrom > ratingTo) {
    [ratingFrom, ratingTo] = [ratingTo, ratingFrom]
  }

  return {
    status: f.status.length ? f.status.join(',') : undefined,
    ratingFrom: ratingFrom != null ? String(ratingFrom) : undefined,
    ratingTo: ratingTo != null ? String(ratingTo) : undefined,
    roster: f.roster.length ? f.roster.join(',') : undefined,
    coach: f.coach.length ? f.coach.map(Number).join(',') : undefined,
    playing: f.playing.length ? f.playing.map(Number).join(',') : undefined
  }
}

export function countActiveTeamsFilters (f: ITeamsFilters): number {
  let count = 0
  if (f.status.length) count += 1
  if (f.ratingFrom != null || f.ratingTo != null) count += 1
  if (f.roster.length) count += 1
  if (f.coach.length) count += 1
  if (f.playing.length) count += 1
  return count
}

/** Середній рейтинг основи так, як його показує картка: з API або порахований. */
export function getTeamAvgRating (team: TTeam): number | null {
  return team.avgRating ?? computeTeamAvgRatingRounded(team.mainPlayers)
}

export function teamMatchesFilters (team: TTeam, f: ITeamsFilters): boolean {
  if (f.status.length) {
    const statusKey = team.isVerified ? 'approved' : 'applied'
    if (!f.status.includes(statusKey)) return false
  }

  if (f.ratingFrom != null || f.ratingTo != null) {
    const avg = getTeamAvgRating(team)
    if (avg == null) return false
    if (f.ratingFrom != null && avg < f.ratingFrom) return false
    if (f.ratingTo != null && avg > f.ratingTo) return false
  }

  if (f.roster.length) {
    const isFull = (team.mainPlayers?.length ?? 0) >= TEAM_MAIN_SLOTS
    if (!f.roster.includes(isFull ? 'full' : 'open')) return false
  }

  if (f.coach.length && !f.coach.includes(Boolean(team.coach))) return false

  if (f.playing.length && !f.playing.includes(Boolean(team.isPlayingTournament))) return false

  return true
}
