import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import type { TPlayer as Player, TUpdatePlayerDto as UpdatePlayerDto } from '@/api/types/api.types'

class PlayersService {
  async fetchPlayers (): Promise<Player[]> {
    try {
      const res = await apiClient.get('/players')
      return res as Player[]
    } catch (e) {
      ElMessage({ type: 'error', message: 'Не вдалося завантажити гравців' })
      throw e
    }
  }

  async fetchPlayerItemById (id: string): Promise<Player | null> {
    try {
      const res = await apiClient.get('/players/{id}', {
        dynamicKeys: { id }
      })
      return res as Player
    } catch (e) {
      ElMessage.error('Гравця не знайдено')
      return null
    }
  }

  async updatePlayer (id: string, data: UpdatePlayerDto): Promise<Player> {
    const res = await apiClient.patch('/players/{id}', data, {
      dynamicKeys: { id }
    })
    return res as Player
  }

  async deletePlayer (id: string): Promise<void> {
    await apiClient.delete('/players/{id}', {
      dynamicKeys: { id }
    })
  }

  // TODO: endpoint not in API yet
  // async createTeam (team: ICreateTeamForm): Promise<TTeam> { ... }

  // TODO: endpoint not in API yet
  // async callPlayers (chatId: string, playersIds: number[], message = '', signature = true) { ... }

  // TODO: endpoint not in API yet
  // async getChats () { ... }

  // TODO: endpoint not in API yet
  // async getPlayerRoles () { ... }

  // TODO: endpoint not in API yet
  // async updatePlayerRoles (playerId: number, roleIds: number[]) { ... }

  // TODO: endpoint not in API yet
  // toSteam3ID (steamID64: string): string { ... }

  // TODO: endpoint not in API yet (external API — opendota)
  // async getPlayerFavoriteHeroes (steamID64: string) { ... }

  // TODO: endpoint not in API yet
  // async changePlayerRespect (playerId: number, action: 'like' | 'dislike', amount = 1) { ... }

  // TODO: endpoint not in API yet
  // async updatePlayerPoints (playerId: number, _points: number) { ... }

  // TODO: endpoint not in API yet
  // async verifyPlayer (playerId: number) { ... }

  // TODO: endpoint not in API yet
  // async updateUserGameData (data: { mmr: number; positions: number[] }) { ... }

  // TODO: endpoint not in API yet
  // async updatePlayerMmrByAdmin (playerId: number, mmr: number) { ... }

  // TODO: endpoint not in API yet
  // async updateMyMMPAndPositions (mmr: number, positions?: number[]) { ... }

  // TODO: endpoint not in API yet
  // async toggleDiscordNotification (isTrue: boolean) { ... }
}

export const playersService = new PlayersService()
