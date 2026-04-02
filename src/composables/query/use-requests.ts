import { useQueryWrapper } from '@/core/use-query.utils'

export const useGetRequests = (typeFilter?: string) => {
  return useQueryWrapper({
    key: () => ['requests', typeFilter],
    query: () => requestsService.fetchRequests({
      status_filter: 'received',
      limit: 100,
      type_filter: typeFilter
    }),
    refetchOnWindowFocus: false
  })
}
