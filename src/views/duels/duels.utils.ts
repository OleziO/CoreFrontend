import { pluralizeUk } from '@/views/players/player-achievements.utils'
import type {
  TDuel,
  TDuelCancelReason,
  TDuelFailReason,
  TDuelLobbySide,
  TDuelPlayer,
  TDuelQueueBlockedReason,
  TDuelState,
  TDuelStatsPlayer,
  THostBotStatus
} from '@/api/types/api.types'

/** Скільки очок переходить за дуель (дзеркало `DUEL_RATING_DELTA` на бекенді). */
export const DUEL_RATING_DELTA = 25
/** Полінг статусу, поки гравець у черзі або в дуелі. */
export const DUEL_STATUS_POLL_MS = 3000
/** Банер результату показуємо ще стільки після завершення дуелі. */
export const DUEL_RESULT_BANNER_TTL_MS = 10 * 60 * 1000

export const DUEL_ACTIVE_STATES: readonly TDuelState[] = ['PENDING', 'LOBBY_CREATING', 'WAITING_PLAYERS', 'LIVE']

export const duelStateLabels: Record<TDuelState, string> = {
  PENDING: 'Очікує бота',
  LOBBY_CREATING: 'Створюємо лобі',
  WAITING_PLAYERS: 'Чекаємо гравців',
  LIVE: 'Гра триває',
  RESOLVED: 'Завершено',
  CANCELLED: 'Скасовано',
  FAILED: 'Збій'
}

/** Кроки степпера активної дуелі — у порядку проходження. */
export const duelSteps: readonly TDuelStep[] = [
  { key: 'PENDING', label: 'Пара знайдена', hint: 'Чекаємо вільного бота-хоста' },
  { key: 'LOBBY_CREATING', label: 'Лобі', hint: 'Бот створює лобі та надсилає інвайти' },
  { key: 'WAITING_PLAYERS', label: 'Гравці', hint: 'Обидва мають зайти в лобі та обрати сторону' },
  { key: 'LIVE', label: 'Гра', hint: 'Матч запущено — результат зарахуємо автоматично' }
]

export const duelCancelReasonLabels: Record<TDuelCancelReason, string> = {
  players_no_show: 'Гравець не зайшов у лобі',
  lobby_not_created: 'Не вдалося створити лобі',
  no_bots_available: 'Не було вільного бота',
  admin: 'Скасовано адміністратором'
}

export const duelFailReasonLabels: Record<TDuelFailReason, string> = {
  lobby_lost: 'Лобі втрачено',
  game_timeout: 'Гра не завершилася вчасно',
  undetermined_outcome: 'Не вдалося визначити переможця'
}

export const duelQueueBlockedLabels: Record<TDuelQueueBlockedReason, string> = {
  steam_not_linked: 'Щоб грати 1v1, прив’яжіть Steam-акаунт у профілі',
  cooldown: 'Пауза після неявки — спробуйте трохи пізніше',
  active_duel: 'У вас уже є активна дуель',
  already_queued: 'Ви вже в черзі'
}

export const duelSideLabels: Record<TDuelLobbySide, string> = {
  radiant: 'Radiant',
  dire: 'Dire',
  unassigned: 'Без сторони'
}

export const hostBotStatusLabels: Record<THostBotStatus, string> = {
  OFFLINE: 'Офлайн',
  FREE: 'Вільний',
  BUSY: 'Зайнятий',
  BANNED: 'Забанений'
}

export function isDuelActive (duel: TDuel | null | undefined): boolean {
  return !!duel && DUEL_ACTIVE_STATES.includes(duel.state)
}

/** Індекс кроку степпера для стану; термінальні стани показують останній пройдений крок. */
export function duelStepIndex (state: TDuelState): number {
  const index = duelSteps.findIndex((step) => step.key === state)
  return index >= 0 ? index : duelSteps.length
}

/** Причина завершення (скасування чи збою) українською; порожній рядок для решти станів. */
export function duelEndReasonLabel (duel: TDuel): string {
  if (duel.state === 'CANCELLED' && duel.cancelReason) return duelCancelReasonLabels[duel.cancelReason]
  if (duel.state === 'FAILED' && duel.failReason) return duelFailReasonLabels[duel.failReason]
  return ''
}

