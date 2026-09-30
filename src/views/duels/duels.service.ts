import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import type {
  TAdminResolveDuelDto,
  TCreateHostBotDto,
  TDuel,
  TDuelBotsStatus,
  TDuelLeaderboard,
  TDuelPlayerProfile,
  TDuelRating,
  TDuelState,
  TDuelStatus,
  THostBot,
  TUpdateHostBotDto
} from '@/api/types/api.types'

/**
 * Мережа ліги дуелей. Запити без тостів — сторінка сама показує стан помилки;
 * мутації показують тост з повідомленням бекенду і прокидають помилку далі.
 */
class DuelsService {
  // ─── гравець ──────────────────────────────────────────────────────────────

  /** Мій статус: рейтинг, черга, активна дуель, остання завершена. Заодно heartbeat черги. */
  async fetchStatus (): Promise<TDuelStatus> {
    return await apiClient.get('/duels/me')
  }

  async joinQueue (): Promise<TDuelStatus> {
    try {
      return await apiClient.post('/duels/queue')
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося стати в чергу'))
      throw e
    }
  }

  async leaveQueue (): Promise<TDuelStatus> {
    try {
      return await apiClient.delete('/duels/queue')
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося вийти з черги'))
      throw e
    }
  }

  /** Прийняти знайдений матч (стан ACCEPTING). */
  async acceptDuel (id: string): Promise<TDuelStatus> {
    try {
      return await apiClient.post('/duels/{id}/accept', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося прийняти матч'))
      throw e
    }
  }

  /** Скасувати свою дуель до старту гри: −10 рейтингу, суперник повертається в чергу. */
  async cancelDuel (id: string): Promise<TDuelStatus> {
    try {
      return await apiClient.post('/duels/{id}/cancel', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося скасувати дуель'))
      throw e
    }
  }

  // ─── публічні ─────────────────────────────────────────────────────────────

  /** Стан пулу ботів-хостів: скільки онлайн, вільних, зайнятих. */
  async fetchBotsStatus (): Promise<TDuelBotsStatus> {
    return await apiClient.get('/duels/bots/status')
  }

  async fetchLeaderboard (): Promise<TDuelLeaderboard> {
    return await apiClient.get('/duels/leaderboard')
  }

  /** Рейтинг + останні 10 дуелей гравця. `rating` — null, поки гравець не ставав у чергу. */
  async fetchPlayerProfile (id: string): Promise<TDuelPlayerProfile> {
    return await apiClient.get('/duels/players/{id}', { dynamicKeys: { id } })
  }

  async fetchDuel (id: string): Promise<TDuel> {
    return await apiClient.get('/duels/{id}', { dynamicKeys: { id } })
  }

  // ─── адмін ────────────────────────────────────────────────────────────────

  async adminListDuels (state?: TDuelState, limit = 50): Promise<TDuel[]> {
    return await apiClient.get('/admin/duels', { params: { state, limit } })
  }

  async adminCancelDuel (id: string): Promise<TDuel> {
    try {
      return await apiClient.post('/admin/duels/{id}/cancel', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося скасувати дуель'))
      throw e
    }
  }

  /** Підтягнути результат FAILED-дуелі з Steam Web API за match id. */
  async adminRecoverDuel (id: string): Promise<TDuel> {
    try {
      return await apiClient.post('/admin/duels/{id}/recover', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося отримати результат від Valve'))
      throw e
    }
  }

  /** `winnerId` — кому зарахувати перемогу (±25); null — анулювати без зміни рейтингу. */
  async adminResolveDuel (id: string, winnerId: string | null): Promise<TDuel> {
    const body: TAdminResolveDuelDto = { winnerId }
    try {
      return await apiClient.post('/admin/duels/{id}/resolve', body, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося вирішити дуель'))
      throw e
    }
  }

  async adminListBots (): Promise<THostBot[]> {
    return await apiClient.get('/admin/duels/bots')
  }

  async adminCreateBot (dto: TCreateHostBotDto): Promise<THostBot> {
    try {
      return await apiClient.post('/admin/duels/bots', dto)
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося додати бота'))
      throw e
    }
  }

  /** Перезапустити всіх увімкнених ботів (воркер перелогінить їх протягом ~30 с). Повертає кількість. */
  async adminReloadBots (): Promise<number> {
    try {
      return await apiClient.post('/admin/duels/bots/reload')
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося перезапустити ботів'))
      throw e
    }
  }

  async adminReloadBot (id: number): Promise<number> {
    try {
      return await apiClient.post('/admin/duels/bots/{id}/reload', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося перезапустити бота'))
      throw e
    }
  }

  async adminUpdateBot (id: number, dto: TUpdateHostBotDto): Promise<THostBot> {
    try {
      return await apiClient.patch('/admin/duels/bots/{id}', dto, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити бота'))
      throw e
    }
  }

  async adminRemoveBot (id: number): Promise<void> {
    try {
      await apiClient.delete('/admin/duels/bots/{id}', { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося видалити бота'))
      throw e
    }
  }

  async adminSetRating (playerId: string, rating: number): Promise<TDuelRating> {
    try {
      return await apiClient.patch('/admin/duels/players/{id}/rating', { rating }, { dynamicKeys: { id: playerId } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося змінити рейтинг'))
      throw e
    }
  }
}

export const duelsService = new DuelsService()
