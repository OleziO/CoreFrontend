/**
 * Прямий доступ до OpenDota через `fetch` — НЕ типізований apiClient.
 * Свідомо не axios: глобальна авгментація `axios` прив'язує типи до наших API-шляхів,
 * а тут зовнішнє публічне API без авторизації/інтерсепторів. Іконки — зі Stratz CDN.
 */
const OPENDOTA_BASE = 'https://api.opendota.com/api'

async function openDotaGet<T> (path: string): Promise<T> {
  const res = await fetch(`${OPENDOTA_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`OpenDota ${path} → ${res.status}`)
  }
  return res.json() as Promise<T>
}

/** Елемент відповіді GET /players/{account_id}/heroes. */
export interface IOpenDotaPlayerHero {
  hero_id: string
  games: number
  win: number
}

/** Запис у GET /constants/heroes (мапа id → герой). */
export interface IOpenDotaHeroConstant {
  id: number
  /** Напр. `npc_dota_hero_antimage`. */
  name: string
  /** Локалізована назва, напр. `Anti-Mage`. */
  localized_name: string
}

export type TOpenDotaHeroConstants = Record<string, IOpenDotaHeroConstant>

/** SteamID64 → 32-бітний OpenDota account_id. Повертає null, якщо id невалідний. */
export function steamId64ToAccountId (steamId: string | null | undefined): string | null {
  const raw = typeof steamId === 'string' ? steamId.trim() : ''
  if (!/^\d{17}$/.test(raw)) return null
  try {
    const accountId = BigInt(raw) - 76561197960265728n
    if (accountId <= 0n) return null
    return accountId.toString()
  } catch {
    return null
  }
}

/** Короткe ім'я героя для Stratz CDN: `npc_dota_hero_antimage` → `antimage`. */
export function heroShortName (constantName: string | undefined | null): string {
  return (constantName ?? '').replace(/^npc_dota_hero_/, '')
}

/**
 * URL іконки героя на Stratz CDN. Слаги збігаються з внутрішніми іменами Dota
 * (напр. Necrophos → `necrolyte`) — це коректно; зрідка CDN віддає 503/504,
 * тоді в UI спрацьовує запасний бокс із літерою.
 */
export function heroIconUrl (constantName: string | undefined | null): string {
  const short = heroShortName(constantName)
  return short ? `https://cdn.stratz.com/images/dota2/heroes/${short}_icon.png` : ''
}

/**
 * Великий портрет героя (256×144) зі Steam CDN — для плиток, де іконка Stratz (32 px) замала.
 * Приймає і внутрішнє ім'я (`npc_dota_hero_pudge`), і коротке (`pudge`).
 */
export function heroPortraitUrl (constantName: string | undefined | null): string {
  const short = heroShortName(constantName)
  return short ? `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${short}.png` : ''
}

class OpenDotaService {
  async getPlayerHeroes (accountId: string): Promise<IOpenDotaPlayerHero[]> {
    const data = await openDotaGet<IOpenDotaPlayerHero[]>(`/players/${accountId}/heroes`)
    return Array.isArray(data) ? data : []
  }

  async getHeroConstants (): Promise<TOpenDotaHeroConstants> {
    const data = await openDotaGet<TOpenDotaHeroConstants>('/constants/heroes')
    return data ?? {}
  }
}

export const openDotaService = new OpenDotaService()
