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
  TReclassifyResult,
  TSetWebhookResult,
  TUpdateCustomCategoryPayload,
  TUpdateOperationGroupPayload,
  TUpdateOperationPayload,
  TWebhookStatus
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
   * Full-replace update of a single operation. The backend requires the complete
   * desired state (title, icon, category, comment), so callers must pass every field.
   */
  async updateOperation (id: string, payload: TUpdateOperationPayload): Promise<{ status: string }> {
    return financeClient.patch<{ status: string }>(`/operations/${id}`, payload)
  }

  async fetchOperationGroups (): Promise<TOperationGroupView[]> {
    return financeClient.get<TOperationGroupView[]>('/operations/groups')
  }

  async groupOperations (payload: TGroupOperationsPayload): Promise<TOperationGroupView> {
    return financeClient.post<TOperationGroupView>('/operations/group', payload)
  }

  async updateOperationGroup (
    id: string,
    payload: TUpdateOperationGroupPayload
  ): Promise<TOperationGroupView> {
    return financeClient.patch<TOperationGroupView>(`/operations/group/${id}`, payload)
  }

  async deleteOperationGroup (id: string): Promise<{ status: string }> {
    return financeClient.delete<{ status: string }>(`/operations/group/${id}`)
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

  async reclassifyBank (): Promise<TReclassifyResult> {
    return financeClient.post<TReclassifyResult>('/bank/sync/reclassify')
  }

  /** Поточна підписка monobank + перелік банок. Банк лімітує client-info: 1 запит / 60 с. */
  async fetchWebhookStatus (): Promise<TWebhookStatus> {
    return financeClient.get<TWebhookStatus>('/bank/webhook')
  }

  /**
   * Реєструє webhook на адресу, яку бекенд бере з самого запиту, тож окремий
   * конфіг не потрібен. Без тіла — інакше бекенд візьме передану адресу.
   */
  async registerWebhook (): Promise<TSetWebhookResult> {
    return financeClient.post<TSetWebhookResult>('/bank/webhook', {})
  }
}

export const financeService = new FinanceService()
