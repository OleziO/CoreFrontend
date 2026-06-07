import apiClient from '@/api/client'

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
  async getInviteInfo (token: string) {
    return await apiClient.get('/invites/{token}', {
      dynamicKeys: { token }
    }) as TInviteInfo
  }

  async acceptInvite (token: string) {
    await apiClient.post('/invites/{token}/accept', undefined, {
      dynamicKeys: { token }
    })
  }

  async createTeamInvite (teamId: string, slot: 'main' | 'reserved' | 'coach') {
    return await apiClient.post('/teams/{id}/invites', { slot }, {
      dynamicKeys: { id: teamId }
    }) as TCreateInviteResult
  }
}

export const invitesService = new InvitesService()
