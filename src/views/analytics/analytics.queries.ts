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
