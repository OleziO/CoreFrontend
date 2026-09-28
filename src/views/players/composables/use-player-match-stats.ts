import { useQueryWrapper } from '@/core/use-query.utils'
import { playersService } from '@/views/players/players.service'
import type { TPlayerMatchStats } from '@/api/types/api.types'

/** Результати матчів змінюються лише після подачі результату — свіжість у кілька хвилин достатня. */
const MATCH_STATS_TTL = 2 * 60 * 1000

/**
 * Статистика матчів гравця у турнірах платформи (GET /players/:id/match-stats).
 * `getPlayerId` — гетер id; запит вимкнено, поки id порожній.
 */
export const usePlayerMatchStats = (getPlayerId: () => string | null | undefined) => {
  const playerId = computed(() => getPlayerId() || null)

  const query = useQueryWrapper<TPlayerMatchStats | null>({
    key: () => ['players', 'match-stats', playerId.value ?? 'none'],
    query: () => playersService.fetchPlayerMatchStats(playerId.value as string),
    enabled: () => !!playerId.value,
    refetchOnWindowFocus: false,
    staleTime: MATCH_STATS_TTL
  }, null)

  const stats = computed<TPlayerMatchStats | null>(() => query.data.value ?? null)
  const isPending = computed(() => !!playerId.value && query.isPending.value)
  const isError = computed(() => !!playerId.value && !!query.error.value)

  return { stats, isPending, isError }
}
