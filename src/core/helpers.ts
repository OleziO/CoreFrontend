import { ERole } from '@/types/general.types'
import get from 'lodash/get'
import type { LocationQueryValue, RouteLocationNormalized } from 'vue-router'
import type { TPlayer, TUserRole as UserRole } from '@/api/types/api.types'

export const createHashedObject = <
  T extends TIndexedObject,
  Prop extends keyof T,
  ValueArray extends boolean = false
>(
  array: T[] = [],
  prop: Prop = 'id' as Prop,
  isValueArray?: ValueArray,
  shouldRemoveKeyField?: boolean
): Record<T[Prop], ValueArray extends true ? T[] : T> => {
  return array.reduce((acc, current) => {
    const key = get(current, prop as string) as unknown as T[Prop]

    if (shouldRemoveKeyField) {
      delete current[prop]
    }

    if (isValueArray) {
      const existingValue = acc[key] as T[] | undefined
      acc[key] = [...(Array.isArray(existingValue) ? existingValue : []), current] as ValueArray extends true ? T[] : T
    } else {
      acc[key] = current as ValueArray extends true ? T[] : T
    }

    return acc
  }, {} as Record<T[Prop], ValueArray extends true ? T[] : T>)
}

// export function goBack (router: Router) {
//   router.back()
// }

export function getImageUrl (imgUrl: string | null | undefined) {
  return import.meta.env.VITE_API_PUBLIC_URL + imgUrl
}

export function getDiscordProfileUrl (discordId: string | null | undefined) {
  return `https://discord.com/users/${discordId}`
}

export function getSteamProfileUrl (steamId: string | null | undefined) {
  return `https://steamcommunity.com/profiles/${steamId}`
}

export function getDotabuffProfileUrl (dotabuffId: string | null | undefined) {
  return `https://dotabuff.com/players/${dotabuffId}`
}

/** Single value from vue-router query (handles `?code=a&code=b` → first). */
export function firstQueryValue (value: RouteLocationNormalized['query'][string]) {
  if (value == null) return undefined

  const raw = Array.isArray(value) ? value[0] : value

  return raw ?? undefined
}

export function parseQueryArray<T = string> (
  value: LocationQueryValue | LocationQueryValue[],
  mapper: (v: string) => T = v => v as unknown as T
): T[] {
  if (value == null) return []

  if (Array.isArray(value)) value = value.filter(v => v != null).join(',')

  if (!value) return []

  return value.split(',').map(mapper)
}

export function formatDate (date: Date) {
  return date.toLocaleDateString('uk-UA').slice(0, 10)
}

export function searchPlayer (player: TPlayer, search = '') {
  if (!search) return true
  return player.discordUsername?.toLowerCase().includes(search.toLowerCase()) ||
         player.discordName?.toLowerCase().includes(search.toLowerCase()) ||
         player.steamId?.toLowerCase().includes(search.toLowerCase())
}

/** totalWinMatches / totalLostMatches з беку (роль гравця). */
export type TPlayerMatchRecord = {
  totalWinMatches?: number | null
  totalLostMatches?: number | null
}

/**
 * total матчів = перемоги + поразки; у дужках відсоток перемог: >50% зелений, <50% червоний, рівно 50% сірий.
 * Без матчів — 0%.
 */
export function getPlayerMatchStats (p: TPlayerMatchRecord | null | undefined) {
  const wins = Math.max(0, Number(p?.totalWinMatches ?? 0) || 0)
  const losses = Math.max(0, Number(p?.totalLostMatches ?? 0) || 0)
  const total = wins + losses

  let winrateClass = 'text-red-400/90'
  let winrateText = '0'

  if (total > 0) {
    const pct = Math.round((wins * 100) / total)
    winrateText = String(pct)
    if (wins * 2 === total) {
      winrateClass = 'text-gray-400'
    } else if (wins * 2 > total) {
      winrateClass = 'text-emerald-400'
    } else {
      winrateClass = 'text-red-400'
    }
  }

  return { wins, losses, total, winrateText, winrateClass }
}

function checkRoles (roles: UserRole[], roleName: ERole) {
  if (!roles?.length || !roleName) return false

  return roles.some(role => role.name === roleName)
}

export function getCopy (data: number | string | undefined | null, message: string) {
  const { copy } = useClipboard()

  if (!data) return

  copy(data as string)
  ElMessage.success(message)
}

export async function scrollToSection (section: HTMLElement | null) {
  await nextTick()
  if (section) {
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default checkRoles
