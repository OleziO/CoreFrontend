import { supabase } from '@/api/client'
import type { TCurrentPlayer } from '@/api/types/api.types'

interface IDiscordTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

/**
 * Мапінг рядка гравця з БД (camelCase або snake_case) у CurrentPlayerDto.
 * Розширте під ваші JOIN / JSON-колонки (rank, roles).
 */
function mapPlayerRowToCurrentPlayer (row: Record<string, unknown>): TCurrentPlayer {
  const rankRaw = (typeof row.rank === 'object' && row.rank !== null ? row.rank : {}) as Record<string, unknown>
  const rolesRaw = row.roles
  const roles = Array.isArray(rolesRaw)
    ? rolesRaw.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      name: String(r.name),
      isAdminRole: Boolean(r.is_admin_role ?? r.isAdminRole),
      color: String(r.color ?? '#2563EB')
    }))
    : []

  return {
    id: String(row.id),
    steamId: (row.steam_id ?? row.steamId) as string | null | undefined,
    discordId: (row.discord_id ?? row.discordId) as string | null | undefined,
    telegramId: (row.telegram_id ?? row.telegramId) as string | null | undefined,
    avatarUrl: (row.avatar_url ?? row.avatarUrl) as string | null | undefined,
    discordName: (row.discord_name ?? row.discordName) as string | null | undefined,
    discordUsername: (row.discord_username ?? row.discordUsername) as string | null | undefined,
    rating: Number(row.rating ?? 0),
    rank: {
      rankNumber: Number(rankRaw.rank_number ?? rankRaw.rankNumber ?? 0),
      stars: Number(rankRaw.stars ?? 0),
      numericName: Number(rankRaw.numeric_name ?? rankRaw.numericName ?? 0),
      nameUk: String(rankRaw.name_uk ?? rankRaw.nameUk ?? '')
    },
    positions: (row.positions ?? null) as TCurrentPlayer['positions'],
    verifiedAt: (row.verified_at ?? row.verifiedAt) as string | null | undefined,
    roles
  }
}

class AuthService {
  /** OAuth Discord; у відповіді є `url` — виконайте `window.location.href = data.url`. */
  async signInWithDiscord () {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord'
    })

    if (error) throw error
    return data
  }

  /** PKCE-код з редіректу Discord; `state` перевіряється маршрутизатором / колбеком за потреби. */
  async exchangeDiscordCode (code: string): Promise<IDiscordTokenResponse> {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    const session = data.session
    if (!session) throw new Error('Сесію не отримано')
    return {
      access_token: session.access_token,
      token_type: 'Bearer',
      expires_in: session.expires_in ?? 3600
    }
  }

  async getMe (): Promise<TCurrentPlayer> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    const session = sessionData.session
    if (!session) throw new Error('Не авторизовано')

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (error) throw error
    return mapPlayerRowToCurrentPlayer(data as Record<string, unknown>)
  }

  /** Edge Function у проєкті Supabase: має повертати JSON `{ url: string }`. */
  async getSteamLinkUrl (): Promise<{ url: string }> {
    const { data, error } = await supabase.functions.invoke<{ url: string }>('steam-link-url')
    if (error) throw error
    if (!data?.url) throw new Error('Посилання Steam відсутнє')
    return data
  }
}

export const authService = new AuthService()
