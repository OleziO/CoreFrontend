import { useQueryWrapper } from '@/core/use-query.utils'
import { leaderboardService } from '@/views/leaderboard/leaderboard.service'

export const LEADERBOARD_QUERY_KEY = ['leaderboard'] as const

export const useGetLeaderboard = () => {
  return useQueryWrapper({
    key: [...LEADERBOARD_QUERY_KEY],
    query: () => leaderboardService.fetchLeaderboard(),
    refetchOnWindowFocus: false,
    // Бекенд перебудовує дошку не частіше ніж раз на хвилину.
    staleTime: 60_000
  })
}
