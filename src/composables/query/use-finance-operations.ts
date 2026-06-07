import { useQueryWrapper } from '@/core/use-query.utils'
import { financeService } from '@/views/finance-monitor/finance.service'
import type { TFeedView, TOperationsQueryParams } from '@/views/finance-monitor/finance.types'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

export const useFinanceOperations = (params: MaybeRefOrGetter<TOperationsQueryParams> = {}) => {
  return useQueryWrapper<TFeedView>({
    key: () => {
      const value = toValue(params)
      return ['finance', 'operations', value.includeForecast, value.from, value.to]
    },
    query: () => financeService.fetchOperations(toValue(params)),
    refetchOnWindowFocus: false
  })
}
