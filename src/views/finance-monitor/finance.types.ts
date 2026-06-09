export type TOperationGroupKind = 'PRIZE' | 'SPONSOR' | 'CUSTOM'

export type TSponsorKind = 'BETKING' | 'DUELO_GG'

export type TFeedItemKind = 'OPERATION' | 'GROUP' | 'FORECAST'

export type TFeedItemSign = 'POSITIVE' | 'NEGATIVE'

/**
 * Discriminator for `kind === 'GROUP'` feed items (V2 `FeedViewDto.groupKind`).
 * - `TEAM_GIFT` / `OTHER_GIFTS` — computed live by the backend over the requested range.
 * - `SPONSOR` — sponsor-matched payouts.
 * - `MANUAL` — manually created groups.
 */
export type TFeedGroupKind = 'TEAM_GIFT' | 'OTHER_GIFTS' | 'SPONSOR' | 'MANUAL'

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
  /** Hidden from the default feed; revealed only when `showHidden` is requested. */
  isHidden: boolean
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
  showHidden?: boolean
}

/**
 * Body for the unified `PATCH /operations/{id}` (V2 `UpdateOperationDto`).
 * Full replace: `title`, `iconAssetId`, `categoryId` and `comment` are all required keys
 * (the nullable ones clear the value when sent as `null`). `isHidden` is optional.
 */
export type TUpdateOperationPayload = {
  title: string
  iconAssetId: string | null
  categoryId: string | null
  comment: string | null
  isHidden?: boolean
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
