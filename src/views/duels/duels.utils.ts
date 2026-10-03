import { pluralizeUk } from '@/views/players/player-achievements.utils'
import type {
  TDuel,
  TDuelCancelReason,
  TDuelChallengeStatus,
  TDuelFailReason,
  TDuelHero,
  TDuelLobbySide,
  TDuelPlayer,
  TDuelQueueBlockedReason,
  TDuelSeason,
  TDuelState,
  TDuelStatsPlayer,
  TDuelTournamentPrize,
  TDuelTournamentPrizeInput,
  TDuelTournamentPrizeKind,
  THostBotStatus
} from '@/api/types/api.types'

/** Скільки очок переходить за дуель (дзеркало `DUEL_RATING_DELTA` на бекенді). */
export const DUEL_RATING_DELTA = 25
/** Скільки очок переходить за дружню дуель між друзями (дзеркало `DUEL_FRIEND_RATING_DELTA`). */
export const DUEL_FRIEND_RATING_DELTA = 10
/** Скільки дружніх дуелей гравець може прийняти за день (дзеркало `DUEL_CHALLENGE_DAILY_LIMIT`). */
export const DUEL_CHALLENGE_DAILY_LIMIT = 3
/** Штраф за самостійне скасування дуелі чи неприйняття матчу (дзеркало `DUEL_CANCEL_PENALTY`). */
export const DUEL_CANCEL_PENALTY = 10
/** Скільки секунд дається на «Прийняти» після знаходження пари. */
export const DUEL_ACCEPT_WINDOW_SECONDS = 30
/** Полінг стану пулу ботів. */
export const DUEL_BOTS_POLL_MS = 10_000
/** Полінг статусу, поки гравець у черзі або в дуелі. */
export const DUEL_STATUS_POLL_MS = 3000
/** Полінг у стані ACCEPTING — щоб побачити прийняття суперника без затримки. */
export const DUEL_ACCEPT_POLL_MS = 1500
/** Банер результату показуємо ще стільки після завершення дуелі. */
export const DUEL_RESULT_BANNER_TTL_MS = 10 * 60 * 1000
/** localStorage: гравець натиснув «Зрозуміло» в «Як це працює» — вікно більше не відкривається саме. */
export const DUEL_HOW_IT_WORKS_STORAGE_KEY = 'duels:how-it-works-confirmed'
/** Скільки разів бот перезапускає лобі, чия гра не стартувала (дзеркало `DUEL_MAX_LOBBY_RESTARTS`). */
export const DUEL_MAX_LOBBY_RESTARTS = 2
/** «Перезапустити матч» — не частіше ніж раз на стільки секунд (дзеркало `DUEL_RESTART_REQUEST_COOLDOWN_SECONDS`). */
export const DUEL_RESTART_REQUEST_COOLDOWN_SECONDS = 60
/** Перезапуск доступний лише стільки після запуску гри (дзеркало `DUEL_RESTART_REQUEST_WINDOW_SECONDS`). */
export const DUEL_RESTART_REQUEST_WINDOW_SECONDS = 10 * 60
/** Стани Dota `game_state`, у яких гра ще не почалась: INIT, WAIT_FOR_PLAYERS_TO_LOAD, WAIT_FOR_MAP_TO_LOAD. */
export const DUEL_NEVER_STARTED_GAME_STATES: readonly number[] = [0, 1, 10]
/** Скільки бот чекає на результат після запуску гри, перш ніж дуель стане FAILED (дзеркало `DUEL_GAME_TIMEOUT_SECONDS`). */
export const DUEL_GAME_TIMEOUT_SECONDS = 90 * 60

export const DUEL_ACTIVE_STATES: readonly TDuelState[] = [
  'ACCEPTING',
  'PENDING',
  'LOBBY_CREATING',
  'WAITING_PLAYERS',
  'LIVE'
]

/** Стани, у яких гравець ще може скасувати дуель сам (гра не запущена). */
const DUEL_CANCELLABLE_STATES: readonly TDuelState[] = ['ACCEPTING', 'PENDING', 'LOBBY_CREATING', 'WAITING_PLAYERS']

export const duelStateLabels: Record<TDuelState, string> = {
  ACCEPTING: 'Прийміть матч',
  PENDING: 'Очікує бота',
  LOBBY_CREATING: 'Створюємо лобі',
  WAITING_PLAYERS: 'Чекаємо гравців',
  LIVE: 'Гра триває',
  PROCESSING: 'Обробка результату',
  RESOLVED: 'Завершено',
  CANCELLED: 'Скасовано',
  FAILED: 'Збій'
}

