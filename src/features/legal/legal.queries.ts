import { useQueryWrapper } from '@/core/use-query.utils'
import { legalService } from '@/features/legal/legal.service'
import type { IPublicPricing } from '@/features/legal/legal.d'

export const PUBLIC_PRICING_QUERY_KEY = ['public-pricing'] as const

/**
 * `GET /public/pricing` з кешем Pinia Colada: VIP-вікно, панель турніру й
 * підтримка ліги ділять один запит. Версія умов міняється рідко — 5 хв свіжості.
 */
export const usePublicPricingQuery = () => {
  return useQueryWrapper<IPublicPricing | null>({
    key: [...PUBLIC_PRICING_QUERY_KEY],
    query: () => legalService.fetchPricing(),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false
  }, null)
}
