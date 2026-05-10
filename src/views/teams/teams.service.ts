import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import type {
  TTeamResponse as TeamApi,
  TCreateTeamDto as CreateTeamDto,
  TUpdateTeamDto as UpdateTeamDto,
  TAddTeamPlayerDto as AddTeamPlayerDto
} from '@/api/types/api.types'

import { postTeamLogoUpload } from '@/services/image-upload.service'

export type TCreateTeamPayload = CreateTeamDto & { logoFile?: File | null }
export type TUpdateTeamPayload = UpdateTeamDto & { logoFile?: File | null }

function teamEntries (dto: Partial<UpdateTeamDto>): Partial<UpdateTeamDto> {
  return Object.fromEntries(
    Object.entries(dto).filter(([, v]) => v !== undefined)
  ) as Partial<UpdateTeamDto>
}

class TeamsService {
  async fetchAllTeams (): Promise<TeamApi[]> {
    try {
      const res = await apiClient.get('/teams')
      return res
    } catch (e) {
      ElMessage({ type: 'error' })
      throw e
    }
  }

  async fetchTeam (id: string, options?: { silent?: boolean }): Promise<TeamApi> {
    try {
      const res = await apiClient.get('/teams/{id}', {
        dynamicKeys: { id }
      })
      return res
    } catch (e) {
      if (!options?.silent) {
        ElMessage.error('Помилка')
      }
      throw e
    }
  }

  /** POST /teams (name, dotaTeamId), потім за наявності файлу — POST /teams/:id/logo, GET для актуального стану. */
  async createTeam (data: TCreateTeamPayload): Promise<TeamApi> {
    const { logoFile, ...dto } = data
    const team = await apiClient.post('/teams', dto)

    if (!logoFile) return team

    await postTeamLogoUpload(team.id, logoFile)
    return await this.fetchTeam(team.id)
  }

  async updateTeam (id: string, data: TUpdateTeamPayload): Promise<TeamApi> {
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

  /** POST /teams/:id/players — додати гравця в основу або запас (адмін). */
  async addPlayerToTeam (teamId: string, body: AddTeamPlayerDto): Promise<TeamApi> {
    const res = await apiClient.post('/teams/{id}/players', body, {
      dynamicKeys: { id: teamId }
    })
    if (res && typeof res === 'object' && 'id' in res) {
      return res
    }
    return await this.fetchTeam(teamId)
  }

  /** DELETE /teams/:id/players/:playerId — прибрати гравця з команди (у відповіді зазвичай повна команда). */
  async removePlayerFromTeam (teamId: string, playerId: string): Promise<TeamApi> {
    const res = await apiClient.delete('/teams/{id}/players/{playerId}', {
      dynamicKeys: { id: teamId, playerId }
    }) as unknown
    if (res && typeof res === 'object' && 'id' in res) {
      return res as TeamApi
    }
    return await this.fetchTeam(teamId)
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

  /** POST /teams/:id/invites — створити запрошення до команди (тільки капітан). */
  async createInvite (teamId: string, slot: 'main' | 'reserved' | 'coach'): Promise<{ token: string; expiresAt: string }> {
    const res = await apiClient.post('/teams/{id}/invites', { slot }, {
      dynamicKeys: { id: teamId }
    } as any)
    return res as { token: string; expiresAt: string }
  }

  // TODO: endpoint not in API yet
  // async getTeamInvites (teamId: number) { ... }

  // TODO: endpoint not in API yet
  // async getTeamInviteById (inviteId: number) { ... }

  // TODO: endpoint not in API yet
  // async acceptTeamInvite (inviteId: number) { ... }

  // TODO: endpoint not in API yet
  // async rejectTeamInvite (inviteId: number) { ... }

  // TODO: endpoint not in API yet
  // async invitePlayerToTeam (teamId: number, playerId: number, isTeamMain: boolean) { ... }
}

export const teamsService = new TeamsService()
