import { buildTwitchPlayerUrl } from '@/config/streaming'
import { DUEL_TOURNAMENT_STREAM_URL_MAX, duelStreamUrlError } from '@/views/duels/duels.utils'
import { pluralizeUk } from '@/views/players/player-achievements.utils'
import type { TIconName } from '@/components/Icon.vue'
import type {
  TDuelBracketMatch,
  TDuelBracketMatchResult,
  TDuelBracketStatus,
  TDuelBracketStreamerLinks
} from '@/api/types/api.types'

/** Дзеркало валідації бекенду (`duel-bracket.dto.ts` / `duel.constants.ts`). */
export const DUEL_BRACKET_MIN_PARTICIPANTS = 2
export const DUEL_BRACKET_MAX_PARTICIPANTS = 64
export const DUEL_BRACKET_DESCRIPTION_MAX = 2000
/** Призи сітки — лише за місця 1–4 (3 і 4 розігрує матч за третє місце). */
export const DUEL_BRACKET_PRIZE_PLACE_MAX = 4
/** Розміри сітки, які пропонуємо в формі; будь-яке число 2–64 теж працює (зайві слоти — bye). */
export const DUEL_BRACKET_SIZE_PRESETS = [4, 8, 16, 32, 64] as const

/** Як часто сторінка турніру перечитує сітку, поки матчі грають. */
export const DUEL_BRACKET_LIVE_POLL_MS = 8_000
/** …і поки йде реєстрація (нові учасники). */
export const DUEL_BRACKET_IDLE_POLL_MS = 30_000

/** Фірмовий колір Twitch — акцент розділу медіа-турнірів. */
export const TWITCH_PURPLE_RGB = '145, 70, 255'

export const duelBracketStatusLabels: Record<TDuelBracketStatus, string> = {
  REGISTRATION: 'Реєстрація',
  LIVE: 'Наживо',
  FINISHED: 'Завершено',
  CANCELLED: 'Скасовано'
}

/** Підпис порожнього слота (bye): гравець проходить далі без гри. */
export const DUEL_BRACKET_BYE_LABEL = 'Без противника'

export const duelBracketResultLabels: Record<TDuelBracketMatchResult, string> = {
  played: 'Зіграно',
  forfeit: 'Технічна перемога',
  bye: DUEL_BRACKET_BYE_LABEL,
  manual: 'Рішення організатора'
}

/**
 * Назва раунду: «Фінал», «Півфінал», «Чвертьфінал», «1/8 фіналу»…, або
 * «Матч за 3 місце». `round` — 1-based, `rounds` — скільки раундів у сітці.
 */
export function bracketRoundLabel (round: number, rounds: number, isThirdPlace = false): string {
  if (isThirdPlace) return 'Матч за 3 місце'
  const fromEnd = rounds - round
  if (fromEnd <= 0) return 'Фінал'
  if (fromEnd === 1) return 'Півфінал'
  if (fromEnd === 2) return 'Чвертьфінал'
  return `1/${2 ** fromEnd} фіналу`
}

/** Коротка назва для вузької колонки сітки. */
export function bracketRoundShortLabel (round: number, rounds: number, isThirdPlace = false): string {
  if (isThirdPlace) return '3 місце'
  const fromEnd = rounds - round
  if (fromEnd <= 0) return 'Фінал'
  if (fromEnd === 1) return '1/2'
  if (fromEnd === 2) return '1/4'
  return `1/${2 ** fromEnd}`
}

/** «1», «2», …, а для спільних місць — діапазон: 5 → «5–8». */
export function bracketPlaceLabel (place: number): string {
  if (place <= 4) return String(place)
  return `${place}–${(place - 1) * 2}`
}

/** Матч ще може змінитись (грається або чекає). */
export function isBracketMatchOpen (match: TDuelBracketMatch): boolean {
  return match.status !== 'DONE'
}

/** Чи грає цей гравець у матчі. */
export function isPlayerInMatch (match: TDuelBracketMatch, playerId: string | null | undefined): boolean {
  return !!playerId && (match.player1?.id === playerId || match.player2?.id === playerId)
}

