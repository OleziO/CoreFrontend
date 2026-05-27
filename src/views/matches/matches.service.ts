import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import type { TCreateMatchDto as CreateMatchDto, TUpdateMatchDto as UpdateMatchDto } from '@/api/types/api.types'

class MatchesService {
  async fetchMatches () {
    try {
      return await apiClient.get('/matches')
    } catch (e) {
      ElMessage.error('Не вдалося завантажити матчі')
      throw e
    }
  }

  async fetchMatch (id: string) {
    return await apiClient.get('/matches/{id}', {
      dynamicKeys: { id }
    })
  }

  async createMatch (data: CreateMatchDto) {
    return await apiClient.post('/matches', data)
  }

  async updateMatch (id: string, data: UpdateMatchDto) {
    return await apiClient.patch('/matches/{id}', data, {
      dynamicKeys: { id }
    })
  }

  async deleteMatch (id: string) {
    await apiClient.delete('/matches/{id}', {
      dynamicKeys: { id }
    })
  }
}

export const matchesService = new MatchesService()
