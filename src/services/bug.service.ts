import apiClient from '@/api/client'

class BugService {
  async createBugRequest (formData: globalThis.FormData) {
    try {
      const res = await apiClient.post('/api/v1/bug-requests/' as any, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return res
    } catch (e) {
      console.error('Помилка при створенні запиту на баг:', e)
      throw e
    }
  }

  async fetchBugRequests (params?: {
    status_filter?: string
  }) {
    try {
      const res = await apiClient.get('/api/v1/bug-requests/' as any, {
        params: {
          status_filter: params?.status_filter
        }
      })
      return res
    } catch (e) {
      console.error('Помилка при отриманні багів:', e)
      throw e
    }
  }

  async updateBugStatus (bugRequestId: number, status: string) {
    try {
      const res = await apiClient.patch(
        `/api/v1/bug-requests/${bugRequestId}/status` as any,
        { status }
      )
      return res
    } catch (e) {
      console.error('Помилка при оновленні статусу багу:', e)
      throw e
    }
  }
}

export const bugService = new BugService()
