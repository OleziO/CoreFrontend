// TODO: endpoint not in API yet -- all methods commented out pending backend implementation

// import apiClient from '@/api/client'
//
// class RequestsService {
//   async fetchRequests (params?: { skip?: number; limit?: number; status_filter?: string; type_filter?: string }) {
//     const res = await apiClient.get('/api/v1/requests/', { params: { skip: params?.skip ?? 0, limit: params?.limit ?? 100, status_filter: params?.status_filter, type_filter: params?.type_filter } })
//     return res
//   }
//   async approveRequest (requestId: number) { ... }
//   async rejectRequest (requestId: number) { ... }
//   async takeRequest (requestId: number) { ... }
//   async createVerificationRequest (type: string) { ... }
// }
//
// export const requestsService = new RequestsService()

export const requestsService = {} as any
