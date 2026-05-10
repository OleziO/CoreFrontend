import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import { shallowRef } from 'vue'

import { hasPlayerRole } from '@/core/helpers'
import { ERole } from '@/types/general.types'
import type { components } from '@/api/types/schema'

import type { TPlayer, TUpdatePlayerDto, TUserRoleCatalog } from '@/api/types/api.types'

/** Каталог GET `/user-roles` — реактивний, щоб список після префетчу перерахував фільтр за query. */
export const userRolesCatalogRef = shallowRef<TUserRoleCatalog[] | null>(null)

/** Відповідь GET `/user-roles` — зазвичай масив `UserRoleResponseDto[]`. */
function parseUserRolesList (raw: unknown): TUserRoleCatalog[] {
  if (Array.isArray(raw)) return raw as TUserRoleCatalog[]
  if (raw && typeof raw === 'object' && raw !== null && 'data' in raw) {
    const inner = (raw as { data: unknown }).data
    if (Array.isArray(inner)) return inner as TUserRoleCatalog[]
  }
  return []
}

class PlayersService {
  /** Останній успішний кеш каталогу ролей (для підписів тегів без повторного GET). */
  getCachedUserRoles (): TUserRoleCatalog[] {
    return userRolesCatalogRef.value ?? []
  }

  /**
   * Каталог ролей з бекенду (GET `/user-roles`). Кешується для селектів фільтрів.
   */
  async fetchUserRoles (opts?: { force?: boolean }): Promise<TUserRoleCatalog[]> {
    const force = opts?.force ?? false
    if (!force && userRolesCatalogRef.value !== null) {
      return [...userRolesCatalogRef.value]
    }
    try {
      const raw = await apiClient.get('/user-roles') as unknown
      const list = parseUserRolesList(raw)
      const copy = [...list]
      userRolesCatalogRef.value = copy
      return copy
    } catch (e) {
      ElMessage({ type: 'error', message: 'Не вдалося завантажити ролі' })
      throw e
    }
  }

  async fetchPlayers (): Promise<TPlayer[]> {
    try {
      const res = await apiClient.get('/players')
      return res as unknown as TPlayer[]
    } catch (e) {
      ElMessage({ type: 'error', message: 'Не вдалося завантажити гравців' })
      throw e
    }
  }

  async fetchPlayerItemById (id: string): Promise<TPlayer | null> {
    try {
      const res = await apiClient.get('/players/{id}', {
        dynamicKeys: { id }
      })
      return res as unknown as TPlayer
    } catch (e) {
      ElMessage.error('Гравця не знайдено')
      return null
    }
  }

  async updatePlayer (id: string, data: Partial<TUpdatePlayerDto>): Promise<TPlayer> {
    const res = await apiClient.patch('/players/{id}',
      data as Partial<components['schemas']['UpdatePlayerDto']>,
      {
        dynamicKeys: { id }
      })
    return res as unknown as TPlayer
  }

  async deletePlayer (id: string): Promise<void> {
    await apiClient.delete('/players/{id}', {
      dynamicKeys: { id }
    })
  }

  /**
   * Відповідь POST/DELETE `/admin/players/:id/verify` звичайно містить `verified`
   * (джерело істини після мутації). Зливаємо її із GET `/players/:id`, щоб кеш/UI не показували старий стан.
   */
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
        next.roles = b.roles as unknown as TPlayer['roles']
      }

      return next
    }

    if ('verifiedAt' in b && (typeof b.verifiedAt === 'string' || b.verifiedAt === null)) {
      return { ...player, verifiedAt: b.verifiedAt as string | null }
    }

    return player
  }

  async setPlayerVerificationByAdmin (playerId: string, verified: boolean): Promise<TPlayer | null> {
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
      }) as unknown as TPlayer
      const merged = this.mergePlayerAfterVerifyMutation(res, verifyResponse)

      ElMessage.success(verified ? 'Гравця верифіковано' : 'Верифікацію знято')
      return merged
    } catch {
      ElMessage.error('Не вдалося оновити дані гравця')
      return null
    }
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
  // async updatePlayerMmrByAdmin (playerId: number, mmr: number) { ... }

  // TODO: endpoint not in API yet
  // async toggleDiscordNotification (isTrue: boolean) { ... }
}

export const playersService = new PlayersService()
