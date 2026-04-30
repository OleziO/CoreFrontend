import apiClient from '@/api/client'
import type { TTeam as Team, TPlayer } from '@/api/types/api.types'

/** Швидке клонування топ-рівня ростеру для безпечного злиття без мутацій вихідного `team`. */
export function shallowSnapshotTeamForHydrate (t: Team): Team {
  return {
    ...t,
    mainPlayers: [...(t.mainPlayers ?? [])],
    reservedPlayers: [...(t.reservedPlayers ?? [])]
  }
}

/**
 * У відповіді GET /teams гравці — схема `Player` без `rank`; тягнемо GET /players/:id і зливаємо, як на сторінці команди.
 */
export async function hydrateTeamPlayersRanks (t: Team): Promise<Team> {
  const main = t.mainPlayers ?? []
  const reserved = t.reservedPlayers ?? []
  const ids = [...new Set([...main, ...reserved].map(p => p.id))]
  if (ids.length === 0) return t

  const loaded = await Promise.all(
    ids.map(async pid => {
      try {
        return (await apiClient.get('/players/{id}', {
          dynamicKeys: { id: pid }
        })) as unknown as TPlayer
      } catch {
        return null
      }
    })
  )
  const byId = new Map(loaded.filter(Boolean).map(p => [p!.id, p!]))

  const mergeList = (list: TPlayer[] | undefined) =>
    (list ?? []).map(p => {
      const full = byId.get(p.id)
      return (full ? { ...p, ...full } : p) as TPlayer
    })

  return {
    ...t,
    mainPlayers: mergeList(t.mainPlayers) as Team['mainPlayers'],
    reservedPlayers: mergeList(t.reservedPlayers) as Team['reservedPlayers']
  }
}
