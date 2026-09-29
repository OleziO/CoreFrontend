// Типи адмін-аналітики виводяться з OpenAPI-схеми (GET /admin/analytics/overview).
// Записи в `schema.d.ts` додано вручну за форматом openapi-typescript — `npm run api`
// після деплою бекенду перегенерує їх один в один.
type TAnalyticsOverview = TResponse<'/admin/analytics/overview', 'get'>
type TAnalyticsSocial = TAnalyticsOverview['socials'][number]
type TAnalyticsSocialChannel = TAnalyticsSocial['channel']
type TAnalyticsSocialSource = TAnalyticsSocial['source']
type TAnalyticsTotals = TAnalyticsOverview['totals']
type TAnalyticsRankBucket = TAnalyticsOverview['ranks'][number]
type TAnalyticsTeams = TAnalyticsOverview['teams']
type TAnalyticsTournament = TAnalyticsOverview['tournaments'][number]
type TAnalyticsWantToPlay = TAnalyticsOverview['wantToPlay']
type TAnalyticsCity = TAnalyticsOverview['cities'][number]

/** Дошка трофеїв (GET /admin/analytics/achievements): кожен вид досягнення з його володарями. */
type TAnalyticsAchievements = TResponse<'/admin/analytics/achievements', 'get'>
type TAnalyticsAchievement = TAnalyticsAchievements['achievements'][number]
type TAnalyticsAchievementHolder = TAnalyticsAchievement['holders'][number]

/** Один стовпчик / смужка на графіку: підпис, значення, опційно картинка та колір. */
type TAnalyticsChartItem = {
  key: string
  label: string
  value: number
  /** Довідкова «місткість» (наприклад, слоти турніру) — малюється як трек за смужкою. */
  capacity?: number | null
  image?: string
  color?: string
  /** Додатковий підпис у тултипі (статус, відсоток тощо). */
  hint?: string
}

/** Сегмент складеної смужки «частина від цілого». */
type TAnalyticsStackedSegment = {
  key: string
  label: string
  value: number
  color: string
}
