import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import type { TMatch as Match, TCreateMatchDto as CreateMatchDto, TUpdateMatchDto as UpdateMatchDto } from '@/api/types/api.types'

class MatchesService {
  async fetchMatches (): Promise<Match[]> {
    try {
      const res = await apiClient.get('/matches')
      return res as Match[]
    } catch (e) {
      ElMessage.error('Не вдалося завантажити матчі')
      throw e
    }
  }

  async fetchMatch (id: string): Promise<Match> {
    const res = await apiClient.get('/matches/{id}', {
      dynamicKeys: { id }
    })
    return res as Match
  }

  async createMatch (data: CreateMatchDto): Promise<Match> {
    const res = await apiClient.post('/matches', data)
    return res as Match
  }

  async updateMatch (id: string, data: UpdateMatchDto): Promise<Match> {
    const res = await apiClient.patch('/matches/{id}', data, {
      dynamicKeys: { id }
    })
    return res as Match
  }

  async deleteMatch (id: string): Promise<void> {
    await apiClient.delete('/matches/{id}', {
      dynamicKeys: { id }
    })
  }
}

export const matchesService = new MatchesService()
