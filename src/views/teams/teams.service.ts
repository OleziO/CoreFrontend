import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import type { TTeam as Team, TCreateTeamDto as CreateTeamDto, TUpdateTeamDto as UpdateTeamDto } from '@/api/types/api.types'

import { postTeamLogoUpload } from '@/services/image-upload.service'

export type TCreateTeamPayload = CreateTeamDto & { logoFile?: File | null }
export type TUpdateTeamPayload = UpdateTeamDto & { logoFile?: File | null }

function teamEntries (dto: Partial<UpdateTeamDto>): Partial<UpdateTeamDto> {
  return Object.fromEntries(
    Object.entries(dto).filter(([, v]) => v !== undefined)
  ) as Partial<UpdateTeamDto>
}

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

  async fetchTeam (id: string): Promise<Team> {
    try {
      const res = await apiClient.get('/teams/{id}', {
        dynamicKeys: { id }
      })
      return res as Team
    } catch (e) {
      ElMessage.error('Помилка')
      throw e
    }
  }

  /** POST /teams (name, dotaTeamId), потім за наявності файлу — POST /teams/:id/logo, GET для актуального стану. */
  async createTeam (data: TCreateTeamPayload): Promise<Team> {
    const { logoFile, ...dto } = data
    const team = await apiClient.post('/teams', dto) as Team

    if (!logoFile) return team

    await postTeamLogoUpload(team.id, logoFile)
    return await this.fetchTeam(team.id)
  }

  async updateTeam (id: string, data: TUpdateTeamPayload): Promise<Team> {
    const { logoFile, ...rest } = data
    const patchPayload = teamEntries(rest)

    if (Object.keys(patchPayload).length) {
      await apiClient.patch('/teams/{id}', patchPayload, {
        dynamicKeys: { id }
      })
    }

    if (logoFile) {
      await postTeamLogoUpload(id, logoFile)
    }

    return await this.fetchTeam(id)
  }

  async dissolveTeam (id: string): Promise<void> {
    try {
      await apiClient.delete('/teams/{id}', {
        dynamicKeys: { id }
      })
      ElMessage({ type: 'success', message: 'Команда успішно розпущена' })
    } catch (e: unknown) {
      const detail =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      ElMessage({
        type: 'error',
        message: typeof detail === 'string' && detail.trim() !== '' ? detail : 'Помилка'
      })
      throw e
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
