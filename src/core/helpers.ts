import { ERole } from '@/types/general.enums'
import type { LocationQuery, LocationQueryValue, RouteLocationNormalized } from 'vue-router'
import type { TPlayerRankDto, TTournamentFormat } from '@/api/types/api.types'
import { getDotaPositionLabel, roleLabelMap } from '@/components/player-tags/player.enums'

/** `lodash/get` для рядкового шляху (`a.b.c`) — без окремого пакета lodash у головному чанку. */
const getByPath = (source: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>(
    (acc, segment) => (acc == null ? undefined : (acc as Record<string, unknown>)[segment]),
    source
  )

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
    const key = getByPath(current, prop as string) as T[Prop]

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

/**
 * Справжній ID матчу Dota 2 — лише цифри. Технічні поразки зберігаються з
 * префіксом (`tech_loss_<uuid>`), для них сторінки на Dotabuff не існує.
 */
export function isDotaMatchId (value: string | null | undefined): value is string {
  return typeof value === 'string' && /^\d+$/.test(value)
}

export function getDotabuffMatchUrl (dotaMatchId: string | null | undefined) {
  return isDotaMatchId(dotaMatchId) ? `https://www.dotabuff.com/matches/${dotaMatchId}` : null
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

const TOURNAMENT_FORMAT_ORDER: TTournamentFormat[] = ['ONLINE', 'LAN']

/** Формати «Хочу грати» гравця у сталому порядку (ONLINE, LAN); толерантно до сміття з API. */
export function getPlayerWantToPlay (p: { wantToPlay?: unknown } | null | undefined): TTournamentFormat[] {
  const raw = p?.wantToPlay
  if (!Array.isArray(raw) || !raw.length) return []
  const set = new Set(raw.map((v) => String(v).toUpperCase()))
  return TOURNAMENT_FORMAT_ORDER.filter((f) => set.has(f))
}

/** Міста для LAN-турнірів гравця (лише непорожні рядки, без дублікатів). */
export function getPlayerLanCities (p: { lanCities?: unknown } | null | undefined): string[] {
  const raw = p?.lanCities
  if (!Array.isArray(raw) || !raw.length) return []
  return [...new Set(raw.map((v) => String(v ?? '').trim()).filter(Boolean))]
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
  wins?: number | null
  losses?: number | null
}

/** Перемоги / поразки → загальна кількість, текст і колір вінрейту для блоку статистики. */
export function getPlayerMatchStats (p: TPlayerMatchRecord | null | undefined) {
  const wins = Math.max(0, Number(p?.wins ?? 0) || 0)
  const losses = Math.max(0, Number(p?.losses ?? 0) || 0)
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

/**
 * Адмін для відображення (золота рамка, перша група в реєстрі). «IT» має ті самі права
 * (`isAdminRole`), але візуально не виділяється — тож тут його не враховуємо.
 * Для перевірки доступу використовуй `hasAdminRole`.
 */
export function hasDisplayAdminRole (
  roles: readonly { name: string; isAdminRole?: boolean }[] | undefined | null
): boolean {
  return !!roles?.some(r => r.isAdminRole && !hasPlayerRole([r], ERole.DEV))
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

/**
 * Гравець верифікований, якщо є `verifiedAt` або роль «Гравець».
 * Ролі «Медіа» (стрімери), «Адмін» та «IT» також вважаються верифікованими — інші ролі їм не потрібні.
 */
export function isPlayerVerified (
  player: { roles?: readonly { name: string }[] | null; verifiedAt?: string | null } | null | undefined
): boolean {
  if (!player) return false
  if (player.verifiedAt) return true
  return [ERole.PLAYER, ERole.MEDIA, ERole.ADMIN, ERole.DEV].some(role => hasPlayerRole(player.roles, role))
}

type TVipFramePlayer = { isVip?: boolean; vipFrameColor?: string | null } | null | undefined

/**
 * Steam, Dotabuff і Discord ЧУЖОГО гравця відкриті VIP, медіа та адмінам;
 * свої профілі власник бачить завжди. Решта бачить замок із пропозицією VIP.
 */
export function canViewPlayerProfileLinks (
  viewer: { id?: string; isVip?: boolean; roles?: readonly { name: string; isAdminRole?: boolean }[] | null }
  | null | undefined,
  targetId: string | null | undefined
): boolean {
  if (!viewer) return false
  if (targetId && viewer.id === targetId) return true
  return !!viewer.isVip || hasAdminRole(viewer.roles) || hasPlayerRole(viewer.roles, ERole.MEDIA)
}

/** VIP зараз (бек рахує `isVip` з `vipUntil`). */
export function isPlayerVip (player: { isVip?: boolean } | null | undefined): boolean {
  return !!player?.isVip
}

/** `#RRGGBB` → `"r, g, b"` для `rgba(var(--…-rgb), a)`; null для невалідного значення. */
function hexToRgbTriplet (hex: string): string | null {
  const m = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim())
  if (!m) return null
  return m.slice(1).map(part => parseInt(part, 16)).join(', ')
}

/**
 * Рольовий акцент рамки (картка, профіль): VIP — обраний колір, медіа — фіолет, адмін — золото.
 * Обраний VIP-колір має пріоритет над кольором ролі; без обраного кольору — колір ролі.
 * Повертає клас `.role-frame--*` з `_neon.scss` або порожній рядок.
 */
export function getPlayerRoleAccentClass (
  player: ({ roles?: readonly { name: string; isAdminRole?: boolean }[] | null } & TVipFramePlayer) | null | undefined
): '' | 'role-frame--gold' | 'role-frame--violet' | 'role-frame--vip' {
  if (!player) return ''
  if (getPlayerVipFrameStyle(player)) return 'role-frame--vip'
  // Медіа пріоритетніше за адмін-рамку: у медійника з адмін-правами рамка лишається фіолетовою.
  if (hasPlayerRole(player.roles, ERole.MEDIA)) return 'role-frame--violet'
  if (hasDisplayAdminRole(player.roles)) return 'role-frame--gold'
  return ''
}

/**
 * CSS-змінна для `.role-frame--vip`: ставиться на корінь картки / сторінки, звідки
 * її успадковують усі рамки. undefined — коли гравець не VIP або колір не обрано.
 */
export function getPlayerVipFrameStyle (player: TVipFramePlayer): Record<string, string> | undefined {
  if (!player?.isVip || !player.vipFrameColor) return undefined
  const rgb = hexToRgbTriplet(player.vipFrameColor)
  return rgb ? { '--vip-frame-rgb': rgb } : undefined
}

/** Єдиний текст тоста після копіювання: «<що саме> успішно скопійовано». */
export function formatCopiedMessage (label: string) {
  return `${label} успішно скопійовано`
}

/**
 * Копіює значення в буфер і показує тост. `label` — що саме скопійовано
 * («Discord», «Dota ID», «Посилання»), а не готове повідомлення.
 */
export function getCopy (data: number | string | undefined | null, label: string) {
  const { copy } = useClipboard({ legacy: true })

  if (!data) return

  copy(String(data))
  ElMessage.success(formatCopiedMessage(label))
}

/**
 * Повертає копію query, де `keys` замінено значеннями з `patch` (порожні —
 * прибрано), а решта параметрів лишається як є. Для модалок фільтрів, щоб
 * «Застосувати» не зтирало чужі параметри маршруту.
 */
export function replaceQueryKeys (
  query: LocationQuery,
  keys: readonly string[],
  patch: Record<string, string | undefined>
): Record<string, LocationQueryValue | LocationQueryValue[]> {
  const next: Record<string, LocationQueryValue | LocationQueryValue[]> = { ...query }
  for (const key of keys) delete next[key]
  for (const [key, value] of Object.entries(patch)) {
    if (value != null && value !== '') next[key] = value
  }
  return next
}

export async function scrollToSection (section: HTMLElement | null) {
  await nextTick()
  if (section) {
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
