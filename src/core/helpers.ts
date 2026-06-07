import { ERole } from '@/types/general.enums'
import get from 'lodash/get'
import type { LocationQueryValue, RouteLocationNormalized } from 'vue-router'
import type { TPlayerRankDto } from '@/api/types/api.types'
import { getDotaPositionLabel, roleLabelMap } from '@/components/player-tags/player.enums'

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
    const key = get(current, prop as string) as T[Prop]

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

export function resolvePublicOrApiUrl (path: string | null | undefined): string {
  const raw = typeof path === 'string' ? path.trim() : ''
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('//')) return `https:${raw}`
  const base = String(import.meta.env.VITE_API_PUBLIC_URL ?? '').replace(/\/+$/, '')
  const p = raw.startsWith('/') ? raw : `/${raw}`

  return base ? `${base}${p}` : p
}

export function getImageUrl (imgUrl: string | null | undefined) {
  return resolvePublicOrApiUrl(imgUrl)
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

export function getDotabuffTeamUrl (dotaTeamId: string | null | undefined) {
  return `https://www.dotabuff.com/esports/teams/${dotaTeamId}`
}

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

const basePublicUrl = () => import.meta.env.BASE_URL.replace(/\/?$/, '/')

function coerceFiniteRankInt (value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? Math.trunc(n) : null
  }
  return null
}

export function resolvePlayerRankNumericName (rank: unknown): number | null {
  if (rank == null || typeof rank !== 'object') return null
  const r = rank as Record<string, unknown>
  return coerceFiniteRankInt(r.numericName ?? r.numeric_name)
}

export function coercePlayerRankFromApi (rank: unknown): TPlayerRankDto | null {
  const numericName = resolvePlayerRankNumericName(rank)
  if (numericName == null) return null
  if (rank == null || typeof rank !== 'object') {
    return { numericName, rankNumber: 0, stars: 0, nameUk: '' }
  }
  const r = rank as Record<string, unknown>
  return {
    numericName,
    rankNumber: coerceFiniteRankInt(r.rankNumber ?? r.rank_number) ?? 0,
    stars: coerceFiniteRankInt(r.stars) ?? 0,
    nameUk: typeof r.nameUk === 'string' ? r.nameUk : typeof r.name_uk === 'string' ? r.name_uk : ''
  }
}

export function getPlayerRankImageSrcFromPlayerRank (rank: unknown): string {
  return getPlayerRankImageSrc(resolvePlayerRankNumericName(rank))
}

export function getPlayerRankImageSrc (numericName: number | null | undefined): string {
  if (numericName == null) return ''
  return `${basePublicUrl()}images/ranks/${numericName}.png`
}

export function formatPlayerRatingMmr (rating: number | null | undefined): string {
  if (rating == null) return '— MMR'
  return `${rating} MMR`
}

export function getPlayerDotaPositions (p: { positions?: unknown } | null | undefined): number[] {
  if (!p?.positions) return []
  const raw = p.positions
  if (!Array.isArray(raw) || !raw.length) return []
  return raw
    .map(n => Number(n))
    .filter(n => n >= 1 && n <= 5)
    .sort((a, b) => a - b)
}

export type TPlayerPositionsSummary = {
  hasPositions: boolean
  oneLine: string
  rows: { id: number; label: string }[]
}

export function formatPlayerPositionsSummary (p: { positions?: unknown } | null | undefined): TPlayerPositionsSummary {
  const ids = getPlayerDotaPositions(p)
  if (!ids.length) {
    return { hasPositions: false, oneLine: 'Позиції не вказані', rows: [] }
  }
  const rows = ids.map(id => ({ id, label: getDotaPositionLabel(id) }))
  return {
    hasPositions: true,
    oneLine: rows.map(r => `${r.id}. ${r.label}`).join(' · '),
    rows
  }
}

export type TPlayerMatchRecord = {
  totalWinMatches?: number | null
  totalLostMatches?: number | null
}

export function getPlayerMatchStats (p: (TPlayer | TPlayerMatchRecord) | null | undefined) {
  const wins = Math.max(0, Number((p as TPlayerMatchRecord)?.totalWinMatches ?? 0) || 0)
  const losses = Math.max(0, Number((p as TPlayerMatchRecord)?.totalLostMatches ?? 0) || 0)
  const total = wins + losses

  let winrateClass = 'text-red-400/90'
  let winrateText = '0'

  if (total > 0) {
    const pct = Math.round((wins * 100) / total)
    winrateText = String(pct)
    if (wins * 2 === total) {
      winrateClass = 'text-gray-400'
    } else if (wins * 2 > total) {
      winrateClass = 'text-green-400'
    } else {
      winrateClass = 'text-red-400'
    }
  }

  return { wins, losses, total, winrateText, winrateClass }
}

export function hasPlayerRole (roles: readonly { name: string }[] | undefined | null, role: ERole): boolean {
  if (!roles?.length || !role) return false

  const labelUk = roleLabelMap[role]
  return roles.some(r => r.name === role || r.name === labelUk)
}

/** Єдиний предикат адмінського доступу — за прапором `isAdminRole`, а не за назвою ролі. */
export function hasAdminRole (roles: readonly { isAdminRole?: boolean }[] | undefined | null): boolean {
  return !!roles?.some(r => r.isAdminRole)
}

const ROLE_FILTER_UUID_RE =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i

export function playerMatchesRoleFilterToken (
  player: { roles?: readonly { name: string; id?: string }[] | null },
  rawToken: string,
  roleCatalog?: readonly { id: string; name: string }[]
): boolean {
  const token = rawToken.trim()
  if (!token || !player.roles?.length) return false
  const pr = player.roles

  if (ROLE_FILTER_UUID_RE.test(token)) {
    if (pr.some(r => r.id === token)) return true
    const cat = roleCatalog?.find(c => c.id === token)
    if (cat) return pr.some(r => r.name === cat.name)
    return false
  }

  const asEnum = token as ERole
  if (Object.values(ERole).includes(asEnum)) {
    return hasPlayerRole(pr, asEnum)
  }
  return pr.some(r => r.name === token)
}

export function isPlayerVerified (
  player: { roles?: readonly { name: string }[] | null; verifiedAt?: string | null } | null | undefined
): boolean {
  if (!player) return false
  if (player.verifiedAt) return true
  return hasPlayerRole(player.roles, ERole.PLAYER)
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