export const duelChallengeStatusLabels: Record<TDuelChallengeStatus, string> = {
  PENDING: 'Чекає на відповідь',
  ACCEPTED: 'Прийнято',
  DECLINED: 'Відхилено',
  CANCELLED: 'Скасовано',
  EXPIRED: 'Прострочено'
}

/** Дружня дуель — з виклику друга, ±10 замість ±25. */
export function isFriendDuel (duel: TDuel | null | undefined): boolean {
  return duel?.kind === 'friend'
}

/** Турнірна дуель — з черги турніру, ±25 у таблиці турніру, глобальний рейтинг не змінюється. */
export function isTournamentDuel (duel: TDuel | null | undefined): boolean {
  return duel?.kind === 'tournament'
}

/** Скільки очок на кону в цій дуелі (за її видом). */
export function duelStakeOf (duel: TDuel | null | undefined): number {
  return isFriendDuel(duel) ? DUEL_FRIEND_RATING_DELTA : DUEL_RATING_DELTA
}

/** Кроки степпера активної дуелі — у порядку проходження. */
export const duelSteps: readonly TDuelStep[] = [
  { key: 'ACCEPTING', label: 'Прийняття', hint: 'Обидва гравці мають прийняти матч за 30 секунд' },
  { key: 'PENDING', label: 'Бот', hint: 'Чекаємо вільного бота-хоста' },
  { key: 'LOBBY_CREATING', label: 'Лобі', hint: 'Бот створює лобі та надсилає інвайти' },
  { key: 'WAITING_PLAYERS', label: 'Гравці', hint: 'Обидва мають зайти в лобі та обрати сторону' },
  { key: 'LIVE', label: 'Гра', hint: 'Матч запущено — результат зарахуємо автоматично' }
]

export const duelCancelReasonLabels: Record<TDuelCancelReason, string> = {
  players_no_show: 'Гравець не зайшов у лобі',
  lobby_not_created: 'Не вдалося створити лобі',
  no_bots_available: 'Не було вільного бота',
  admin: 'Скасовано адміністратором',
  accept_timeout: 'Матч не прийнято вчасно',
  player_cancelled: 'Скасовано гравцем',
  game_aborted: 'Гра не стартувала — гравець не завантажився в матч',
  tournament_ended: 'Турнір завершено до старту гри',
  tournament_deleted: 'Турнір видалено до старту гри',
  season_ended: 'Сезон завершився до старту гри'
}

/** Мінімальна / максимальна довжина назви й пароля турніру (дзеркало валідації бекенду). */
export const DUEL_TOURNAMENT_NAME_MIN = 3
export const DUEL_TOURNAMENT_NAME_MAX = 64
export const DUEL_TOURNAMENT_PASSWORD_MIN = 4
export const DUEL_TOURNAMENT_PASSWORD_MAX = 32
/** Посилання на стрім турніру (дзеркало `STREAM_URL_MAX`). */
export const DUEL_TOURNAMENT_STREAM_URL_MAX = 512

/** Призові місця турніру (дзеркало `DUEL_TOURNAMENT_PRIZES_MAX` / `…_PLACE_MAX` / `…_VIP_MONTHS_MAX`). */
export const DUEL_TOURNAMENT_PRIZES_MAX = 10
export const DUEL_TOURNAMENT_PRIZE_PLACE_MAX = 100
export const DUEL_TOURNAMENT_PRIZE_VIP_MONTHS_MAX = 12
export const DUEL_TOURNAMENT_PRIZE_TITLE_MAX = 80
export const DUEL_TOURNAMENT_PRIZE_URL_MAX = 512

export const pluralizeDuelMonths = (n: number) => pluralizeUk(n, 'місяць', 'місяці', 'місяців')

/** Коротка назва призу для бейджа: «VIP · 3 місяці» або назва власного призу. */
export function duelPrizeLabel (prize: TDuelTournamentPrize): string {
  if (prize.kind === 'vip') return `VIP · ${pluralizeDuelMonths(prize.vipMonths ?? 0)}`
  return prize.title || 'Приз'
}

/** Призи за місцем — для рядків таблиці турніру. */
export function duelPrizesByPlace (prizes: readonly TDuelTournamentPrize[] | null | undefined) {
  return new Map((prizes ?? []).map(p => [p.place, p]))
}

let prizeDraftKey = 0

export function createDuelPrizeDraft (place: number, kind: TDuelTournamentPrizeKind): TDuelPrizeDraft {
  return { key: ++prizeDraftKey, place, kind, vipMonths: 1, title: '', imageUrl: '', linkUrl: '' }
}

