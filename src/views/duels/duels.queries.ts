import { useQueryWrapper } from '@/core/use-query.utils'
import { duelsService } from '@/views/duels/duels.service'
import type { TDuelBotsStatus, TDuelLeaderboard, TDuelPlayerProfile, TDuelStatus } from '@/api/types/api.types'

export const DUEL_STATUS_QUERY_KEY = ['duels', 'me'] as const
export const DUEL_LEADERBOARD_QUERY_KEY = ['duels', 'leaderboard'] as const
export const DUEL_BOTS_STATUS_QUERY_KEY = ['duels', 'bots'] as const
export const duelPlayerProfileQueryKey = (playerId: string) => ['duels', 'players', playerId] as const

/** Мій статус у дуелях (GET /duels/me). Запит вимкнено без токена — ендпоінт лише для авторизованих. */
export const useGetDuelStatus = (enabled: () => boolean) => {
  return useQueryWrapper<TDuelStatus>({
    key: [...DUEL_STATUS_QUERY_KEY],
    query: () => duelsService.fetchStatus(),
    enabled,
    // Полінг робить composable; фокус вікна теж підтягує свіжий стан.
    refetchOnWindowFocus: true,
    staleTime: 0
  })
}

export const useGetDuelLeaderboard = (enabled: () => boolean = () => true) => {
  return useQueryWrapper<TDuelLeaderboard>({
    key: [...DUEL_LEADERBOARD_QUERY_KEY],
    query: () => duelsService.fetchLeaderboard(),
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 30_000
  })
}

/** Рейтинг + останні 10 дуелей гравця. Запит вимкнено, поки id порожній. */
export const useGetDuelPlayerProfile = (getPlayerId: () => string | null | undefined) => {
  const playerId = computed(() => getPlayerId() || null)

  return useQueryWrapper<TDuelPlayerProfile | null>({
    key: () => [...duelPlayerProfileQueryKey(playerId.value ?? 'none')],
    query: () => duelsService.fetchPlayerProfile(playerId.value as string),
    enabled: () => !!playerId.value,
    refetchOnWindowFocus: false,
    staleTime: 30_000
  }, null)
}

/** Стан пулу ботів (GET /duels/bots/status) — публічний; полінг робить `useDuelBotsStatus`. */
export const useGetDuelBotsStatus = (enabled: () => boolean = () => true) => {
  return useQueryWrapper<TDuelBotsStatus>({
    key: [...DUEL_BOTS_STATUS_QUERY_KEY],
    query: () => duelsService.fetchBotsStatus(),
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 5_000
  })
}
