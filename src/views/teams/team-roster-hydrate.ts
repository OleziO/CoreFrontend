import type { TTeam as Team, TPlayer } from '@/api/types/api.types'
import { coercePlayerRankFromApi } from '@/core/helpers'

/** Швидке клонування топ-рівня ростеру для безпечного злиття без мутацій вихідного `team`. */
export function shallowSnapshotTeamForHydrate (t: Team): Team {
  return {
    ...t,
    mainPlayers: [...(t.mainPlayers ?? [])],
    reservedPlayers: [...(t.reservedPlayers ?? [])]
  }
}

function mergePlayerRankFromPayload (p: TPlayer): TPlayer {
  const rank = coercePlayerRankFromApi(p.rank)
  if (rank == null) return { ...p }
  return { ...p, rank }
}

/**
 * Нормалізує `rank` у гравцях ростеру з відповіді команди (без GET /players на кожного).
 */
export function hydrateTeamPlayersRanks (t: Team): Team {
  return {
    ...t,
    mainPlayers: (t.mainPlayers ?? []).map(mergePlayerRankFromPayload) as Team['mainPlayers'],
    reservedPlayers: (t.reservedPlayers ?? []).map(mergePlayerRankFromPayload) as Team['reservedPlayers']
  }
}
