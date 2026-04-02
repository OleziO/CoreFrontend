import apiClient from '@/api/client'
import type { paths } from '@/api/types/schema'
import { ElMessage } from 'element-plus'

class MixTournamentsService {
  async fetchMixTournaments () {
    return await apiClient.get('/api/v1/mix/tournaments/')
  }

  async fetchMixTournament (tournamentId: number): Promise<TMixTournament> {
    const res = await apiClient.get(
      `/api/v1/mix/tournaments/${tournamentId}` as keyof paths
    )

    return res as TMixTournament
  }

  async register (tournamentId: number) {
    try {
      const res = await apiClient.post('/api/v1/mix/tournaments/{tournament_id}/register', undefined, {
        dynamicKeys: { tournament_id: tournamentId }
      }) as TMixTournament

      ElMessage.success('Ви успішно зареєструвалися у мікс-турнірі')
      return res
    } catch (e: any) {
      const errorMsg = e.response?.data?.detail || 'Помилка реєстрації'
      ElMessage.error(errorMsg)
      throw e
    }
  }

  async unregister (tournamentId: number) {
    try {
      const res = await apiClient.delete('/api/v1/mix/tournaments/{tournament_id}/unregister', {
        dynamicKeys: { tournament_id: tournamentId }
      }) as TMixTournament

      ElMessage.success('Ви успішно покинули мікс-турнір')
      return res
    } catch (e: any) {
      const errorMsg = e.response?.data?.detail || 'Помилка'
      ElMessage.error(errorMsg)
      throw e
    }
  }

  async addPlayerToMix (tournamentId: number, playerId: number) {
    return await apiClient.post('/api/v1/mix/tournaments/{tournament_id}/players/{player_id}', undefined, {
      dynamicKeys: {
        tournament_id: tournamentId,
        player_id: playerId
      }
    })
  }

  async getPlayers (search: string = '', limit: number = 20) {
    try {
      const res = await apiClient.get('/api/v1/players/' as any, {
        params: {
          search,
          limit,
          skip: 0
        }
      })
      return res
    } catch (e: any) {
      console.error('Error fetching players:', e)
      return []
    }
  }

  async addPlayerToMixTeam (tournamentId: number, teamId: number, playerId: number) {
    const res = await apiClient.post('/api/v1/mix/tournaments/{tournament_id}/teams/{team_id}/players/{player_id}', undefined, {
      dynamicKeys: {
        tournament_id: tournamentId,
        team_id: teamId,
        player_id: playerId
      }
    })

    return res
  }

  async removePlayerFromMix (tournamentId: number, playerId: number) {
    const res = await apiClient.delete('/api/v1/mix/tournaments/{tournament_id}/players/{player_id}', {
      dynamicKeys: {
        tournament_id: tournamentId,
        player_id: playerId
      }
    })
    return res
  }

  async removePlayerFromMixTeam (tournamentId: number, teamId: number, playerId: number) {
    try {
      const res = await apiClient.delete('/api/v1/mix/tournaments/{tournament_id}/teams/{team_id}/players/{player_id}', {
        dynamicKeys: {
          tournament_id: tournamentId,
          team_id: teamId,
          player_id: playerId
        }
      })
      return res
    } catch (e: any) {
      console.log(e.response?.data?.detail)
      throw e
    }
  }

  async toggleCapitanPlayer (
    tournamentId: number,
    playerId: number,
    isCap: boolean
  ) {
    return await apiClient.post(
      '/api/v1/mix/tournaments/{tournament_id}/players/{player_id}/set-captain/{is_cap}',
      undefined,
      {
        dynamicKeys: {
          tournament_id: tournamentId,
          player_id: playerId,
          is_cap: isCap ? 'true' : 'false'
        }
      }
    )
  }

  async distributePools (tournamentId: number) {
    try {
      // Вызываем эндпоинт распределения. Предполагаю префикс /api/v1 как везде
      const res = await apiClient.post('/api/v1/mix/tournaments/{tournament_id}/distribute-pools', undefined, {
        dynamicKeys: { tournament_id: tournamentId }
      })
      ElMessage.success('Пули успішно сформовано, етап змінено')
      return res
    } catch (e: any) {
      const errorMsg = e.response?.data?.detail || 'Помилка формування пулів'
      ElMessage.error(errorMsg)
      throw e
    }
  }

