import apiClient from '@/api/client'
import { heroIdMap } from '@/components/player-tags/player.constants'
import { ElMessage } from 'element-plus'

class PlayersService {
  async fetchPlayers (skip: number = 0): Promise<{ totalPlayers: number | null; data: TPlayer[] }> {
    const apiUrl = import.meta.env.VITE_API_PUBLIC_URL
    const token = localStorage.getItem('userToken')

    try {
      const res = await fetch(`${apiUrl}/api/v1/players/?skip=${skip}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      })

      const totalPlayers = Number(res.headers.get('x-total-count'))
      return {
        totalPlayers,
        data: await res.json()
      }
    } catch (e) {
      ElMessage({ type: 'error', message: 'Не вдалося завантажити гравців' })
      throw e
    }
  }

  async createTeam (team: ICreateTeamForm): Promise<TTeam> {
    const formData = new FormData()
    formData.append('team_name', team.name)
    formData.append('team_id', String(team.dotaTeamId))

    if (team.avatar) {
      formData.append('avatar', team.avatar)
    }

    return apiClient.post('/api/v1/teams/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }) as Promise<TTeam>
  }

  async callPlayers (chatId: string, playersIds: number[], message = '', signature = true) {
    await apiClient.post('/api/v1/notifications/send', {
      players_ids: playersIds,
      chat_discord_id: chatId,
      message,
      signature
    })
  }

  async getChats () {
    try {
      return await apiClient.get('/api/v1/constants/chats')
    } catch (e) {
      ElMessage({ type: 'error' })
    }
  }

  async fetchPlayerItemById (playerId: number) {
    try {
      const res = await apiClient.get('/api/v1/players/{player_id}', {
        dynamicKeys: {
          player_id: playerId
        }
      })
      return res
    } catch (e) {
      ElMessage.error('Гравця не знайдено')
      return null
    }
  }

  async getPlayerRoles () {
    return await apiClient.get('/api/v1/roles/visible')
  }

  async updatePlayerRoles (playerId: number, roleIds: number[]) {
    try {
      const res = await apiClient.put('/api/v1/roles/{player_id}/roles', { role_ids: roleIds }, { dynamicKeys: { player_id: playerId } })

      return res
    } catch (e: any) {
      throw new Error(e)
    }
  }

  toSteam3ID (steamID64: string): string {
    const id = BigInt(steamID64)

    const accountID = id & 0xFFFFFFFFn

    return accountID.toString()
  }

  async getPlayerFavoriteHeroes (steamID64: string) {
    try {
      const accountIdBig = this.toSteam3ID(String(steamID64))

      const res = await fetch(
        `https://api.opendota.com/api/players/${accountIdBig}/heroes`
      )
      const data = await res.json()

      const topHeroes = data
        .sort((a: any, b: any) => b.games - a.games)
        .slice(0, 3)

      return topHeroes.map((hero: any) => {
        const heroName = heroIdMap[hero.hero_id] || 'antimage'

        return {
          name: heroName.replace('_', ' '),
          winRate: Math.round((hero.win / hero.games) * 10000) / 100,
          image: `https://cdn.stratz.com/images/dota2/heroes/${heroName}_icon.png`
        }
      })
    } catch (error) {
      ElMessage.error(String(error))
    }
  }

  async changePlayerRespect (playerId: number, action: 'like' | 'dislike', amount = 1) {
    return await apiClient.post('/api/v1/players/respect', {
      target_id: playerId,
      value: action === 'like' ? 1 * amount : -1 * amount
    })
  }

  async updatePlayerPoints (playerId: number, _points: number) {
    return await apiClient.patch(`/api/v1/players/${playerId}/points` as any, {}, {
      params: {
        points: _points
      }
    })
  }

  async verifyPlayer (playerId: number) {
    try {
      const res = await apiClient.patch(`/api/v1/players/${playerId}/verify` as any, { player_id: playerId })
      ElMessage.success({ message: 'Гравець успішно верифікований' })
      return res
    } catch (e: any) {
      ElMessage.error(e.response?.data?.detail)
    }
  }

  async updateUserGameData (data: { mmr: number; positions: number[] }) {
    try {
      const res = await apiClient.patch('/api/v1/players/me/game-data' as any, {
        mmr: data.mmr,
        positions: data.positions
      })
      ElMessage.success({ message: 'Дані успішно оновлено' })
      return res
    } catch (e: any) {
      ElMessage({ type: 'error', message: e.response?.data?.detail || 'Не вдалося оновити дані' })
      throw e
    }
  }

  async updatePlayerMmrByAdmin (playerId: number, mmr: number) {
    try {
      const res = await apiClient.patch('/api/v1/players/{player_id}/mmr', {
        mmr
      }, {
        dynamicKeys: {
          player_id: playerId
        }
      })

      return res
    } catch (e: any) {
      ElMessage({ type: 'error', message: e.response?.data?.detail || 'Не вдалося оновити MMR' })
      throw e
    }
  }

  async updateMyMMPAndPositions (mmr: number, positions?: number[]) {
    try {
      const res = await apiClient.patch('/api/v1/players/me/game-data', {
        mmr,
        positions
      })

      return res
    } catch (e: any) {
      ElMessage({ type: 'error', message: e.response?.data?.detail || 'Не вдалося оновити MMR' })
      throw e
    }
  }

  async toggleDiscordNotification (isTrue: boolean) {
    return await apiClient.patch('/api/v1/players/me/notifications', { is_receive_notification: isTrue })
  }
}

export const playersService = new PlayersService()
