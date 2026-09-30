import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import type { TCreateFriendRequestDto, TFriendsOverview } from '@/api/types/api.types'

/**
 * Мережа друзів. Читання без тостів — сторінка сама показує стан помилки;
 * мутації показують тост із повідомленням бекенду і прокидають помилку далі.
 * Кожна мутація повертає свіжий огляд (друзі + запити), яким стор замінює свій стан.
 */
class FriendsService {
  async fetchOverview (): Promise<TFriendsOverview> {
    return await apiClient.get('/friends')
  }

  async sendRequest (playerId: string): Promise<TFriendsOverview> {
    const body: TCreateFriendRequestDto = { playerId }
    try {
      const overview = await apiClient.post('/friends/requests', body)
      ElMessage.success('Запит у друзі надіслано')
      return overview
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося надіслати запит у друзі'))
      throw e
    }
  }

  async acceptRequest (id: string): Promise<TFriendsOverview> {
    try {
      const overview = await apiClient.post('/friends/requests/{id}/accept', undefined, { dynamicKeys: { id } })
      ElMessage.success('Тепер ви друзі')
      return overview
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося прийняти запит'))
      throw e
    }
  }

  async declineRequest (id: string): Promise<TFriendsOverview> {
    try {
      return await apiClient.post('/friends/requests/{id}/decline', undefined, { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося відхилити запит'))
      throw e
    }
  }

  /** Відкликати свій надісланий запит. */
  async cancelRequest (id: string): Promise<TFriendsOverview> {
    try {
      return await apiClient.delete('/friends/requests/{id}', { dynamicKeys: { id } })
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося скасувати запит'))
      throw e
    }
  }

  async removeFriend (playerId: string): Promise<TFriendsOverview> {
    try {
      const overview = await apiClient.delete('/friends/{playerId}', { dynamicKeys: { playerId } })
      ElMessage.success('Гравця видалено з друзів')
      return overview
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося видалити з друзів'))
      throw e
    }
  }
}

export const friendsService = new FriendsService()