export function duelOpponentOf (duel: TDuel, playerId: string | null | undefined): TDuelPlayer | null {
  if (!playerId) return null
  if (duel.player1?.id === playerId) return duel.player2
  if (duel.player2?.id === playerId) return duel.player1
  return null
}

export function duelOutcomeFor (duel: TDuel, playerId: string | null | undefined): TDuelOutcome {
  if (isDuelActive(duel)) return 'active'
  if (duel.state === 'FAILED') return 'failed'
  // Скасована дуель із неявкою все ж рухає рейтинг: у присутнього — нічого, у відсутнього −25.
  if (playerId && duel.winnerId === playerId) return 'win'
  if (playerId && duel.loserId === playerId) return 'loss'
  return 'cancelled'
}

/** ±delta з погляду гравця; null — рейтинг не змінювався (скасовано / збій / чужа дуель). */
export function duelDeltaFor (duel: TDuel, playerId: string | null | undefined): number | null {
  if (!playerId || duel.ratingDelta == null) return null
  if (duel.winnerId === playerId) return duel.ratingDelta
  if (duel.loserId === playerId) return -duel.ratingDelta
  return null
}

export function duelStatsFor (duel: TDuel, playerId: string | null | undefined): TDuelStatsPlayer | null {
  if (!playerId || !duel.stats) return null
  return duel.stats.players.find((p) => p.playerId === playerId) ?? null
}

export function toDuelHistoryRow (duel: TDuel, playerId: string | null | undefined): TDuelHistoryRow {
  return {
    duel,
    outcome: duelOutcomeFor(duel, playerId),
    opponent: duelOpponentOf(duel, playerId),
    delta: duelDeltaFor(duel, playerId),
    stats: duelStatsFor(duel, playerId)
  }
}

export const duelOutcomeLabels: Record<TDuelOutcome, string> = {
  win: 'Перемога',
  loss: 'Поразка',
  cancelled: 'Скасовано',
  failed: 'Збій',
  active: 'Триває'
}

export function duelPlayerName (player: TDuelPlayer | null | undefined): string {
  return player?.discordName || player?.discordUsername || 'Гравець'
}

export function duelPlayerInitial (player: TDuelPlayer | null | undefined): string {
  return duelPlayerName(player).charAt(0).toUpperCase()
}

const numberFormat = new Intl.NumberFormat('uk-UA')

export function formatDuelNumber (value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return numberFormat.format(Math.round(value))
}

export function formatDuelPercent (value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${Math.round(value)}%`
}

/** «+3» для серії перемог, «−2» для серії поразок, «—» без серії. */
export function formatDuelStreak (streak: number | null | undefined): string {
  if (!streak) return '—'
  return streak > 0 ? `+${streak}` : `−${Math.abs(streak)}`
}

/** «+25» / «−25» зі справжнім мінусом. */
export function formatDuelDelta (delta: number | null | undefined): string {
  if (delta == null || delta === 0) return '0'
  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`
}

/** Секунди → «M:SS» (або «H:MM:SS» після години). Від’ємні значення обрізаються до нуля. */
export function formatDuelCountdown (totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

/** Скільки секунд лишилося до `iso` відносно `now`; 0, коли дедлайн минув або дати немає. */
export function secondsUntil (iso: string | null | undefined, now: Date): number {
  if (!iso) return 0
  const target = new Date(iso).getTime()
  if (Number.isNaN(target)) return 0
  return Math.max(0, Math.ceil((target - now.getTime()) / 1000))
}

export function isWithinLast (iso: string | null | undefined, ms: number, now: Date): boolean {
  if (!iso) return false
  const at = new Date(iso).getTime()
  if (Number.isNaN(at)) return false
  return now.getTime() - at <= ms
}

/** KDA рядком: «7 / 2 / 1»; «—», коли знімка немає. */
export function formatDuelKda (stats: TDuelStatsPlayer | null | undefined): string {
  if (!stats) return '—'
  const part = (n: number | null) => (n == null ? '?' : String(n))
  return `${part(stats.kills)} / ${part(stats.deaths)} / ${part(stats.assists)}`
}

export const pluralizeDuels = (n: number) => pluralizeUk(n, 'дуель', 'дуелі', 'дуелей')
export const pluralizeDuelPlayers = (n: number) => pluralizeUk(n, 'гравець', 'гравці', 'гравців')
