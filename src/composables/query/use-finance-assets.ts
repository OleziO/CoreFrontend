import { useQueryWrapper } from '@/core/use-query.utils'
import { financeService } from '@/views/finance-monitor/finance.service'
import type { TAssetView } from '@/views/finance-monitor/finance.types'

export const useFinanceAssets = () => {
  return useQueryWrapper<TAssetView[]>({
    key: ['finance', 'assets'],
    query: () => financeService.fetchAssets(),
    refetchOnWindowFocus: false
  })
}
