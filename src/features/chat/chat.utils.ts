import dayjs from 'dayjs'
import type { TChatChannelKind, TChatMessage, TChatPlayer } from '@/api/types/api.types'
import type { TChatBodySegment } from '@/features/chat/chat.d'

/** Ліміти — ті самі, що й на бекенді (`chat.constants.ts`). */
export const CHAT_MESSAGE_MAX_LENGTH = 1000
/** Лічильник символів у полі вводу зʼявляється ближче до ліміту. */
export const CHAT_COUNTER_FROM = 800
export const CHAT_HISTORY_PAGE = 50
/** Скільки показуємо «Пише…» після останньої події набору. */
export const CHAT_TYPING_TTL_MS = 5_000
/** Не частіше одного `chat:typing` за цей час. */
export const CHAT_TYPING_EMIT_MS = 2_000
/** Повідомлення одного автора в межах цього часу склеюються в групу (без повторного аватара). */
export const CHAT_GROUP_GAP_MS = 5 * 60_000

/** Помилка команди: `code` — від сервера (`forbidden`, `rate_limited`, …) або `timeout`/`offline`. */
export class ChatCommandError extends Error {
  constructor (readonly code: string, message: string) {
    super(message)
  }
}

export const CHAT_PUBLIC_KINDS: readonly TChatChannelKind[] = ['general', 'captains', 'duel']

export function isPublicChannel (kind: TChatChannelKind | string): boolean {
  return (CHAT_PUBLIC_KINDS as readonly string[]).includes(kind)
}

export function channelKindOf (channelKey: string): TChatChannelKind {
  return channelKey.split(':')[0] as TChatChannelKind
}

export function adminThreadKey (ownerId: string): string {
  return `admin:${ownerId.toLowerCase()}`
}

/** Обидві сторони мають один ключ: id у нижньому регістрі й відсортовані (як на бекенді). */
export function directKey (a: string, b: string): string {
  const [x, y] = [a.toLowerCase(), b.toLowerCase()].sort()
  return `dm:${x}:${y}`
}

/** Співрозмовник у `dm`-ключі. */
export function directPeerId (channelKey: string, selfId: string): string | null {
  const [kind, a, b] = channelKey.split(':')
  if (kind !== 'dm' || !a || !b) return null
  return a === selfId.toLowerCase() ? b : a
}

type TNamed = { discordName?: string | null; discordUsername?: string | null } | null | undefined

export function playerName (p: TNamed): string {
  return p?.discordName?.trim() || p?.discordUsername?.trim() || 'Гравець'
}

export function playerInitial (p: TNamed): string {
  return playerName(p).charAt(0).toUpperCase()
}

export function formatMessageTime (iso: string): string {
  return dayjs(iso).format('HH:mm')
}

export function formatMessageFull (iso: string): string {
  return dayjs(iso).format('DD.MM.YYYY HH:mm')
}

/** Підпис роздільника днів у стрічці. */
export function formatDayLabel (iso: string): string {
  const day = dayjs(iso).startOf('day')
  const today = dayjs().startOf('day')
  if (day.isSame(today)) return 'Сьогодні'
  if (day.isSame(today.subtract(1, 'day'))) return 'Вчора'
  return day.year() === today.year() ? day.format('DD.MM') : day.format('DD.MM.YYYY')
}

export function isSameDay (a: string, b: string): boolean {
  return dayjs(a).isSame(dayjs(b), 'day')
}

/** Нові повідомлення — в кінець; дублікати (ack + broadcast) відкидаються за id. */
export function mergeMessages (current: TChatMessage[], incoming: TChatMessage[]): TChatMessage[] {
  const byId = new Map(current.map(m => [m.id, m]))
  for (const m of incoming) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi
/** Розділові знаки в кінці посилання зазвичай належать реченню, а не URL. */
const TRAILING_PUNCT_RE = /[.,!?;:)\]}»"']+$/

function linkify (text: string): TChatBodySegment[] {
  const out: TChatBodySegment[] = []
  let last = 0
  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0
    let raw = match[0]
    const trailing = raw.match(TRAILING_PUNCT_RE)?.[0] ?? ''
    if (trailing) raw = raw.slice(0, -trailing.length)
    if (!raw) continue
    if (start > last) out.push({ type: 'text', text: text.slice(last, start) })
    out.push({ type: 'link', text: raw, href: raw.startsWith('www.') ? `https://${raw}` : raw })
    last = start + raw.length
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) })
  return out
}

function escapeRegExp (value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Розбиває текст на звичайні шматки, посилання та згадки. Підсвічуються лише
 * згадки, які сервер підтвердив (`message.mentions`), тож `@щось` без гравця лишається текстом.
 */
export function parseMessageBody (body: string, mentions: TChatPlayer[]): TChatBodySegment[] {
  const names = mentions
    .flatMap(p => [p.discordName, p.discordUsername]
      .filter((n): n is string => !!n?.trim())
      .map(n => ({ name: n.trim(), id: p.id })))
    .sort((a, b) => b.name.length - a.name.length)
  if (!names.length) return linkify(body)

  const mentionRe = new RegExp(`@(${names.map(n => escapeRegExp(n.name)).join('|')})`, 'giu')
  const out: TChatBodySegment[] = []
  let last = 0
  for (const match of body.matchAll(mentionRe)) {
    const start = match.index ?? 0
    const hit = names.find(n => n.name.toLowerCase() === match[1].toLowerCase())
    if (!hit) continue
    if (start > last) out.push(...linkify(body.slice(last, start)))
    out.push({ type: 'mention', text: match[0], playerId: hit.id })
    last = start + match[0].length
  }
  if (last < body.length) out.push(...linkify(body.slice(last)))
  return out
}