  async setPlayerPool (tournamentId: number, playerId: number, pool: number) {
    try {
      const res = await apiClient.post('/api/v1/mix/tournaments/{tournament_id}/players/{player_id}/set-pool/{pool}', undefined, {
        dynamicKeys: {
          tournament_id: tournamentId,
          player_id: playerId,
          pool
        }
      })
      ElMessage.success(`Пул гравця змінено на ${pool}`)
      return res
    } catch (e: any) {
      const errorMsg = e.response?.data?.detail || 'Помилка зміни пула'
      ElMessage.error(errorMsg)
      throw e
    }
  }

  async createMixTeam (tournamentId: number, playerId: number, data: ICreateTeamForm) {
    const formData = new FormData()

    formData.append('team_name', data.name)
    formData.append('team_dota_id', String(data.dotaTeamId))

    if (data.avatar) {
      formData.append('team_avatar', data.avatar)
    }

    const res = await apiClient.post('/api/v1/mix/teams/{tournament_id}/players/{player_id}/create-team', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      dynamicKeys: {
        tournament_id: tournamentId,
        player_id: playerId
      }
    })

    return res
  }

  async getMixTeam (teamId: number) {
    try {
      const res = await apiClient.get('/api/v1/mix/teams/{team_id}', {
        dynamicKeys: { team_id: teamId }
      })
      return res
    } catch (e: any) {
      console.error(`Error fetching mix team ${teamId}:`, e)
      return null
    }
  }

  async getTournamentTeams (tournamentId: number) {
    try {
      const res = await apiClient.get('/api/v1/mix/tournaments/{tournament_id}/teams', {
        dynamicKeys: { tournament_id: tournamentId }
      })
      return res || []
    } catch (e: any) {
      console.error(`Error fetching tournament teams for tournament ${tournamentId}:`, e)
      return []
    }
  }

  async startMixBracket (tournamentId: number) {
    try {
      const res = await apiClient.post('/api/v1/mix/tournaments/{tournament_id}/start-bracket', undefined, {
        dynamicKeys: { tournament_id: tournamentId }
      })
      ElMessage.success('Турнірну сітку успішно запущено!')
      return res
    } catch (e: any) {
      console.log(e.response?.data?.detail)
      throw e
    }
  }

  async rewardMixTournamentWinners (tournamentId: number,
    data: { winner_team_id: number; points: number }) {
    try {
      const res = await apiClient.post('/api/v1/mix/tournaments/{tournament_id}/reward-winners', { ...data, balance: 0 }, {
        dynamicKeys: { tournament_id: tournamentId }
      })

      ElMessage.success('Переможців успішно нагороджено!')

      return res
    } catch (e: any) {
      console.log(e.response?.data?.detail)
      throw e
    }
  }

  async getOpenMatches (tournamentId: number) {
    try {
      const res = await apiClient.get('/api/v1/mix/tournaments/{tournament_id}/matches/open', {
        dynamicKeys: { tournament_id: tournamentId }
      })
      return res
    } catch (e: any) {
      console.error('Error fetching open matches:', e)
      return []
    }
  }

  async updateMatchResult (
    tournamentId: number,
    matchId: number,
    data: { team_1_score: number; team_2_score: number }
  ) {
    try {
      const res = await apiClient.put('/api/v1/mix/tournaments/{tournament_id}/matches/{match_id}/result', data, {
        dynamicKeys: {
          tournament_id: tournamentId,
          match_id: matchId
        }
      })
      ElMessage.success('Результат матчу оновлено')
      return res
    } catch (e: any) {
      console.log(e.response?.data?.detail)
      throw e
    }
  }

  async recruitPlayer (tournamentId: number) {
    try {
      const res = await apiClient.post('/api/v1/mix/tournaments/{tournament_id}/recruit', undefined, {
        dynamicKeys: { tournament_id: tournamentId }
      })
      return res
    } catch (e: any) {
      console.log(e.response?.data?.detail)
      throw e
    }
  }

  async sendMixNotification (data: { mmr_start: number; mmr_end: number; tournament_id: number; message: string }) {
    try {
      const res = await apiClient.post('/api/v1/notifications/send_mix_tournament' as any, data)

      ElMessage.success('Сповіщення успішно надіслано')
      return res
    } catch (e: any) {
      const errorMsg = e.response?.data?.detail || 'Помилка відправки сповіщення'
      ElMessage.error(errorMsg)
      throw e
    }
  }
}

export const mixTournamentsService = new MixTournamentsService()
