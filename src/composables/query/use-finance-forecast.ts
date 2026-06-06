import { useQueryWrapper } from '@/core/use-query.utils'
import { queryCache } from '@/core/query-cache-client'
import { financeService } from '@/views/finance-monitor/finance.service'
import type { ForecastConfig, ForecastResponse } from '@/views/finance-monitor/finance.types'
import { ref } from 'vue'

export const useFinanceForecast = () => {
  const isSaving = ref(false)

  const query = useQueryWrapper<ForecastResponse>({
    key: ['finance', 'forecast'],
    query: () => financeService.fetchForecast(),
    refetchOnWindowFocus: false
  })

  const saveForecast = async (config: ForecastConfig) => {
    isSaving.value = true
    try {
      const result = await financeService.updateForecast(config)
      queryCache.setQueryData(['finance', 'forecast'], result)
      queryCache.invalidateQueries({ key: ['finance', 'balance'] })
      queryCache.invalidateQueries({ key: ['finance', 'operations'] })
      return result
    } finally {
      isSaving.value = false
    }
  }

  return {
    ...query,
    isSaving,
    saveForecast
  }
}
