import { useQueryWrapper } from '@/core/use-query.utils'

export const useGetDivisions = () => {
  return useQueryWrapper({
    key: ['divisions'],
    query: () => tournamentsService.fetchDivisions(),
    refetchOnWindowFocus: false
  })
}
