import apiClient from '@/api/client'

class AuthService {
  async updatePlayerData (mmr: number | undefined, positions: number[] | undefined) {
    try {
      const res = await apiClient.patch('/api/v1/players/me/game-data', { mmr, positions }) // Приходят старые данные ммр в запросе
      console.log(res)
      return res
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  async createMmrRequest (formData: globalThis.FormData) {
    try {
      const res = await apiClient.post('/api/v1/requests/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return res
    } catch (e) {
      console.log(e)
      throw e
    }
  }
}

export const authService = new AuthService()
