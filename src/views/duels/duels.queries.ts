import { useQueryWrapper } from '@/core/use-query.utils'
import { duelsService } from '@/views/duels/duels.service'
import type {
  TDuelBotsStatus,
  TDuelLeaderboard,
  TDuelPlayerProfile,
  TDuelSeason,
  TDuelStatus,
  TDuelTournament
} from '@/api/types/api.types'

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

/** Ключі турнірів — під префіксом `duels`, тож `invalidateDuelQueries()` після дуелі освіжає й таблиці турнірів. */
export const DUEL_TOURNAMENTS_QUERY_KEY = ['duels', 'tournaments'] as const
export const duelTournamentQueryKey = (id: string) => ['duels', 'tournaments', id] as const
export const duelTournamentLeaderboardQueryKey = (id: string) => ['duels', 'tournaments', id, 'leaderboard'] as const

/** Список турнірів (активні першими). `joined` / `canManage` залежать від токена — ключ включає id гравця. */
export const useGetDuelTournaments = (getViewerId: () => string | null | undefined) => {
  return useQueryWrapper<TDuelTournament[]>({
    key: () => [...DUEL_TOURNAMENTS_QUERY_KEY, 'list', getViewerId() ?? 'guest'],
    query: () => duelsService.fetchTournaments(),
    refetchOnWindowFocus: true,
    staleTime: 15_000
  }, [])
}

export const useGetDuelTournament = (getId: () => string, getViewerId: () => string | null | undefined) => {
  return useQueryWrapper<TDuelTournament | null>({
    key: () => [...duelTournamentQueryKey(getId()), getViewerId() ?? 'guest'],
    query: () => duelsService.fetchTournament(getId()),
    enabled: () => !!getId(),
    refetchOnWindowFocus: true,
    staleTime: 15_000
  }, null)
}

export const useGetDuelTournamentLeaderboard = (getId: () => string) => {
  return useQueryWrapper<TDuelLeaderboard | null>({
    key: () => [...duelTournamentLeaderboardQueryKey(getId())],
    query: () => duelsService.fetchTournamentLeaderboard(getId()),
    enabled: () => !!getId(),
    refetchOnWindowFocus: true,
    staleTime: 15_000
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

/** Ключі сезонів — під префіксом `duels`, тож `invalidateDuelQueries()` освіжає й їх. */
export const DUEL_SEASONS_QUERY_KEY = ['duels', 'seasons'] as const
export const DUEL_CURRENT_SEASON_QUERY_KEY = ['duels', 'seasons', 'current'] as const
export const duelSeasonLeaderboardQueryKey = (id: string) => ['duels', 'seasons', id, 'leaderboard'] as const

/** Усі сезони (новіші першими) — для вибору сезону в таблиці та адмінки. */
export const useGetDuelSeasons = (enabled: () => boolean = () => true) => {
  return useQueryWrapper<TDuelSeason[]>({
    key: [...DUEL_SEASONS_QUERY_KEY, 'list'],
    query: () => duelsService.fetchSeasons(),
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 60_000
  }, [])
}

/** Поточний сезон: номер, межі, призи. Оновлюється з фокусом — щоб «підбиваємо підсумки» зникло саме. */
export const useGetDuelCurrentSeason = () => {
  return useQueryWrapper<TDuelSeason | null>({
    key: [...DUEL_CURRENT_SEASON_QUERY_KEY],
    query: () => duelsService.fetchCurrentSeason(),
    refetchOnWindowFocus: true,
    staleTime: 60_000
  }, null)
}

/** Таблиця сезону. Запит вимкнено, поки id порожній. */
export const useGetDuelSeasonLeaderboard = (getId: () => string | null | undefined) => {
  return useQueryWrapper<TDuelLeaderboard | null>({
    key: () => [...duelSeasonLeaderboardQueryKey(getId() ?? 'none')],
    query: () => duelsService.fetchSeasonLeaderboard(getId() as string),
    enabled: () => !!getId(),
    refetchOnWindowFocus: false,
    staleTime: 30_000
  }, null)
}
