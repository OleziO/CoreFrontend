import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'

import { hasPlayerRole } from '@/core/helpers'
import { ERole } from '@/types/general.enums'
import type { components } from '@/api/types/schema'

import type {
  TAdminPlayerRoleItem,
  TLanRoleSyncReport,
  TPlayerAchievements,
  TPlayerMatchStats,
  TUpdatePlayerDto
} from '@/api/types/api.types'

class PlayersService {
  async fetchUserRoles () {
    try {
      return await apiClient.get('/user-roles')
    } catch (e) {
      ElMessage({ type: 'error', message: 'Не вдалося завантажити ролі' })
      throw e
    }
  }

  async fetchPlayers () {
    try {
      return await apiClient.get('/players')
    } catch (e) {
      ElMessage({ type: 'error', message: 'Не вдалося завантажити гравців' })
      throw e
    }
  }

  async fetchPlayerItemById (id: string) {
    try {
      return await apiClient.get('/players/{id}', {
        dynamicKeys: { id }
      })
    } catch (e) {
      ElMessage.error('Гравця не знайдено')
      return null
    }
  }

  /** Той самий GET /players/:id без тосту — для фонового оновлення кешу після адмін-дій. */
  async fetchPlayerQuietly (id: string): Promise<TPlayer | null> {
    try {
      return await apiClient.get('/players/{id}', { dynamicKeys: { id } }) as TPlayer
    } catch {
      return null
    }
  }

  /** Статистика матчів у турнірах платформи. Без тостів — блок сам показує стан помилки. */
  async fetchPlayerMatchStats (id: string): Promise<TPlayerMatchStats> {
    return await apiClient.get('/players/{id}/match-stats', {
      dynamicKeys: { id }
    })
  }

  /** Досягнення гравця (місця в турнірах, рекорди платформи). Без тостів — блок сам показує стан помилки. */
  async fetchPlayerAchievements (id: string): Promise<TPlayerAchievements> {
    return await apiClient.get('/players/{id}/achievements', {
      dynamicKeys: { id }
    })
  }

  async updatePlayer (id: string, data: Partial<TUpdatePlayerDto>): Promise<TPlayer> {
    await apiClient.patch('/players/{id}',
      data as Partial<components['schemas']['UpdatePlayerDto']>,
      {
        dynamicKeys: { id }
      })
    return await apiClient.get('/players/{id}', { dynamicKeys: { id } }) as TPlayer
  }

  /**
   * Повторно призначає поточному користувачу Discord-ролі його LAN-міст і повертає звіт
   * (у т.ч. помилки Discord). Без тостів — рішення, що показати, ухвалює викликач.
   */
  async syncMyLanRoles (): Promise<TLanRoleSyncReport> {
    return await apiClient.post('/players/me/lan-roles/sync')
  }

  async deletePlayer (id: string): Promise<string> {
    await apiClient.delete('/players/{id}', {
      dynamicKeys: { id }
    })
    return id
  }

  private mergePlayerAfterVerifyMutation (player: TPlayer, apiBody: unknown): TPlayer {
    if (apiBody == null || typeof apiBody !== 'object') {
      return player
    }

    const b = apiBody as Record<string, unknown>

    const sameId =
      typeof b.id === 'string'
        ? b.id === player.id
        : b.id === undefined

    /** Повернення повної сутності з беку — приймаємо явні поля. */
    if (sameId && Array.isArray(b.roles)) {
      return { ...player, ...(b as Partial<TPlayer>) }
    }

    /** Типові поля від бекенду після мутації: `verified`, опційно `verifiedAt`, `roles`. */
    if (typeof b.verified === 'boolean') {
      const verified = b.verified
      const next: TPlayer = { ...player }

      if (!verified) {
        next.verifiedAt =
          typeof b.verifiedAt === 'string' || b.verifiedAt === null
            ? (b.verifiedAt as string | null)
            : null
        if (!Array.isArray(b.roles)) {
          next.roles = (next.roles ?? []).filter((r) => !hasPlayerRole([r], ERole.PLAYER))
        }
      } else {
        next.verifiedAt =
          typeof b.verifiedAt === 'string'
            ? b.verifiedAt
            : next.verifiedAt ?? new Date().toISOString()
      }

      if (Array.isArray(b.roles)) {
        next.roles = b.roles
      }

      return next
    }

    if ('verifiedAt' in b && (typeof b.verifiedAt === 'string' || b.verifiedAt === null)) {
      return { ...player, verifiedAt: b.verifiedAt as string | null }
    }

    return player
  }

  async setPlayerVerificationByAdmin (playerId: string, verified: boolean) {
    let verifyResponse: unknown
    try {
      if (verified) {
        verifyResponse = await apiClient.post('/admin/players/{playerId}/verify', {}, {
          dynamicKeys: { playerId }
        })
      } else {
        verifyResponse = await apiClient.delete('/admin/players/{playerId}/verify', {
          dynamicKeys: { playerId }
        })
      }
    } catch {
      ElMessage.error(verified ? 'Не вдалося верифікувати гравця' : 'Не вдалося зняти верифікацію')
      return null
    }

    try {
      const res = await apiClient.get('/players/{id}', {
        dynamicKeys: { id: playerId }
      })
      const merged = this.mergePlayerAfterVerifyMutation(res, verifyResponse)
      ElMessage.success(verified ? 'Гравця верифіковано' : 'Верифікацію знято')
      return merged
    } catch {
      ElMessage.error('Не вдалося оновити дані гравця')
      return null
    }
  }

  async setPlayerRolesByAdmin (
    playerId: string,
    roles: TAdminPlayerRoleItem[]
  ): Promise<TPlayer> {
    const result = await apiClient.patch('/admin/players/{playerId}/roles',
      { roles },
      {
        dynamicKeys: { playerId }
      }) as { roles: TPlayer['roles']; verifiedAt: string | null }
    const fresh = await apiClient.get('/players/{id}', { dynamicKeys: { id: playerId } }) as TPlayer
    return { ...fresh, roles: result.roles, verifiedAt: result.verifiedAt }
  }
}

export const playersService = new PlayersService()
