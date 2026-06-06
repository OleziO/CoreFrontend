import financeClient from '@/api/finance-client'
import type {
  AssetView,
  Balance,
  BankSyncPayload,
  CreateCustomCategoryPayload,
  CustomCategoryView,
  FeedView,
  ForecastConfig,
  ForecastResponse,
  GroupOperationsPayload,
  OperationGroupView,
  OperationsQueryParams
} from './finance.types'

class FinanceService {
  async fetchBalance (includeForecast = false): Promise<Balance> {
    return financeClient.get('/balance', {
      params: { includeForecast }
    })
  }

  async fetchOperations (params: OperationsQueryParams = {}): Promise<FeedView> {
    return financeClient.get('/operations', { params })
  }

  async fetchForecast (): Promise<ForecastResponse> {
    return financeClient.get('/forecast')
  }

  async updateForecast (config: ForecastConfig): Promise<NonNullable<ForecastResponse>> {
    return financeClient.put('/forecast', config)
  }

  async renameOperation (id: string, label: string): Promise<{ status: string }> {
    return financeClient.patch(`/operations/${id}/rename`, { label })
  }

  async setOperationIcon (id: string, iconAssetId: string): Promise<{ status: string }> {
    return financeClient.patch(`/operations/${id}/icon`, { iconAssetId })
  }

  async groupOperations (payload: GroupOperationsPayload): Promise<OperationGroupView> {
    return financeClient.post('/operations/group', payload)
  }

  async createCustomCategory (payload: CreateCustomCategoryPayload): Promise<CustomCategoryView> {
    return financeClient.post('/custom-categories', payload)
  }

  async fetchAssets (): Promise<AssetView[]> {
    return financeClient.get('/assets')
  }

  async syncBank (payload: BankSyncPayload): Promise<{ synced: number }> {
    return financeClient.post('/bank/sync', payload)
  }
}

export const financeService = new FinanceService()
