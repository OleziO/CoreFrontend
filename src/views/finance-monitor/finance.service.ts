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
  TUpdateCustomCategoryPayload,
  TUpdateOperationPayload
} from './finance.types'

class FinanceService {
  async fetchBalance (includeForecast = false): Promise<TBalance> {
    return financeClient.get<TBalance>('/balance', {
      params: { includeForecast }
    })
  }

  async fetchOperations (params: TOperationsQueryParams = {}): Promise<TFeedView> {
    return financeClient.get<TFeedView>('/operations', { params })
  }

  async fetchForecast (): Promise<TForecastResponse> {
    return financeClient.get<TForecastResponse>('/forecast')
  }

  async updateForecast (config: TForecastConfig): Promise<NonNullable<TForecastResponse>> {
    return financeClient.put<NonNullable<TForecastResponse>>('/forecast', config)
  }

  /**
   * Unified operation edit (V2 `PATCH /operations/{id}`). Replaces the former
   * `/rename`, `/icon` and `/category` sub-endpoints. Full replace — callers must
   * pass the current values for fields they are not changing.
   */
  async updateOperation (id: string, payload: TUpdateOperationPayload): Promise<{ status: string }> {
    return financeClient.patch<{ status: string }>(`/operations/${id}`, payload)
  }

  async groupOperations (payload: TGroupOperationsPayload): Promise<TOperationGroupView> {
    return financeClient.post<TOperationGroupView>('/operations/group', payload)
  }

  async fetchCustomCategories (): Promise<TCustomCategoryView[]> {
    return financeClient.get<TCustomCategoryView[]>('/custom-categories')
  }

  async createCustomCategory (payload: TCreateCustomCategoryPayload): Promise<TCustomCategoryView> {
    return financeClient.post<TCustomCategoryView>('/custom-categories', payload)
  }

  async updateCustomCategory (
    id: string,
    payload: TUpdateCustomCategoryPayload
  ): Promise<TCustomCategoryView> {
    return financeClient.patch<TCustomCategoryView>(`/custom-categories/${id}`, payload)
  }

  async deleteCustomCategory (id: string): Promise<void> {
    return financeClient.delete<void>(`/custom-categories/${id}`)
  }

  async fetchAssets (): Promise<TAssetView[]> {
    return financeClient.get<TAssetView[]>('/assets')
  }

  async syncBank (payload: TBankSyncPayload): Promise<{ synced: number }> {
    return financeClient.post<{ synced: number }>('/bank/sync', payload)
  }
}

export const financeService = new FinanceService()
