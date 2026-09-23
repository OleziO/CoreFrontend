import type { LocationQuery } from 'vue-router'
import type { IFilterChipOption } from '@/components/filters/filters.d'
import { ERole } from '@/types/general.enums'
import {
  getPlayerDotaPositions,
  isPlayerVerified,
  parseQueryArray,
  playerMatchesRoleFilterToken,
  resolvePlayerRankNumericName
} from '@/core/helpers'

/**
 * Фільтри списку гравців. Живуть у query маршруту, тому і сторінка, і модалка
 * читають / пишуть їх через ці функції — одна логіка збігу для обох.
 */
export interface IPlayersFilters {
  ratingFrom: number | null
  ratingTo: number | null
  /** Тир медалі 1–8 (Herald … Immortal). */
  ranks: number[]
  positions: number[]
  roles: string[]
  /** `true` — у команді, `false` — вільний. */
  teamStatus: boolean[]
  /** `ERole.PLAYER` — верифікований, `ERole.GUEST` — ні. */
  verificationStatus: string[]
  /** `true` — Steam привʼязано. */
  steam: boolean[]
}

export const PLAYERS_FILTER_QUERY_KEYS = [
  'ratingFrom', 'ratingTo', 'ranks', 'positions', 'roles', 'teamStatus', 'verificationStatus', 'steam'
] as const

/** Медальні тири Dota 2; `numericName` рангу = тир × 10 + зірки. */
export const RANK_TIER_OPTIONS: readonly IFilterChipOption<number>[] = [
  { value: 1, label: 'Herald' },
  { value: 2, label: 'Guardian' },
  { value: 3, label: 'Crusader' },
  { value: 4, label: 'Archon' },
  { value: 5, label: 'Legend' },
  { value: 6, label: 'Ancient' },
  { value: 7, label: 'Divine' },
  { value: 8, label: 'Immortal' }
]

export const STEAM_LINK_OPTIONS: readonly IFilterChipOption<boolean>[] = [
  { value: true, label: 'Steam привʼязано' },
  { value: false, label: 'Без Steam' }
]

export function createEmptyPlayersFilters (): IPlayersFilters {
  return {
    ratingFrom: null,
    ratingTo: null,
    ranks: [],
    positions: [],
    roles: [],
    teamStatus: [],
    verificationStatus: [],
    steam: []
  }
}

function toNumberOrNull (value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const parseFlag = (v: string) => Boolean(Number(v))

export function parsePlayersFilters (query: LocationQuery): IPlayersFilters {
  return {
    ratingFrom: toNumberOrNull(query.ratingFrom),
    ratingTo: toNumberOrNull(query.ratingTo),
    ranks: parseQueryArray(query.ranks, Number).filter(n => n >= 1 && n <= 8),
    positions: parseQueryArray(query.positions, Number).filter(n => n >= 1 && n <= 5),
    roles: parseQueryArray(query.roles),
    teamStatus: parseQueryArray(query.teamStatus, parseFlag),
    verificationStatus: parseQueryArray(query.verificationStatus),
    steam: parseQueryArray(query.steam, parseFlag)
  }
}

/**
 * Query-патч для `replaceQueryKeys`. Межі рейтингу не зводяться до sorted [a, b]:
 * інакше самотнє «до» опинилось би у `ratingFrom`.
 */
export function buildPlayersFilterQuery (f: IPlayersFilters): Record<string, string | undefined> {
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
    roles: f.roles.length ? f.roles.join(',') : undefined,
    teamStatus: f.teamStatus.length ? f.teamStatus.map(Number).join(',') : undefined,
    verificationStatus: f.verificationStatus.length ? f.verificationStatus.join(',') : undefined,
    steam: f.steam.length ? f.steam.map(Number).join(',') : undefined
  }
}

/** Скільки секцій фільтра заповнено — для бейджа на кнопці та лічильника в модалці. */
export function countActivePlayersFilters (f: IPlayersFilters): number {
  let count = 0
  if (f.ratingFrom != null || f.ratingTo != null) count += 1
  if (f.ranks.length) count += 1
  if (f.positions.length) count += 1
  if (f.roles.length) count += 1
  if (f.teamStatus.length) count += 1
  if (f.verificationStatus.length) count += 1
  if (f.steam.length) count += 1
  return count
}

export function playerMatchesFilters (
  player: TPlayer,
  f: IPlayersFilters,
  rolesCatalog?: readonly { id: string; name: string }[]
): boolean {
  const rating = player.rating ?? 0
  if (f.ratingFrom != null && rating < f.ratingFrom) return false
  if (f.ratingTo != null && rating > f.ratingTo) return false

  if (f.ranks.length) {
    const numericName = resolvePlayerRankNumericName(player.rank)
    const tier = numericName == null ? 0 : Math.floor(numericName / 10)
    if (!f.ranks.includes(tier)) return false
  }

  if (f.positions.length) {
    const have = new Set(getPlayerDotaPositions(player))
    if (!f.positions.some(p => have.has(p))) return false
  }

  if (f.roles.length && !f.roles.some(t => playerMatchesRoleFilterToken(player, t, rolesCatalog))) return false

  if (f.teamStatus.length && !f.teamStatus.includes(Boolean(player.teamId))) return false

  if (f.verificationStatus.length) {
    const verified = isPlayerVerified(player)
    const ok = f.verificationStatus.some(s => (s === ERole.PLAYER ? verified : s === ERole.GUEST ? !verified : false))
    if (!ok) return false
  }

  if (f.steam.length && !f.steam.includes(Boolean(player.steamId))) return false

  return true
}
