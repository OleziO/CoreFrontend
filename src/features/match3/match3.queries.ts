import { useQueryWrapper } from '@/core/use-query.utils'
import { match3Service } from '@/features/match3/match3.service'
import { MATCH3_LEADERBOARD_QUERY_KEY } from '@/features/match3/match3.utils'
import type { TMatch3Leaderboard } from '@/api/types/api.types'

/** Таблиця міні-гри. `me` залежить від токена — ключ включає id гравця. */
export const useGetMatch3Leaderboard = (getViewerId: () => string | null | undefined) => {
  return useQueryWrapper<TMatch3Leaderboard | null>({
    key: () => [...MATCH3_LEADERBOARD_QUERY_KEY, getViewerId() ?? 'guest'],
    query: () => match3Service.fetchLeaderboard(),
    refetchOnWindowFocus: false,
    staleTime: 30_000
  }, null)
}
