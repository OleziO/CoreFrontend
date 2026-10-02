// Типи ліги дуелей виводяться з OpenAPI-схеми (GET /duels/*).
// Записи в `schema.d.ts` додано вручну за форматом openapi-typescript — `npm run api`
// після деплою бекенду перегенерує їх один в один.
type TDuelStatusResponse = TResponse<'/duels/me', 'get'>
type TDuelLeaderboardResponse = TResponse<'/duels/leaderboard', 'get'>
type TDuelPlayerProfileResponse = TResponse<'/duels/players/{id}', 'get'>

/** Яку дошку показує `/leaderboard`: турнірний рейтинг (типово) або дуелі (`?board=duels`). */
type TLeaderboardBoard = 'tournament' | 'duels'

/** Результат дуелі з погляду конкретного гравця; `processing` — гра закінчилась, результат ще збирається. */
type TDuelOutcome = 'win' | 'loss' | 'cancelled' | 'failed' | 'active' | 'processing'

/** Крок степпера активної дуелі: PENDING → LOBBY_CREATING → WAITING_PLAYERS → LIVE. */
type TDuelStep = {
  key: import('@/api/types/api.types').TDuelState
  label: string
  hint: string
}

/** Рядок історії дуелей, уже «повернутий» до поточного гравця. */
type TDuelHistoryRow = {
  duel: import('@/api/types/api.types').TDuel
  outcome: TDuelOutcome
  opponent: import('@/api/types/api.types').TDuelPlayer | null
  /** ±25 з погляду гравця; null, коли рейтинг не змінювався. */
  delta: number | null
  /** Рядок статистики цього гравця зі знімка бота; null, коли знімок не зберігся. */
  stats: import('@/api/types/api.types').TDuelStatsPlayer | null
}

/** Рядок редактора призів турніру; `key` — лише для v-for (місце користувач може змінити). */
type TDuelPrizeDraft = {
  key: number
  place: number
  kind: import('@/api/types/api.types').TDuelTournamentPrizeKind
  vipMonths: number
  title: string
  imageUrl: string
  linkUrl: string
}
