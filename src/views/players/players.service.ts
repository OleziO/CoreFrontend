import { supabase } from '@/api/client'
import { ElMessage } from 'element-plus'

import { hasPlayerRole } from '@/core/helpers'
import { ERole } from '@/types/general.types'
import type { TPlayer, TUpdatePlayerDto } from '@/api/types/api.types'

function mapRowToPlayer (row: Record<string, unknown>): TPlayer {
  const rankRaw = (typeof row.rank === 'object' && row.rank !== null ? row.rank : {}) as Record<string, unknown>
  const rolesRaw = row.roles
  const roles: TPlayer['roles'] = Array.isArray(rolesRaw)
    ? rolesRaw.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      name: String(r.name),
      isAdminRole: Boolean(r.is_admin_role ?? r.isAdminRole),
      player: null,
      tournaments: []
    }))
    : []

  return {
    id: String(row.id),
    steamId: (row.steam_id ?? row.steamId) as string | null,
    discordId: (row.discord_id ?? row.discordId) as string | null,
    telegramId: (row.telegram_id ?? row.telegramId) as string | null,
    avatarUrl: (row.avatar_url ?? row.avatarUrl) as string | null,
    discordName: (row.discord_name ?? row.discordName) as string | null,
    discordUsername: (row.discord_username ?? row.discordUsername) as string | null,
    rating: Number(row.rating ?? 0),
    rank: {
      rankNumber: Number(rankRaw.rank_number ?? rankRaw.rankNumber ?? 0),
      stars: Number(rankRaw.stars ?? 0),
      numericName: Number(rankRaw.numeric_name ?? rankRaw.numericName ?? 0),
      nameUk: String(rankRaw.name_uk ?? rankRaw.nameUk ?? '')
    },
    positions: (row.positions ?? null) as TPlayer['positions'],
    verifiedAt: (row.verified_at ?? row.verifiedAt) as string | null,
    roles
  }
}

function updateDtoToPatch (data: Partial<TUpdatePlayerDto>): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  if (data.steamId !== undefined) patch.steam_id = data.steamId
  if (data.discordId !== undefined) patch.discord_id = data.discordId
  if (data.telegramId !== undefined) patch.telegram_id = data.telegramId
  if (data.avatarUrl !== undefined) patch.avatar_url = data.avatarUrl
  if (data.discordName !== undefined) patch.discord_name = data.discordName
  if (data.discordUsername !== undefined) patch.discord_username = data.discordUsername
  if (data.rating !== undefined) patch.rating = data.rating
  if (data.positions !== undefined) patch.positions = data.positions
  return patch
}

function throwIfError (error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message)
}

class PlayersService {
  async fetchPlayers (): Promise<TPlayer[]> {
    try {
      const { data, error } = await supabase.from('players').select('*')
      throwIfError(error)
      return (data ?? []).map(r => mapRowToPlayer(r as Record<string, unknown>))
    } catch (e) {
      ElMessage({ type: 'error', message: 'Не вдалося завантажити гравців' })
      throw e
    }
  }

  async fetchPlayerItemById (id: string): Promise<TPlayer | null> {
    try {
      const { data, error } = await supabase.from('players').select('*').eq('id', id).maybeSingle()
      throwIfError(error)
      if (!data) return null
      return mapRowToPlayer(data as Record<string, unknown>)
    } catch (e) {
      ElMessage.error('Гравця не знайдено')
      return null
    }
  }

  async updatePlayer (id: string, data: Partial<TUpdatePlayerDto>): Promise<TPlayer> {
    const patch = updateDtoToPatch(data)

    const { data: row, error } = await supabase
      .from('players')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle()

    throwIfError(error)

    if (!row) {
      throw new Error(`Player not found: ${id}`)
      // or return a 404 response, etc.
    }

    return mapRowToPlayer(row as Record<string, unknown>)
  }

  async deletePlayer (id: string): Promise<void> {
    const { error } = await supabase.from('players').delete().eq('id', id)
    throwIfError(error)
  }

  /**
   * Локальна логіка після верифікації (без окремого admin endpoint у Nest).
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

    if (sameId && Array.isArray(b.roles)) {
      return { ...player, ...(b as Partial<TPlayer>) }
    }

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
    try {
      const patch = {
        verified_at: verified ? new Date().toISOString() : null
      }
      const { data: updated, error } = await supabase
        .from('players')
        .update(patch)
        .eq('id', playerId)
        .select()
        .single()
      throwIfError(error)

      const res = mapRowToPlayer(updated as Record<string, unknown>)
      const merged = this.mergePlayerAfterVerifyMutation(res, {
        verified,
        verifiedAt: patch.verified_at,
        id: playerId
      })

      ElMessage.success(verified ? 'Гравця верифіковано' : 'Верифікацію знято')
      return merged
    } catch {
      ElMessage.error(verified ? 'Не вдалося верифікувати гравця' : 'Не вдалося зняти верифікацію')
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
