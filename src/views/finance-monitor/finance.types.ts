export type TOperationType = 'BETKING' | 'DUELO_GG' | 'PRIZE' | 'CUSTOM'

export type TOperationGroupKind = 'PRIZE' | 'CUSTOM'

export type TSponsorKind = 'BETKING' | 'DUELO_GG'

export type TFeedItemKind = 'OPERATION' | 'GROUP' | 'FORECAST'

export type TFeedItemSign = 'POSITIVE' | 'NEGATIVE'

/**
 * Discriminator for `kind === 'GROUP'` feed items.
 * - `TEAM_GIFT` / `OTHER_GIFTS` — computed live by the backend over the requested range.
 * - `CUSTOM` / `PRIZE` — manual groups.
 */
export type TFeedGroupKind = 'TEAM_GIFT' | 'OTHER_GIFTS' | 'CUSTOM' | 'PRIZE'

export type TAssetView = {
  id: string
  name: string
  url: string
}

/** Per-row category assigned to an operation (top-level or group child). */
export type TFeedItemCategory = {
  id: string
  label: string
  icon: TAssetView | null
}

export type TSponsorView = {
  id: string
  name: string
  kind: TSponsorKind
  matchers: string[]
  logo: TAssetView | null
}

export type TOperationGroupView = {
  id: string
  kind: TOperationGroupKind
  title: string
  operationIds: string[]
  aggregatedAmount: number
  groupKey: string
  icon: TAssetView | null
}

/** Income/expense bucket a category contributes to. */
export type TCategorySign = 'INCOME' | 'EXPENSE'

export type TCustomCategoryView = {
  id: string
  label: string
  icon: TAssetView | null
  sign: TCategorySign
  /** Auto-assign rules: an operation whose description matches is categorized on ingest. */
  matchers: string[]
}

export type TFeedItem = {
  kind: TFeedItemKind
  id: string
  amount: number
  sign: TFeedItemSign
  time: string | null
  title: string
  iconUrl: string | null
  operationIds: string[]
  /** Group discriminator; `null` for plain operations and forecast rows. */
  groupKind: TFeedGroupKind | null
  /** Stable group key, e.g. `team:<teamId>` for team-gift groups. */
  groupKey: string | null
  /** Number of child operations in a group (0 for plain operations). */
  count: number
  /** Assigned category, or `null` when uncategorized. */
  category: TFeedItemCategory | null
  virtual: boolean
  /** Nested child operations for groups (empty for plain operations). */
  children: TFeedItem[]
}

export type TFeedView = {
  items: TFeedItem[]
  includesForecast: boolean
}

export type TBalance = {
  actual: number
  forecast: number
  total: number
  includesForecast: boolean
}

export type TForecastDivisionConfig = {
  teamCount: number
  projectContribution: number
}

export type TForecastFeesConfig = {
  top1_4: number
  top5_8: number
  top8plus: number
}

export type TForecastConfig = {
  divisions: [TForecastDivisionConfig, TForecastDivisionConfig, TForecastDivisionConfig]
  fees: TForecastFeesConfig
  prizePoolPercent: number
}

export type TForecastDivisionResult = {
  collected: number
  prizePool: number
}

export type TForecastResult = {
  divisions: [TForecastDivisionResult, TForecastDivisionResult, TForecastDivisionResult]
  totalCollected: number
  totalPrizePool: number
  projectedExpenses: number
  projectedProfit: number
}

export type TForecastResponse = {
  config: TForecastConfig
  result: TForecastResult
} | null

export type TOperationsQueryParams = {
  includeForecast?: boolean
  from?: string
  to?: string
}

export type TGroupOperationsPayload = {
  operationIds: string[]
  title: string
  iconAssetId?: string
}

export type TCreateCustomCategoryPayload = {
  label: string
  iconAssetId?: string | null
  sign?: TCategorySign
  matchers?: string[]
}

export type TUpdateCustomCategoryPayload = {
  label?: string
  iconAssetId?: string | null
  sign?: TCategorySign
  matchers?: string[]
}

export type TAssignCategoryPayload = {
  categoryId: string | null
}

export type TBankSyncPayload = {
  accountId?: string
  from: string
  to?: string
}

export const DEFAULT_FORECAST_CONFIG: TForecastConfig = {
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
