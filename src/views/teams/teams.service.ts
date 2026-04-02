import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'

class TeamsService {
  async fetchAllTeams (skip?: number) {
    try {
      const res = await apiClient.get('/api/v1/teams/', {
        params: {
          skip
        }
      })
      return res
    } catch (e) {
      ElMessage({ type: 'error' })
      throw e
    }
  }

  async fetchTeam (id: number) {
    try {
      const res = await apiClient.get(`/api/v1/teams/${id}` as any)
      return res as TTeam
    } catch (e) {
      ElMessage.error('Помилка')
    }
  }

  async leaveFromTeam () {
    try {
      const res = await apiClient.post('/api/v1/players/leave')

      ElMessage({ type: 'success', message: 'Гравець успішно покинув команду' })
      return res
    } catch (e: any) {
      ElMessage({ type: 'error', message: e.response.data.detail })
    }
  }

  async joinToTeam (playerId: number, teamId: number, isMain: boolean = true) {
    try {
      const res = await apiClient.post('/api/v1/teams/{team_id}/players/{player_id}', undefined, {
        params: {
          is_main: isMain
        },
        dynamicKeys: {
          team_id: teamId,
          player_id: playerId
        }
      })
      ElMessage({ type: 'success', message: 'Успішно доєднано до команди' })
      return res
    } catch (e: any) {
      ElMessage({ type: 'error', message: e.response.data.detail })
    }
  }

  async dissolveTeam (teamId: number | undefined) {
    try {
      const res = await apiClient.delete(`/api/v1/teams/${teamId}` as any)
      ElMessage({ type: 'success', message: 'Команда успішно розпущена' })
      return res
    } catch (e: any) {
      console.log(e)
      ElMessage({ type: 'error', message: e.response.data.detail })
    }
  }

  async createTeamChats (teamId: number | undefined) {
    try {
      const res = await apiClient.post(`/api/v1/teams/${teamId}/recreate_discord` as any)

      ElMessage.success('Чати команди успішно зроблено')
      return res
    } catch (e: any) {
      console.log(e)
      ElMessage.error(e.response.data.detail)
    }
  }

  async deleteTeamChats (teamId: number | undefined) {
    try {
      const res = await apiClient.post(`/api/v1/teams/${teamId}/cleanup_discord` as any)
      ElMessage({ type: 'success', message: 'Чати команди успішно видалено' })
      console.log(res)
      return res
    } catch (e: any) {
      console.log(e)
      ElMessage({ type: 'error', message: e.response.data.detail })
    }
  }

  async transferCaptaincy (teamId: number, newCaptainId: number) {
    try {
      const res = await apiClient.post('/api/v1/teams/{team_id}/captain/{new_captain_id}', undefined, {
        dynamicKeys: {
          team_id: teamId,
          new_captain_id: newCaptainId
        }
      })
      ElMessage.success('Капітанство успішно передано')
      return res
    } catch {
      ElMessage.error('Помилка при передачі капітанства')
    }
  }

  async getTeamInvites (teamId: number) {
    try {
      const res = await apiClient.get(`/api/v1/teams/${teamId}/invites` as any)
      return res as TTeamInviteWithTeam
    } catch (e: any) {
      console.error('Помилка при отриманні запрошень команди:', e)
      ElMessage({ type: 'error', message: e.response?.data?.detail || 'Помилка при отриманні запрошень' })
      throw e
    }
  }

  async getTeamInviteById (inviteId: number) {
    try {
      const res = await apiClient.get(`/api/v1/teams/invites/${inviteId}` as any)
      return res as TTeamInviteWithTeamSingle
    } catch (e: any) {
      console.error('Помилка при отриманні запрошення:', e)
      ElMessage({ type: 'error', message: e.response?.data?.detail || 'Помилка при отриманні запрошення' })
      throw e
    }
  }

  async acceptTeamInvite (inviteId: number) {
    try {
      const res = await apiClient.post('/api/v1/teams/invites/{invite_id}/accept', undefined, {
        dynamicKeys: {
          invite_id: inviteId
        }
      })
      ElMessage({ type: 'success', message: 'Запрошення успішно прийнято' })
      return res
    } catch {
      ElMessage.error('Помилка при прийнятті запрошення:')
    }
  }

  async removePlayerFromTeam (teamId: number, playerId: number) {
    await apiClient.delete('/api/v1/teams/{team_id}/players/{player_id}', {
      dynamicKeys: { team_id: teamId, player_id: playerId }
    })
  }

  async updateTeam (teamId: number, payload: ICreateTeamForm) {
    const formData = new FormData()
    formData.append('team_name', payload.name)
    formData.append('dota_team_id', String(payload.dotaTeamId))
    if (payload.avatar) {
      formData.append('avatar', payload.avatar)
    }

    return await apiClient.put('/api/v1/teams/{team_id}', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      dynamicKeys: {
        team_id: teamId
      }
    })
  }

  async rejectTeamInvite (inviteId: number) {
    try {
      const res = await apiClient.post(`/api/v1/teams/invites/${inviteId}/reject` as any)
      ElMessage({ type: 'success', message: 'Запрошення успішно відхилено' })
      return res
    } catch (e: any) {
      console.error('Помилка при відхиленні запрошення:', e)
      ElMessage({ type: 'error', message: e.response?.data?.detail || 'Помилка при відхиленні запрошення' })
      throw e
    }
  }

  async invitePlayerToTeam (teamId: number, playerId: number, isTeamMain: boolean) {
    try {
      const res = await apiClient.post(`/api/v1/teams/${teamId}/invite/${playerId}?is_team_main=${isTeamMain}` as any)
      ElMessage({
        type: 'success',
        message: `Запрошення успішно відправлено до ${isTeamMain ? 'основного складу' : 'запасу'}`
      })
      return res
    } catch (e: any) {
      console.error('Помилка при відправці запрошення:', e)
      ElMessage({
        type: 'error',
        message: e.response?.data?.detail || 'Помилка при відправці запрошення'
      })
      throw e
    }
  }
}

export const teamsService = new TeamsService()
