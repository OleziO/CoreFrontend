export type OperationType = 'BETKING' | 'DUELO_GG' | 'PRIZE' | 'CUSTOM'

export type OperationGroupKind = 'PRIZE' | 'CUSTOM'

export type SponsorKind = 'BETKING' | 'DUELO_GG'

export type FeedItemKind = 'OPERATION' | 'GROUP' | 'FORECAST'

export type FeedItemSign = 'POSITIVE' | 'NEGATIVE'

export type AssetView = {
  id: string
  name: string
  url: string
}

export type SponsorView = {
  id: string
  name: string
  kind: SponsorKind
  matchers: string[]
  logo: AssetView | null
}

export type OperationGroupView = {
  id: string
  kind: OperationGroupKind
  title: string
  operationIds: string[]
  aggregatedAmount: number
  groupKey: string
  icon: AssetView | null
}

export type CustomCategoryView = {
  id: string
  label: string
  icon: AssetView | null
}

export type FeedItem = {
  kind: FeedItemKind
  id: string
  amount: number
  sign: FeedItemSign
  time: string | null
  title: string
  iconUrl: string | null
  operationIds: string[]
  virtual: boolean
}

export type FeedView = {
  items: FeedItem[]
  includesForecast: boolean
}

export type Balance = {
  actual: number
  forecast: number
  total: number
  includesForecast: boolean
}

export type ForecastDivisionConfig = {
  teamCount: number
  projectContribution: number
}

export type ForecastFeesConfig = {
  top1_4: number
  top5_8: number
  top8plus: number
}

export type ForecastConfig = {
  divisions: [ForecastDivisionConfig, ForecastDivisionConfig, ForecastDivisionConfig]
  fees: ForecastFeesConfig
  prizePoolPercent: number
}

export type ForecastDivisionResult = {
  collected: number
  prizePool: number
}

export type ForecastResult = {
  divisions: [ForecastDivisionResult, ForecastDivisionResult, ForecastDivisionResult]
  totalCollected: number
  totalPrizePool: number
  projectedExpenses: number
  projectedProfit: number
}

export type ForecastResponse = {
  config: ForecastConfig
  result: ForecastResult
} | null

export type OperationsQueryParams = {
  includeForecast?: boolean
  from?: string
  to?: string
}

export type GroupOperationsPayload = {
  operationIds: string[]
  title: string
  iconAssetId?: string
}

export type CreateCustomCategoryPayload = {
  label: string
  iconAssetId?: string | null
}

export type BankSyncPayload = {
  accountId?: string
  from: string
  to?: string
}

export const DEFAULT_FORECAST_CONFIG: ForecastConfig = {
  divisions: [
    { teamCount: 9, projectContribution: 200000 },
    { teamCount: 9, projectContribution: 300000 },
    { teamCount: 9, projectContribution: 500000 }
  ],
  fees: {
    top1_4: 10000,
    top5_8: 15000,
    top8plus: 20000
  },
  prizePoolPercent: 60
}
