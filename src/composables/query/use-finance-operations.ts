import { useQueryWrapper } from '@/core/use-query.utils'
import { financeService } from '@/views/finance-monitor/finance.service'
import type { TFeedView, TOperationsQueryParams } from '@/views/finance-monitor/finance.types'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

export const useFinanceOperations = (params: MaybeRefOrGetter<TOperationsQueryParams> = {}) => {
  return useQueryWrapper<TFeedView>({
    key: () => {
      const value = toValue(params)
      return [
        'finance', 'operations',
        !!value.includeForecast, !!value.showHidden,
        value.from ?? null, value.to ?? null
      ]
    },
    query: () => financeService.fetchOperations(toValue(params)),
    refetchOnWindowFocus: false
  })
}
