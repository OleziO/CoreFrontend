import financeClient from '@/api/finance-client'
import type {
  TAssetView,
  TBalance,
  TBankSyncPayload,
  TCreateCustomCategoryPayload,
  TCustomCategoryView,
  TFeedView,
  TForecastConfig,
  TForecastResponse,
  TGroupOperationsPayload,
  TOperationGroupView,
  TOperationsQueryParams,
  TUpdateCustomCategoryPayload
} from './finance.types'

class FinanceService {
  async fetchBalance (includeForecast = false): Promise<TBalance> {
    return financeClient.get('/balance', {
      params: { includeForecast }
    })
  }

  async fetchOperations (params: TOperationsQueryParams = {}): Promise<TFeedView> {
    return financeClient.get('/operations', { params })
  }

  async fetchForecast (): Promise<TForecastResponse> {
    return financeClient.get('/forecast')
  }

  async updateForecast (config: TForecastConfig): Promise<NonNullable<TForecastResponse>> {
    return financeClient.put('/forecast', config)
  }

  async renameOperation (id: string, label: string): Promise<{ status: string }> {
    return financeClient.patch(`/operations/${id}/rename`, { label })
  }

  async setOperationIcon (id: string, iconAssetId: string): Promise<{ status: string }> {
    return financeClient.patch(`/operations/${id}/icon`, { iconAssetId })
  }

  async groupOperations (payload: TGroupOperationsPayload): Promise<TOperationGroupView> {
    return financeClient.post('/operations/group', payload)
  }

  async fetchCustomCategories (): Promise<TCustomCategoryView[]> {
    return financeClient.get('/custom-categories')
  }

  async createCustomCategory (payload: TCreateCustomCategoryPayload): Promise<TCustomCategoryView> {
    return financeClient.post('/custom-categories', payload)
  }

  async updateCustomCategory (
    id: string,
    payload: TUpdateCustomCategoryPayload
  ): Promise<TCustomCategoryView> {
    return financeClient.patch(`/custom-categories/${id}`, payload)
  }

  async deleteCustomCategory (id: string): Promise<void> {
    return financeClient.delete(`/custom-categories/${id}`)
  }

  async assignOperationCategory (id: string, categoryId: string | null): Promise<{ status: string }> {
    return financeClient.patch(`/operations/${id}/category`, { categoryId })
  }

  async fetchAssets (): Promise<TAssetView[]> {
    return financeClient.get('/assets')
  }

  async syncBank (payload: TBankSyncPayload): Promise<{ synced: number }> {
    return financeClient.post('/bank/sync', payload)
  }
}

export const financeService = new FinanceService()
