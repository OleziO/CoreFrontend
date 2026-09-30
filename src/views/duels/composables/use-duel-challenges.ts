import { useQueryCache } from '@pinia/colada'
import { DUEL_BOTS_STATUS_QUERY_KEY, DUEL_STATUS_QUERY_KEY } from '@/views/duels/duels.queries'
import { duelsService } from '@/views/duels/duels.service'
import type { TDuelStatus } from '@/api/types/api.types'

/**
 * Дії над викликами на дружню дуель. Працює з будь-якого місця (сторінка друзів,
 * картка гравця, дзвіночок): відповідь бекенду — повний статус дуелей — кладемо
 * в кеш запиту, тож відкрита сторінка /duels оновлюється без перезапиту.
 */
export const useDuelChallenges = () => {
  const queryCache = useQueryCache()
  const busyIds = ref(new Set<string>())

  function applyStatus (next: TDuelStatus) {
    queryCache.setQueryData([...DUEL_STATUS_QUERY_KEY], next)
    queryCache.setQueryData([...DUEL_BOTS_STATUS_QUERY_KEY], next.bots)
  }

  function isBusy (id: string): boolean {
    return busyIds.value.has(id)
  }

  async function run (busyKey: string, action: () => Promise<TDuelStatus>): Promise<boolean> {
    if (busyIds.value.has(busyKey)) return false
    busyIds.value.add(busyKey)
    try {
      applyStatus(await action())
      return true
    } catch {
      return false
    } finally {
      busyIds.value.delete(busyKey)
    }
  }

  /** Викликати друга (ключ зайнятості — id гравця). */
  const challenge = (playerId: string) => run(playerId, () => duelsService.createChallenge(playerId))
  /** Прийняти / відхилити / відкликати виклик (ключ зайнятості — id виклику). */
  const accept = (id: string) => run(id, () => duelsService.acceptChallenge(id))
  const decline = (id: string) => run(id, () => duelsService.declineChallenge(id))
  const cancel = (id: string) => run(id, () => duelsService.cancelChallenge(id))

  return { isBusy, challenge, accept, decline, cancel }
}
