import { ERole } from '@/types/general.types'
import get from 'lodash/get'
import type { LocationQueryValue, Router } from 'vue-router'

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

export function goBack (router: Router) {
  router.back()
}

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
  return player.user_name?.toLowerCase().includes(search.toLowerCase()) ||
         player.steam_name?.toLowerCase().includes(search.toLowerCase())
}

function checkRoles (roles: TRole[], roleName: ERole) {
  if (!roles?.length || !roleName) return false

  return roles.some(role => role.type_name === roleName)
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
