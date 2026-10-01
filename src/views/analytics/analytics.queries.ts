import { useQueryWrapper } from '@/core/use-query.utils'
import { analyticsService } from '@/views/analytics/analytics.service'

export const ANALYTICS_OVERVIEW_QUERY_KEY = ['admin', 'analytics', 'overview'] as const

export const useGetAnalyticsOverview = () => {
  return useQueryWrapper({
    key: [...ANALYTICS_OVERVIEW_QUERY_KEY],
    query: () => analyticsService.fetchOverview(),
    refetchOnWindowFocus: false,
    // Живі лічильники соцмереж кешуються на бекенді 10 хв — частіше питати немає сенсу.
    staleTime: 60_000
  })
}

export const ANALYTICS_ACHIEVEMENTS_QUERY_KEY = ['admin', 'analytics', 'achievements'] as const

export const useGetAnalyticsAchievements = () => {
  return useQueryWrapper({
    key: [...ANALYTICS_ACHIEVEMENTS_QUERY_KEY],
    query: () => analyticsService.fetchAchievements(),
    refetchOnWindowFocus: false,
    // Трофеї змінюються лише після результатів матчів / фіналів.
    staleTime: 60_000
  })
}

export const ANALYTICS_INSIGHTS_QUERY_KEY = ['admin', 'analytics', 'insights'] as const

export const useGetAnalyticsInsights = () => {
  return useQueryWrapper({
    key: [...ANALYTICS_INSIGHTS_QUERY_KEY],
    query: () => analyticsService.fetchInsights(),
    refetchOnWindowFocus: false,
    staleTime: 60_000
  })
}
