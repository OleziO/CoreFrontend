import { queryCache } from '@/core/query-cache-client'
import { ElMessage } from 'element-plus'

class AdminPanelService {
  async handleApprove (requestId: number) {
    try {
      await requestsService.approveRequest(requestId)
      ElMessage.success('Запит успішно схвалено')
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail ||
    error?.response?.data?.message ||
    'Помилка при схваленні запиту'
      ElMessage.error(errorMessage)
    } finally {
      queryCache.invalidateQueries({ key: ['requests'] })
    }
  }

  async handleReject (requestId: number) {
    try {
      await requestsService.rejectRequest(requestId)
      ElMessage.success('Запит успішно відхилено')
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail ||
    error?.response?.data?.message ||
    'Помилка при відхиленні запиту'
      ElMessage.error(errorMessage)
    } finally {
      queryCache.invalidateQueries({ key: ['requests'] })
    }
  }

  async handleTake (requestId: number) {
    try {
      await requestsService.takeRequest(requestId)
      ElMessage.success('Запит успішно прийнято')
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail ||
    error?.response?.data?.message ||
    'Помилка при прийнятті запиту'
      ElMessage.error(errorMessage)
    } finally {
      queryCache.invalidateQueries({ key: ['requests'] })
    }
  }
}

export const adminPanelService = new AdminPanelService()
