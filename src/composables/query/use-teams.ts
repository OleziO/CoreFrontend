import { useQueryWrapper } from '@/core/use-query.utils'

export const useGetTeams = (skip?: number, limit?: number) => {
  return useQueryWrapper({
    key: ['teams'],
    query: () => teamsService.fetchAllTeams(skip, limit),
    refetchOnWindowFocus: false
  })
}
