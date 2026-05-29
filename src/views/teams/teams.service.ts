import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import type {
  TCreateTeamDto as CreateTeamDto,
  TUpdateTeamDto as UpdateTeamDto,
  TAddTeamPlayerDto as AddTeamPlayerDto
} from '@/api/types/api.types'

import { postTeamLogoUpload } from '@/services/image-upload.service'
import { hydrateTeamPlayersRanks } from '@/views/teams/team-roster-hydrate'
import { getApiErrorMessage } from '@/utils/api-errors'

export type TCreateTeamPayload = CreateTeamDto & { logoFile?: File | null }
export type TUpdateTeamPayload = UpdateTeamDto & { logoFile?: File | null }

function teamEntries (dto: Partial<UpdateTeamDto>): Partial<UpdateTeamDto> {
  return Object.fromEntries(
    Object.entries(dto).filter(([, v]) => v !== undefined)
  ) as Partial<UpdateTeamDto>
}

class TeamsService {
  async fetchAllTeams () {
    try {
      const teams = await apiClient.get('/teams')
      return teams.map(hydrateTeamPlayersRanks)
    } catch (e) {
      ElMessage({ type: 'error' })
      throw e
    }
  }

  async fetchTeam (id: string, options?: { silent?: boolean }) {
    try {
      const raw = await apiClient.get('/teams/{id}', {
        dynamicKeys: { id }
      })
      return hydrateTeamPlayersRanks(raw)
    } catch (e) {
      if (!options?.silent) {
        ElMessage.error('Помилка')
      }
      throw e
    }
  }

  /** Fetch, hydrate and cache a single team. Returns null on error (silent). */
  async loadTeam (teamId: string): Promise<TTeam | null> {
    try {
      const hydrated = await this.fetchTeam(teamId, { silent: true })
      useTeamsStore().patchTeamInList(hydrated)
      return hydrated
    } catch {
      return null
    }
  }

  /** POST /teams (name, dotaTeamId), потім за наявності файлу — POST /teams/:id/logo, GET для актуального стану. */
  async createTeam (data: TCreateTeamPayload) {
    const { logoFile, ...dto } = data
    const team = await apiClient.post('/teams', dto)

    if (!logoFile) return hydrateTeamPlayersRanks(team)

    await postTeamLogoUpload(team.id, logoFile)
    return await this.fetchTeam(team.id)
  }

  async updateTeam (id: string, data: TUpdateTeamPayload) {
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

  /** Full-cycle: update team profile + cache + success toast. Returns null on error. */
  async updateTeamProfile (id: string, data: TUpdateTeamPayload): Promise<TTeam | null> {
    try {
      const updated = await this.updateTeam(id, data)
      useTeamsStore().patchTeamInList(updated)
      ElMessage.success('Команду оновлено')
      return updated
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити команду'))
      return null
    }
  }

  /** Full-cycle: verify team + cache + success toast. Returns null on error. */
  async verifyTeam (teamId: string): Promise<TTeam | null> {
    try {
      const updated = await this.updateTeam(teamId, { isVerified: true })
      useTeamsStore().patchTeamInList(updated)
      ElMessage.success('Команду верифіковано')
      return updated
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося верифікувати команду'))
      return null
    }
  }

  /** POST /teams/:id/players — додати гравця в основу або запас (адмін). */
  async addPlayerToTeam (teamId: string, body: AddTeamPlayerDto) {
    const res = await apiClient.post('/teams/{id}/players', body, {
      dynamicKeys: { id: teamId }
    })
    if (res && typeof res === 'object' && 'id' in res) {
      return hydrateTeamPlayersRanks(res)
    }
    return await this.fetchTeam(teamId)
  }

  /** Full-cycle: remove coach + cache + success toast. Returns null on error. */
  async removeCoach (teamId: string): Promise<TTeam | null> {
    try {
      await apiClient.patch('/teams/{id}', { coachId: null }, {
        dynamicKeys: { id: teamId }
      })
      const updated = await this.fetchTeam(teamId)
      useTeamsStore().patchTeamInList(updated)
      ElMessage.success('Тренера прибрано з команди')
      return updated
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося прибрати тренера'))
      return null
    }
  }

  /** Full-cycle: remove player + cache + playersStore update + success toast. Returns null on error. */
  async removePlayerFromTeam (teamId: string, playerId: string): Promise<TTeam | null> {
    try {
      const res = await apiClient.delete('/teams/{id}/players/{playerId}', {
        dynamicKeys: { id: teamId, playerId }
      }) as unknown

      const updated = (res && typeof res === 'object' && 'id' in res)
        ? hydrateTeamPlayersRanks(res as TTeam)
        : await this.fetchTeam(teamId)

      usePlayersStore().setPlayerTeamIdClientside(playerId, null)
      useTeamsStore().patchTeamInList(updated)
      ElMessage.success('Гравця прибрано з команди')
      return updated
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося прибрати гравця'))
      return null
    }
  }

  async dissolveTeam (id: string) {
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

  /** Full-cycle: unverify team + cache + success toast. Returns null on error. */
  async unverifyTeam (teamId: string): Promise<TTeam | null> {
    try {
      await apiClient.delete('/admin/teams/{teamId}/verify', {
        dynamicKeys: { teamId }
      })
      const updated = await this.fetchTeam(teamId)
      useTeamsStore().patchTeamInList(updated)
      ElMessage.success('Верифікацію знято')
      return updated
    } catch (e) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося зняти верифікацію команди'))
      return null
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

  /** Hydrates and caches result; success toast is handled by ChangeCaptainModal. */
  async transferCaptaincy (teamId: string, newCaptainPlayerId: string): Promise<TTeam> {
    const res = await apiClient.post('/teams/{id}/captain', { newCaptainPlayerId }, {
      dynamicKeys: { id: teamId }
    } as any)
    const updated = (res && typeof res === 'object' && 'id' in res)
      ? hydrateTeamPlayersRanks(res)
      : await this.fetchTeam(teamId)
    useTeamsStore().patchTeamInList(updated)
    return updated
  }

  /** POST /teams/:id/invites — створити запрошення до команди (тільки капітан). */
  async createInvite (teamId: string, slot: 'main' | 'reserved' | 'coach') {
    return await apiClient.post('/teams/{id}/invites', { slot }, {
      dynamicKeys: { id: teamId }
    } as any) as { token: string; expiresAt: string }
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
