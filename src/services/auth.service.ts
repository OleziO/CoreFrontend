import apiClient from '@/api/client'

class AuthService {
  async getDiscordAuthUrl () {
    return apiClient.get('/auth/discord/url')
  }

  async exchangeDiscordCode (code: string, state: string): Promise<{ access_token: string }> {
    return apiClient.post('/auth/discord/token', { code, state }) as unknown as Promise<{ access_token: string }>
  }

  async getMe () {
    return apiClient.get('/auth/me')
  }

  async getSteamLinkUrl () {
    return apiClient.get('/auth/steam/link')
  }
}

export const authService = new AuthService()
