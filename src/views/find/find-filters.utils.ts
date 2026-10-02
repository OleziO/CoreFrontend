import type { LocationQuery } from 'vue-router'
import type { TTournamentFormat } from '@/api/types/api.types'
import type { IFindPlayersFilters, IFindTeamsFilters, TFindTab } from '@/views/find/find.d'
import { parseQueryArray } from '@/core/helpers'

/**
 * Фільтри обох вкладок живуть у query маршруту (як на сторінках команд / гравців),
 * тож сторінка й модалки читають і пишуть їх через ці функції. Фільтрує бекенд —
 * тут лише розбір query та перетворення у параметри запиту.
 */

export const FIND_TAB_QUERY_KEY = 'tab'
export const FIND_SEARCH_QUERY_KEY = 'search'

export const FIND_TEAMS_FILTER_QUERY_KEYS = ['positions', 'mmr', 'eligible', 'verified', 'formats'] as const
export const FIND_PLAYERS_FILTER_QUERY_KEYS = [
  'ratingFrom', 'ratingTo', 'ranks', 'positions', 'formats', 'lanCities'
] as const

/** Усі ключі фільтрів обох вкладок — при перемиканні вкладки їх скидаємо. */
export const FIND_ALL_FILTER_QUERY_KEYS = [
  ...new Set([...FIND_TEAMS_FILTER_QUERY_KEYS, ...FIND_PLAYERS_FILTER_QUERY_KEYS, FIND_SEARCH_QUERY_KEY])
]

const TOURNAMENT_FORMATS: readonly TTournamentFormat[] = ['ONLINE', 'LAN']

const isTournamentFormat = (v: string): v is TTournamentFormat =>
  (TOURNAMENT_FORMATS as readonly string[]).includes(v)

function toNumberOrNull (value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const parsePositions = (query: LocationQuery) =>
  [...new Set(parseQueryArray(query.positions, Number).filter(n => n >= 1 && n <= 5))]

const parseFormats = (query: LocationQuery) =>
  [...new Set(parseQueryArray(query.formats, v => v.toUpperCase()).filter(isTournamentFormat))]

export function parseFindTab (query: LocationQuery): TFindTab {
  return query[FIND_TAB_QUERY_KEY] === 'players' ? 'players' : 'teams'
}

export function parseFindSearch (query: LocationQuery): string {
  const raw = query[FIND_SEARCH_QUERY_KEY]
  return typeof raw === 'string' ? raw : ''
}

// ─── Команди ────────────────────────────────────────────────────────────────

export function createEmptyFindTeamsFilters (): IFindTeamsFilters {
  return { positions: [], mmr: null, eligible: false, verified: false, formats: [] }
}

export function parseFindTeamsFilters (query: LocationQuery): IFindTeamsFilters {
  return {
    positions: parsePositions(query),
    mmr: toNumberOrNull(query.mmr),
    eligible: query.eligible === '1',
    verified: query.verified === '1',
    formats: parseFormats(query)
  }
}

export function buildFindTeamsFilterQuery (f: IFindTeamsFilters): Record<string, string | undefined> {
  return {
    positions: f.positions.length ? f.positions.join(',') : undefined,
    mmr: f.mmr != null ? String(f.mmr) : undefined,
    eligible: f.eligible ? '1' : undefined,
    verified: f.verified ? '1' : undefined,
    formats: f.formats.length ? f.formats.join(',') : undefined
  }
}

export function countActiveFindTeamsFilters (f: IFindTeamsFilters): number {
  let count = 0
  if (f.positions.length) count += 1
  if (f.mmr != null) count += 1
  if (f.eligible) count += 1
  if (f.verified) count += 1
  if (f.formats.length) count += 1
  return count
}

/** Параметри `GET /recruitment/teams` (масиви — через кому). */
export function toTeamPostsParams (f: IFindTeamsFilters, search: string) {
  const q = search.trim()
  return {
    ...(q ? { search: q } : {}),
    ...(f.positions.length ? { positions: f.positions.join(',') } : {}),
    ...(f.mmr != null ? { mmr: f.mmr } : {}),
    ...(f.eligible ? { eligible: true } : {}),
    ...(f.verified ? { verified: true } : {}),
    ...(f.formats.length ? { formats: f.formats.join(',') } : {})
  }
}

// ─── Гравці ─────────────────────────────────────────────────────────────────

export function createEmptyFindPlayersFilters (): IFindPlayersFilters {
  return { ratingFrom: null, ratingTo: null, ranks: [], positions: [], formats: [], lanCities: [] }
}

export function isFindLanCitiesFilterActive (f: Pick<IFindPlayersFilters, 'formats' | 'lanCities'>): boolean {
  return f.formats.includes('LAN') && f.lanCities.length > 0
}

export function parseFindPlayersFilters (query: LocationQuery): IFindPlayersFilters {
  return {
    ratingFrom: toNumberOrNull(query.ratingFrom),
    ratingTo: toNumberOrNull(query.ratingTo),
    ranks: [...new Set(parseQueryArray(query.ranks, Number).filter(n => n >= 1 && n <= 8))],
    positions: parsePositions(query),
    formats: parseFormats(query),
    lanCities: [...new Set(parseQueryArray(query.lanCities, v => v.trim()).filter(Boolean))]
  }
}

/** Межі рейтингу не зводяться до [a, b] сортуванням — інакше самотнє «до» стало б «від». */
export function buildFindPlayersFilterQuery (f: IFindPlayersFilters): Record<string, string | undefined> {
  let ratingFrom = f.ratingFrom
  let ratingTo = f.ratingTo
  if (ratingFrom != null && ratingTo != null && ratingFrom > ratingTo) {
    [ratingFrom, ratingTo] = [ratingTo, ratingFrom]
  }
  return {
    ratingFrom: ratingFrom != null ? String(ratingFrom) : undefined,
    ratingTo: ratingTo != null ? String(ratingTo) : undefined,
    ranks: f.ranks.length ? f.ranks.join(',') : undefined,
    positions: f.positions.length ? f.positions.join(',') : undefined,
    formats: f.formats.length ? f.formats.join(',') : undefined,
    lanCities: isFindLanCitiesFilterActive(f) ? f.lanCities.join(',') : undefined
  }
}

export function countActiveFindPlayersFilters (f: IFindPlayersFilters): number {
  let count = 0
  if (f.ratingFrom != null || f.ratingTo != null) count += 1
  if (f.ranks.length) count += 1
  if (f.positions.length) count += 1
  if (f.formats.length) count += 1
  if (isFindLanCitiesFilterActive(f)) count += 1
  return count
}

/** Параметри `GET /recruitment/players`. */
export function toPlayerListingsParams (f: IFindPlayersFilters, search: string) {
  const q = search.trim()
  return {
    ...(q ? { search: q } : {}),
    ...(f.ratingFrom != null ? { ratingFrom: f.ratingFrom } : {}),
    ...(f.ratingTo != null ? { ratingTo: f.ratingTo } : {}),
    ...(f.ranks.length ? { ranks: f.ranks.join(',') } : {}),
    ...(f.positions.length ? { positions: f.positions.join(',') } : {}),
    ...(f.formats.length ? { formats: f.formats.join(',') } : {}),
    ...(isFindLanCitiesFilterActive(f) ? { lanCities: f.lanCities.join(',') } : {})
  }
}
