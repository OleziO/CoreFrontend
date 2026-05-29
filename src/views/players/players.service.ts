import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'

import { hasPlayerRole } from '@/core/helpers'
import { ERole } from '@/types/general.types'
import type { components } from '@/api/types/schema'

import type {
  TAdminPlayerRoleItem,
  TUpdatePlayerDto,
  TUserRoleCatalog
} from '@/api/types/api.types'

import { usePlayersStore } from '@/views/players/players.store'

function parseUserRolesList (raw: unknown): TUserRoleCatalog[] {
  if (Array.isArray(raw)) return raw as TUserRoleCatalog[]
  if (raw && typeof raw === 'object' && raw !== null && 'data' in raw) {
    const inner = (raw as { data: unknown }).data
    if (Array.isArray(inner)) return inner as TUserRoleCatalog[]
  }
  return []
}

class PlayersService {
  async fetchUserRoles (opts?: { force?: boolean }) {
    const force = opts?.force ?? false
    const store = usePlayersStore()
    if (!force && store.userRolesCatalog.length) {
      return [...store.userRolesCatalog]
    }
    try {
      const raw = await apiClient.get('/user-roles') as unknown
      const list = parseUserRolesList(raw)
      const copy = [...list]
      store.setUserRolesCatalog(copy)
      return copy
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

  async updatePlayer (id: string, data: Partial<TUpdatePlayerDto>) {
    return await apiClient.patch('/players/{id}',
      data as Partial<components['schemas']['UpdatePlayerDto']>,
      {
        dynamicKeys: { id }
      })
  }

  async deletePlayer (id: string) {
    await apiClient.delete('/players/{id}', {
      dynamicKeys: { id }
    })
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

      usePlayersStore().patchPlayerInList(merged)
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
  ) {
    return await apiClient.patch('/admin/players/{playerId}/roles',
      { roles },
      {
        dynamicKeys: { playerId }
      })
  }
}

export const playersService = new PlayersService()
