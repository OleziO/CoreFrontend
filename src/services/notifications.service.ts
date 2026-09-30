import apiClient from '@/api/client'
import type { TMarkNotificationsReadDto, TNotificationsSnapshot } from '@/api/types/api.types'

/**
 * Мережа центру сповіщень (дзвіночок у хедері). Без тостів: дзвіночок сам
 * показує стан, а помилки читання тихі — наступний пуш сокета все одно принесе знімок.
 */
class NotificationsService {
  /** Останні 30 сповіщень + лічильник непрочитаних. */
  async fetchSnapshot (): Promise<TNotificationsSnapshot> {
    return await apiClient.get('/notifications')
  }

  /** Позначити прочитаними: конкретні або всі непрочитані, коли `ids` порожній. */
  async markRead (ids?: string[]): Promise<TNotificationsSnapshot> {
    const body: TMarkNotificationsReadDto = ids?.length ? { ids } : {}
    return await apiClient.post('/notifications/read', body)
  }
}

export const notificationsService = new NotificationsService()