export function duelPrizeDraftsFrom (prizes: readonly TDuelTournamentPrize[] | null | undefined): TDuelPrizeDraft[] {
  return (prizes ?? []).map(p => ({
    ...createDuelPrizeDraft(p.place, p.kind),
    vipMonths: p.vipMonths ?? 1,
    title: p.title ?? '',
    imageUrl: p.imageUrl ?? '',
    linkUrl: p.linkUrl ?? ''
  }))
}

/** Тіло для бекенду: поля іншого виду не надсилаємо (бекенд їх однаково відкидає). */
export function duelPrizeDraftToInput (draft: TDuelPrizeDraft): TDuelTournamentPrizeInput {
  const title = draft.title.trim() || null
  if (draft.kind === 'vip') return { place: draft.place, kind: 'vip', vipMonths: draft.vipMonths, title }
  return {
    place: draft.place,
    kind: 'custom',
    title,
    imageUrl: draft.imageUrl.trim(),
    linkUrl: draft.linkUrl.trim()
  }
}

function isHttpUrl (value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')
  } catch {
    return false
  }
}

/** Помилка посилання на стрім (необов’язкове поле) або порожній рядок. */
export function duelStreamUrlError (value: string): string {
  const link = value.trim()
  if (!link) return ''
  if (link.length > DUEL_TOURNAMENT_STREAM_URL_MAX || !isHttpUrl(link)) {
    return 'Посилання має бути повною адресою: https://…'
  }
  return ''
}

/** Помилка рядка призу (дзеркало валідації бекенду) або порожній рядок. */
export function duelPrizeDraftError (draft: TDuelPrizeDraft, all: readonly TDuelPrizeDraft[]): string {
  if (!Number.isInteger(draft.place) || draft.place < 1 || draft.place > DUEL_TOURNAMENT_PRIZE_PLACE_MAX) {
    return `Місце — від 1 до ${DUEL_TOURNAMENT_PRIZE_PLACE_MAX}`
  }
  if (all.some(other => other !== draft && other.place === draft.place)) return `${draft.place} місце вказано двічі`
  if (draft.kind === 'vip') {
    const months = draft.vipMonths
    if (!Number.isInteger(months) || months < 1 || months > DUEL_TOURNAMENT_PRIZE_VIP_MONTHS_MAX) {
      return `VIP — від 1 до ${DUEL_TOURNAMENT_PRIZE_VIP_MONTHS_MAX} місяців`
    }
    return ''
  }
  if (!draft.imageUrl.trim()) return 'Завантажте картинку призу'
  const link = draft.linkUrl.trim()
  if (!link) return 'Додайте посилання на приз'
  if (link.length > DUEL_TOURNAMENT_PRIZE_URL_MAX || !isHttpUrl(link)) {
    return 'Посилання має бути повною адресою: https://…'
  }
  return ''
}

/** Випадковий пароль турніру: 8 символів без схожих літер (0/O, 1/l), щоб легко продиктувати на стрімі. */
export function generateDuelTournamentPassword (): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('')
}

export const duelFailReasonLabels: Record<TDuelFailReason, string> = {
  lobby_lost: 'Лобі втрачено',
  game_timeout: 'Гра не завершилася вчасно',
  undetermined_outcome: 'Не вдалося визначити переможця',
  wrong_heroes: 'Обидва гравці взяли не своїх героїв'
}

