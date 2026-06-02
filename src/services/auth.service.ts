import apiClient from '@/api/client'

const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect'

class AuthService {
  async getDiscordAuthUrl () {
    return apiClient.get('/auth/discord/url')
  }

  async exchangeDiscordCode (code: string, state: string): Promise<{ access_token: string }> {
    // OpenAPI schema omits the response body for this endpoint (content?: never),
    // but the real API returns { access_token }. Cast is unavoidable until the schema is fixed.
    return apiClient.post('/auth/discord/token', { code, state }) as Promise<{ access_token: string }>
  }

  async getMe () {
    return apiClient.get('/auth/me')
  }

  async getSteamLinkUrl () {
    return apiClient.get('/auth/steam/link')
  }

  savePostLoginRedirect (path: string) {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path)
  }

  consumePostLoginRedirect (): string | null {
    const redirect = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
    return redirect
  }
}

export const authService = new AuthService()