/**
 * Twitch-канал із посилання на стрім (twitch.tv/<channel>) — для вбудованого плеєра;
 * null для інших платформ або сторінок не-каналу (відео, кліпи).
 */
export function twitchChannelOf (url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (!/(^|\.)twitch\.tv$/i.test(parsed.hostname)) return null
    const [first, second] = parsed.pathname.split('/').filter(Boolean)
    if (!first || second) return null
    if (['videos', 'directory', 'clip', 'search', 'p', 'downloads'].includes(first.toLowerCase())) return null
    return /^[a-z0-9_]{3,25}$/i.test(first) ? first.toLowerCase() : null
  } catch {
    return null
  }
}

/** Назва платформи стріму для кнопки: Twitch / YouTube / Kick / «Стрім». */
export function streamPlatformOf (url: string | null | undefined): 'twitch' | 'youtube' | 'kick' | 'other' {
  if (!url) return 'other'
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.endsWith('twitch.tv')) return 'twitch'
    if (host.endsWith('youtube.com') || host === 'youtu.be') return 'youtube'
    if (host.endsWith('kick.com')) return 'kick'
  } catch {
    // невалідне посилання — показуємо як «стрім»
  }
  return 'other'
}

/** Платформи, плеєр яких вбудовуємо на сторінку турніру («прев’ю трансляції»). */
export type TStreamPreviewPlatform = Exclude<ReturnType<typeof streamPlatformOf>, 'other'>

export const STREAM_PREVIEW_PLATFORMS: ReadonlyArray<{
  key: TStreamPreviewPlatform
  label: string
  /** Іконка з `Icon.vue`; Twitch — лого Phosphor (у наборі `Icon.vue` його немає). */
  icon: TIconName | null
  placeholder: string
  hint: string
}> = [
  {
    key: 'twitch',
    label: 'Twitch',
    icon: null,
    placeholder: 'https://twitch.tv/ваш_канал',
    hint: 'Посилання на канал — плеєр Twitch вбудуємо прямо на сторінку турніру.'
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: 'youtube',
    placeholder: 'https://youtube.com/live/…',
    hint: 'Посилання на саму трансляцію (youtube.com/live/… або watch?v=…) чи на канал youtube.com/channel/UC… ' +
      '— за @нікнеймом YouTube вбудувати плеєр не дає.'
  },
  {
    key: 'kick',
    label: 'Kick',
    icon: 'kick',
    placeholder: 'https://kick.com/ваш_канал',
    hint: 'Посилання на канал — плеєр Kick вбудуємо прямо на сторінку турніру.'
  }
]

/** Kick-канал із посилання kick.com/<channel>; null для відео, кліпів, категорій. */
export function kickChannelOf (url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (!/^(www\.)?kick\.com$/i.test(parsed.hostname)) return null
    const [first, second] = parsed.pathname.split('/').filter(Boolean)
    if (!first || second) return null
    if (['video', 'videos', 'clips', 'categories', 'category', 'browse', 'search', 'following']
      .includes(first.toLowerCase())) return null
    return /^[a-z0-9_-]{3,25}$/i.test(first) ? first.toLowerCase() : null
  } catch {
    return null
  }
}

/**
 * URL вбудованого плеєра YouTube: конкретна трансляція/відео (watch?v=, youtu.be, /live/, /embed/)
 * або поточний ефір каналу (/channel/UC…). Нікнейм @handle без API в id каналу не перетворити — null.
 */
export function youtubeEmbedUrlOf (url: string | null | undefined): string | null {
  if (!url) return null
  const params = 'autoplay=1&mute=1'
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const [first, second] = parsed.pathname.split('/').filter(Boolean)
    let videoId: string | null = null
    if (host === 'youtu.be') {
      videoId = first ?? null
    } else if (/^(www\.|m\.)?youtube\.com$/.test(host)) {
      if (first === 'watch') videoId = parsed.searchParams.get('v')
      else if (first === 'live' || first === 'embed') videoId = second ?? null
      else if (first === 'channel' && second && /^UC[\w-]{22}$/.test(second)) {
        return `https://www.youtube.com/embed/live_stream?channel=${second}&${params}`
      }
    }
    return videoId && /^[\w-]{11}$/.test(videoId) ? `https://www.youtube.com/embed/${videoId}?${params}` : null
  } catch {
    return null
  }
}