export const duelQueueBlockedLabels: Record<TDuelQueueBlockedReason, string> = {
  steam_not_linked: 'Щоб грати дуелі, прив’яжіть Steam-акаунт у профілі',
  cooldown: 'Пауза після неявки — спробуйте трохи пізніше',
  active_duel: 'У вас уже є активна дуель',
  already_queued: 'Ви вже в черзі',
  no_bots_online: 'Жоден бот-хост зараз не онлайн — черга тимчасово закрита',
  season_closing: 'Сезон завершився — підбиваємо підсумки, нова черга відкриється за хвилину'
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

/** Дуель можна скасувати самому (−10), поки гра не запущена. */
export function isDuelCancellable (duel: TDuel | null | undefined): boolean {
  return !!duel && DUEL_CANCELLABLE_STATES.includes(duel.state)
}

/**
 * Чи можна попросити перезапустити матч (гравець не завантажився в гру): лише LIVE,
 * поки не почався пік героїв, запуск не старший за 10 хв і ліміт перезапусків не вичерпано.
 * Повертає причину відмови українською — вона йде під вимкнену кнопку.
 */
export function duelRestartBlockedReason (duel: TDuel, now: Date): string | null {
  if (duel.state !== 'LIVE') return 'Перезапуск доступний лише після запуску гри'
  if (duel.lobbyRestarts >= DUEL_MAX_LOBBY_RESTARTS) {
    return `Ліміт перезапусків лобі (${DUEL_MAX_LOBBY_RESTARTS}) вичерпано`
  }
  if (duel.gameState != null && !DUEL_NEVER_STARTED_GAME_STATES.includes(duel.gameState)) {
    return 'Гра вже стартувала — герої обрані, перезапуск неможливий'
  }
  if (duel.liveAt) {
    const liveAt = new Date(duel.liveAt).getTime()
    if (!Number.isNaN(liveAt) && now.getTime() - liveAt > DUEL_RESTART_REQUEST_WINDOW_SECONDS * 1000) {
      return 'Гра запущена надто давно — перезапуск більше недоступний'
    }
  }
  return null
}

export function hasAcceptedDuel (duel: TDuel, playerId: string | null | undefined): boolean {
  return !!playerId && (duel.acceptedPlayerIds ?? []).includes(playerId)
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

/** Герой, випадково призначений гравцю на цю дуель; null, коли героїв ще не роздали. */
export function duelHeroFor (duel: TDuel, playerId: string | null | undefined): TDuelHero | null {
  if (!playerId || !duel.heroes) return null
  return duel.heroes.find((h) => h.playerId === playerId) ?? null
}

/** Портрет героя зі Steam CDN за внутрішнім іменем (`npc_dota_hero_axe` → axe.png). */
export function duelHeroImageUrl (hero: TDuelHero | null | undefined): string {
  if (!hero?.name) return ''
  const slug = hero.name.replace(/^npc_dota_hero_/, '')
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`
}

export function duelOpponentOf (duel: TDuel, playerId: string | null | undefined): TDuelPlayer | null {
  if (!playerId) return null
  if (duel.player1?.id === playerId) return duel.player2
  if (duel.player2?.id === playerId) return duel.player1
  return null
}

/** Гра закінчилась для гравців, а результат ще збирається (сервер / Web API). */
export function isDuelProcessing (duel: TDuel | null | undefined): boolean {
  return duel?.state === 'PROCESSING'
}

export function duelOutcomeFor (duel: TDuel, playerId: string | null | undefined): TDuelOutcome {
  if (isDuelActive(duel)) return 'active'
  if (isDuelProcessing(duel)) return 'processing'
  if (duel.state === 'FAILED') return 'failed'
  // Скасування гравцем / неприйняття — «скасовано» з −10 у винного (дельта береться з loserId).
  const penaltyCancel = duel.cancelReason === 'player_cancelled' || duel.cancelReason === 'accept_timeout'
  if (duel.state === 'CANCELLED' && penaltyCancel) {
    return 'cancelled'
  }
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
  active: 'Триває',
  processing: 'Обробка'
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

// ─── сезони ─────────────────────────────────────────────────────────────────

/** Сезони — календарні місяці за київським часом (дзеркало `DUEL_SEASON_TIME_ZONE`). */
export const DUEL_SEASON_TIME_ZONE = 'Europe/Kyiv'

export const pluralizeDuelDays = (n: number) => pluralizeUk(n, 'день', 'дні', 'днів')
export const pluralizeDuelHours = (n: number) => pluralizeUk(n, 'година', 'години', 'годин')

export function duelSeasonTitle (season: Pick<TDuelSeason, 'number'>): string {
  return `Сезон ${season.number}`
}

const seasonDayFormat = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'long',
  timeZone: DUEL_SEASON_TIME_ZONE
})

/** «1 жовтня — 31 жовтня»: `endsAt` виключний (перша мить наступного сезону), тож показуємо попередній день. */
export function formatDuelSeasonRange (season: Pick<TDuelSeason, 'startsAt' | 'endsAt'>): string {
  const lastMoment = new Date(new Date(season.endsAt).getTime() - 1)
  return `${seasonDayFormat.format(new Date(season.startsAt))} — ${seasonDayFormat.format(lastMoment)}`
}

/** «ще 5 днів» / «ще 3 години» / «менше години» до кінця сезону; null, коли час вийшов. */
export function duelSeasonTimeLeft (endsAt: string, now: Date): string | null {
  const ms = new Date(endsAt).getTime() - now.getTime()
  if (Number.isNaN(ms) || ms <= 0) return null
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 24) return `ще ${pluralizeDuelDays(Math.floor(hours / 24))}`
  if (hours >= 1) return `ще ${pluralizeDuelHours(hours)}`
  return 'менше години'
}
