import type { TChatChannelKind, TChatMessage, TChatPlayer } from '@/api/types/api.types'

/** Доступ до каналів, як його бачить сервер (`chat:access`). `playerId: null` — гість. */
export interface IChatAccess {
  playerId: string | null
  isAdmin: boolean
  canCaptains: boolean
  canDuel: boolean
  readOnly: boolean
}

/** Непрочитане одного каналу (рядок `chat:unread`). */
export interface IChatUnreadChannel {
  channelKey: string
  channelKind: TChatChannelKind
  unread: number
  mentions: number
  /** Співрозмовник для `dm`-каналів. */
  peer: TChatPlayer | null
}

export interface IChatUnreadSummary {
  channels: IChatUnreadChannel[]
  /** Лише для адмінів: треди підтримки з непрочитаними повідомленнями власника. */
  adminUnreadThreadKeys: string[]
}

export interface IChatReadMarker {
  channelKey: string
  lastReadAt: string
}

export interface IChatTyping {
  channelKey: string
  playerId: string
  isAdmin: boolean
}

export interface IChatPresence {
  playerId: string
  online: boolean
}

export interface IChatPurged {
  channelKinds: TChatChannelKind[]
  before: string
}

/** Події сервер → клієнт (дзеркало `CHAT_EVENTS` у `ChatGateway` на бекенді). */
export interface IChatSocketServerEvents {
  'chat:access': (access: IChatAccess) => void
  'chat:message': (message: TChatMessage) => void
  'chat:message-deleted': (payload: { id: string; channelKey: string }) => void
  'chat:unread': (summary: IChatUnreadSummary) => void
  'chat:read': (marker: IChatReadMarker) => void
  'chat:typing': (typing: IChatTyping) => void
  'chat:presence': (presence: IChatPresence) => void
  'chat:purged': (payload: IChatPurged) => void
  'chat:error': (payload: { error: string }) => void
}

/** Відповідь сервера на команду (socket.io ack). */
export type TChatAck<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; message: string }

/** Вкладка панелі чату. Публічні та «Адмін» — фіксовані, `dm` — закривані. */
export type TChatTabId = 'general' | 'captains' | 'duel' | 'admin' | `dm:${string}`

/** Відкрита вкладка приватного чату: зберігається в localStorage разом із карткою співрозмовника. */
export interface IChatDirectTab {
  channelKey: string
  peer: TChatPlayer
}

/** Стан завантаженої історії одного каналу. */
export interface IChatChannelState {
  messages: TChatMessage[]
  hasMore: boolean
  loading: boolean
  loaded: boolean
}

/** Геометрія плаваючого вікна на десктопі (px від лівого верхнього кута вʼюпорту). */
export interface IChatPanelGeometry {
  x: number
  y: number
  width: number
  height: number
}

/** Шматок тексту повідомлення для безпечного рендеру (без v-html). */
export type TChatBodySegment =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; href: string }
  | { type: 'mention'; text: string; playerId: string }
  | { type: 'command'; text: string }

/** Пункт автодоповнення після `@`: гравець або команда (`@online`). */
export type TChatMentionSuggestion =
  | { type: 'player'; player: TChatPlayer }
  | { type: 'command'; name: string; description: string }

/** Звук нового повідомлення: свій для кожного типу каналу + окремий для згадки. */
export type TChatSoundKind = 'general' | 'captains' | 'duel' | 'admin' | 'dm' | 'mention'

/** Налаштування звуків (localStorage): загальний вимикач + окремо для кожного типу. */
export interface IChatSoundSettings {
  enabled: boolean
  kinds: Record<TChatSoundKind, boolean>
}

/** Мінімум про гравця, з яким відкривають приватний чат (профіль, друзі, автор повідомлення). */
export interface IChatPeerInput {
  id: string
  discordName?: string | null
  discordUsername?: string | null
  avatarUrl?: string | null
}
