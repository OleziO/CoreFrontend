import apiClient from '@/api/client'

interface DiscordUrlResponse {
  url: string
}

interface DiscordTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

interface MeResponse {
  playerId: string
}

class AuthService {
  async getDiscordAuthUrl (): Promise<DiscordUrlResponse> {
    return apiClient.get('/auth/discord/url')
  }

  async exchangeDiscordCode (code: string, state: string): Promise<DiscordTokenResponse> {
    return apiClient.post('/auth/discord/token', { code, state })
  }

  async getMe (): Promise<MeResponse> {
    return apiClient.get('/auth/me')
  }
}

export const authService = new AuthService()
