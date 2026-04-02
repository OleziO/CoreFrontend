import { useQueryWrapper } from '@/core/use-query.utils'

export const useGetTeam = (id: number, enabled: boolean = true) => {
  return useQueryWrapper({
    key: () => ['team', id],
    query: async () => teamsService.fetchTeam(id),
    refetchOnWindowFocus: false,
    enabled: () => enabled && !!id
  })
}
