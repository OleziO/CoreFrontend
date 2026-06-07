import { useQueryWrapper } from '@/core/use-query.utils'
import { financeService } from '@/views/finance-monitor/finance.service'
import type { TCustomCategoryView } from '@/views/finance-monitor/finance.types'

export const useFinanceCategories = () => {
  return useQueryWrapper<TCustomCategoryView[]>({
    key: ['finance', 'categories'],
    query: () => financeService.fetchCustomCategories(),
    refetchOnWindowFocus: false
  })
}
