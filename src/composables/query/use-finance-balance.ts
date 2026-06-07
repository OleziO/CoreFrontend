import { useQueryWrapper } from '@/core/use-query.utils'
import { financeService } from '@/views/finance-monitor/finance.service'
import type { TBalance } from '@/views/finance-monitor/finance.types'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

export const useFinanceBalance = (includeForecast: MaybeRefOrGetter<boolean> = false) => {
  return useQueryWrapper<TBalance>({
    key: () => ['finance', 'balance', toValue(includeForecast)],
    query: () => financeService.fetchBalance(toValue(includeForecast)),
    refetchOnWindowFocus: false
  })
}