/** Що вбудовувати в «екран» турніру за посиланням на стрім; null — лише кнопкою-посиланням. */
export function streamEmbedOf (
  url: string | null | undefined,
  parentHost: string
): { platform: TStreamPreviewPlatform; embedUrl: string; channel: string | null } | null {
  const twitch = twitchChannelOf(url)
  if (twitch) return { platform: 'twitch', embedUrl: buildTwitchPlayerUrl(parentHost, twitch), channel: twitch }
  const kick = kickChannelOf(url)
  if (kick) {
    return { platform: 'kick', embedUrl: `https://player.kick.com/${kick}?autoplay=true&muted=true`, channel: kick }
  }
  const youtube = youtubeEmbedUrlOf(url)
  if (youtube) return { platform: 'youtube', embedUrl: youtube, channel: null }
  return null
}

/** Помилка посилання на стрім для обраної платформи прев’ю або порожній рядок. */
export function streamPreviewUrlError (platform: TStreamPreviewPlatform, value: string): string {
  const link = value.trim()
  if (!link) return ''
  const generic = duelStreamUrlError(link)
  if (generic) return generic
  const meta = STREAM_PREVIEW_PLATFORMS.find(p => p.key === platform)!
  if (streamPlatformOf(link) !== platform) return `Це не посилання ${meta.label}: ${meta.placeholder}`
  if (streamEmbedOf(link, 'localhost')?.platform !== platform) {
    return platform === 'youtube'
      ? 'Потрібне посилання на трансляцію (youtube.com/live/…) або канал youtube.com/channel/UC…'
      : `Потрібне посилання на канал: ${meta.placeholder}`
  }
  return ''
}

export type TStreamerPlatform = keyof TDuelBracketStreamerLinks

/** Канали стрімера, окрім основного посилання на стрім. Дзеркало `DuelBracketStreamerLinksDto`. */
export const STREAMER_LINK_PLATFORMS: ReadonlyArray<{
  key: TStreamerPlatform
  label: string
  icon: TIconName
  placeholder: string
  /** Дозволені домени (з піддоменами) — як у валідації бекенду. */
  hosts: readonly string[]
  /** Фірмовий колір для кнопки. */
  rgb: string
}> = [
  { key: 'telegram', label: 'Telegram', icon: 'telegram', placeholder: 'https://t.me/ваш_канал', hosts: ['t.me', 'telegram.me'], rgb: '38, 165, 228' },
  { key: 'kick', label: 'Kick', icon: 'kick', placeholder: 'https://kick.com/ваш_канал', hosts: ['kick.com'], rgb: '83, 252, 24' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube', placeholder: 'https://youtube.com/@ваш_канал', hosts: ['youtube.com', 'youtu.be'], rgb: '255, 0, 0' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok', placeholder: 'https://tiktok.com/@ваш_акаунт', hosts: ['tiktok.com'], rgb: '255, 0, 80' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram', placeholder: 'https://instagram.com/ваш_акаунт', hosts: ['instagram.com'], rgb: '225, 48, 108' }
]

/** Помилка посилання на канал стрімера (необов’язкове) або порожній рядок. */
export function streamerLinkError (platform: TStreamerPlatform, value: string): string {
  const link = value.trim()
  if (!link) return ''
  const meta = STREAMER_LINK_PLATFORMS.find(p => p.key === platform)!
  try {
    const url = new URL(link)
    const host = url.hostname.toLowerCase()
    const okHost = meta.hosts.some(h => host === h || host.endsWith(`.${h}`))
    if ((url.protocol === 'http:' || url.protocol === 'https:') && okHost && link.length <= DUEL_TOURNAMENT_STREAM_URL_MAX) {
      return ''
    }
  } catch {
    // невалідна адреса — нижче загальна помилка
  }
  return `Потрібне посилання ${meta.label}: ${meta.placeholder.replace(/ваш_\S+$/, '…')}`
}

export const pluralizeBracketPlayers = (n: number) => pluralizeUk(n, 'гравець', 'гравці', 'гравців')
