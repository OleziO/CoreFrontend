import apiClient from '@/api/client'

class RequestsService {
  async fetchRequests (params?: {
    skip?: number
    limit?: number
    status_filter?: string
    type_filter?: string
  }) {
    try {
      const res = await apiClient.get('/api/v1/requests/', {
        params: {
          skip: params?.skip ?? 0,
          limit: params?.limit ?? 100,
          status_filter: params?.status_filter,
          type_filter: params?.type_filter
        }
      })
      return res
    } catch (e) {
      console.error('Помилка при отриманні запитів:', e)
      throw e
    }
  }

  async approveRequest (requestId: number) {
    try {
      const res = await apiClient.post(`/api/v1/requests/${requestId}/approve` as any)
      return res
    } catch (e) {
      console.error('Помилка при схваленні запиту:', e)
      throw e
    }
  }

  async rejectRequest (requestId: number) {
    try {
      const res = await apiClient.post(`/api/v1/requests/${requestId}/reject` as any)
      return res
    } catch (e) {
      console.error('Помилка при відхиленні запиту:', e)
      throw e
    }
  }

  async takeRequest (requestId: number) {
    try {
      const res = await apiClient.post(`/api/v1/requests/${requestId}/take` as any)
      return res
    } catch (e) {
      console.error('Помилка при прийнятті запиту:', e)
      throw e
    }
  }

  async createVerificationRequest (type: string) {
    try {
      const formData = new FormData()
      formData.append('type', type)
      const res = await apiClient.post('/api/v1/requests/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return res
    } catch (e) {
      console.error('Помилка при створенні запиту на верифікацію:', e)
      throw e
    }
  }
}

export const requestsService = new RequestsService()
