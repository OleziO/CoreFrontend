import apiClient from '@/api/client'
import type { IPublicPricing } from '@/features/legal/legal.d'

/**
 * Публічні ціни й версія юридичних умов. Ендпоінта ще немає в `schema.d.ts`
 * (бек не задеплоєний), тож викликаємо нетипізованим клієнтом, як і інші
 * нові платіжні ендпоінти в `tournaments.service.ts`.
 */
class LegalService {
  async fetchPricing (): Promise<IPublicPricing> {
    const rawGet = apiClient.get as unknown as (url: string) => Promise<unknown>
    return await rawGet('/public/pricing') as IPublicPricing
  }
}

export const legalService = new LegalService()
