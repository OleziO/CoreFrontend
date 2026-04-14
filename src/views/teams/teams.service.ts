import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import type { TTeam as Team, TCreateTeamDto as CreateTeamDto, TUpdateTeamDto as UpdateTeamDto } from '@/api/types/api.types'

class TeamsService {
  async fetchAllTeams (): Promise<Team[]> {
    try {
      const res = await apiClient.get('/teams')
      return res as Team[]
    } catch (e) {
      ElMessage({ type: 'error' })
      throw e
    }
  }

  async fetchTeam (id: string): Promise<Team | undefined> {
    try {
      const res = await apiClient.get('/teams/{id}', {
        dynamicKeys: { id }
      })
      return res as Team
    } catch (e) {
      ElMessage.error('Помилка')
    }
  }

  async createTeam (data: CreateTeamDto): Promise<Team> {
    const res = await apiClient.post('/teams', data)
    return res as Team
  }

  async updateTeam (id: string, data: UpdateTeamDto): Promise<Team> {
    const res = await apiClient.patch('/teams/{id}', data, {
      dynamicKeys: { id }
    })
    return res as Team
  }

  async dissolveTeam (id: string): Promise<void> {
    try {
      await apiClient.delete('/teams/{id}', {
        dynamicKeys: { id }
      })
      ElMessage({ type: 'success', message: 'Команда успішно розпущена' })
    } catch (e: any) {
      ElMessage({ type: 'error', message: e.response?.data?.detail || 'Помилка' })
    }
  }

  // TODO: endpoint not in API yet
  // async leaveFromTeam () { ... }

  // TODO: endpoint not in API yet
  // async joinToTeam (playerId: number, teamId: number, isMain: boolean) { ... }

  // TODO: endpoint not in API yet
  // async createTeamChats (teamId: number) { ... }

  // TODO: endpoint not in API yet
  // async deleteTeamChats (teamId: number) { ... }

  // TODO: endpoint not in API yet
  // async transferCaptaincy (teamId: number, newCaptainId: number) { ... }

  // TODO: endpoint not in API yet
  // async getTeamInvites (teamId: number) { ... }

  // TODO: endpoint not in API yet
  // async getTeamInviteById (inviteId: number) { ... }

  // TODO: endpoint not in API yet
  // async acceptTeamInvite (inviteId: number) { ... }

  // TODO: endpoint not in API yet
  // async removePlayerFromTeam (teamId: number, playerId: number) { ... }

  // TODO: endpoint not in API yet
  // async rejectTeamInvite (inviteId: number) { ... }

  // TODO: endpoint not in API yet
  // async invitePlayerToTeam (teamId: number, playerId: number, isTeamMain: boolean) { ... }
}

export const teamsService = new TeamsService()
