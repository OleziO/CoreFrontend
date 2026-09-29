import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import type {
  TAdminResolveDuelDto,
  TCreateHostBotDto,
  TDuel,
  TDuelLeaderboard,
  TDuelPlayerProfile,
  TDuelRating,
  TDuelState,
  TDuelStatus,
  THostBot,
  TUpdateHostBotDto
} from '@/api/types/api.types'

/**
 * Мережа 1v1 ліги. Запити без тостів — сторінка сама показує стан помилки;
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

  // ─── публічні ─────────────────────────────────────────────────────────────

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
