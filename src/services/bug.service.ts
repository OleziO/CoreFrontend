// TODO: endpoint not in API yet -- all methods commented out pending backend implementation

// import apiClient from '@/api/client'
//
// class BugService {
//   async createBugRequest (formData: globalThis.FormData) {
//     const res = await apiClient.post('/api/v1/bug-requests/' as any, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
//     })
//     return res
//   }
//
//   async fetchBugRequests (params?: { status_filter?: string }) {
//     const res = await apiClient.get('/api/v1/bug-requests/' as any, {
//       params: { status_filter: params?.status_filter }
//     })
//     return res
//   }
//
//   async updateBugStatus (bugRequestId: number, status: string) {
//     const res = await apiClient.patch(
//       `/api/v1/bug-requests/${bugRequestId}/status` as any,
//       { status }
//     )
//     return res
//   }
// }
//
// export const bugService = new BugService()

export const bugService = {}
