import apiClient from '@/api/client'
import type { TCurrentPlayer } from '@/api/types/api.types'

interface DiscordUrlResponse {
  url: string
}

interface DiscordTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

class AuthService {
  async getDiscordAuthUrl (): Promise<DiscordUrlResponse> {
    return apiClient.get('/auth/discord/url')
  }

  async exchangeDiscordCode (code: string, state: string): Promise<DiscordTokenResponse> {
    return apiClient.post('/auth/discord/token', { code, state })
  }

  async getMe (): Promise<TCurrentPlayer> {
    return apiClient.get('/auth/me')
  }

  async getSteamLinkUrl (): Promise<{ url: string }> {
    return apiClient.get('/auth/steam/link')
  }
}

export const authService = new AuthService()
