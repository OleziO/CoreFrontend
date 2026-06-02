import { coercePlayerRankFromApi } from '@/core/helpers'

/** Гравець у рості з відповіді команди. */
type TRosterPlayer = TTeam['mainPlayers'][number]

/** Швидке клонування топ-рівня ростеру для безпечного злиття без мутацій вихідного `team`. */
export function shallowSnapshotTeamForHydrate (t: TTeam): TTeam {
  return {
    ...t,
    mainPlayers: [...(t.mainPlayers ?? [])],
    reservedPlayers: [...(t.reservedPlayers ?? [])]
  }
}

function mergePlayerRankFromPayload (p: TRosterPlayer): TRosterPlayer {
  const rank = coercePlayerRankFromApi(p.rank)
  if (rank == null) return { ...p }
  return { ...p, rank }
}

/**
 * Нормалізує `rank` у гравцях ростеру з відповіді команди (без GET /players на кожного).
 */
export function hydrateTeamPlayersRanks (t: TTeam): TTeam {
  return {
    ...t,
    mainPlayers: (t.mainPlayers ?? []).map(mergePlayerRankFromPayload),
    reservedPlayers: (t.reservedPlayers ?? []).map(mergePlayerRankFromPayload)
  }
}
