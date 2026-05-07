import apiClient from '@/api/client'

export const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect'

export type TInviteInfo = {
  teamId: string
  teamName: string
  logoUrl: string | null
  slot: 'main' | 'reserved' | 'coach'
  expiresAt: string
}

export type TCreateInviteResult = {
  token: string
  expiresAt: string
}

class InvitesService {
  async getInviteInfo (token: string): Promise<TInviteInfo> {
    const res = await apiClient.get('/invites/{token}', {
      dynamicKeys: { token }
    })
    return res as TInviteInfo
  }

  async acceptInvite (token: string): Promise<void> {
    await apiClient.post('/invites/{token}/accept', {}, {
      dynamicKeys: { token }
    } as any)
  }

  async createTeamInvite (teamId: string, slot: 'main' | 'reserved' | 'coach'): Promise<TCreateInviteResult> {
    const res = await apiClient.post('/teams/{id}/invites', { slot }, {
      dynamicKeys: { id: teamId }
    } as any)
    return res as TCreateInviteResult
  }
}

export const invitesService = new InvitesService()
