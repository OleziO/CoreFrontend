import apiClient from '@/api/client'
import type { TChatAdminThread, TChatHistory, TChatPlayer } from '@/api/types/api.types'
import { CHAT_HISTORY_PAGE } from '@/features/chat/chat.utils'

/**
 * REST-частина чату: історія каналів, список тредів підтримки для адмінів і пошук гравців
 * (новий приватний чат, автодоповнення згадок). Без тостів — помилки показує стор.
 */
class ChatService {
  /** Сторінка історії (від старих до нових) і чи є старіші. Гостям доступний лише `general`. */
  async fetchHistory (channel: string, before?: string): Promise<TChatHistory> {
    return await apiClient.get('/chat/messages', {
      params: { channel, limit: CHAT_HISTORY_PAGE, ...(before ? { before } : {}) }
    })
  }

  async fetchAdminThreads (): Promise<TChatAdminThread[]> {
    return await apiClient.get('/chat/admin/threads')
  }

  /** До 10 гравців за частиною імені; `channel` — лише ті, хто бачить цей канал. */
  async searchPlayers (q: string, channel?: string): Promise<TChatPlayer[]> {
    return await apiClient.get('/chat/players', {
      params: { ...(q ? { q } : {}), ...(channel ? { channel } : {}) }
    })
  }
}

export const chatService = new ChatService()
