import { useQueryWrapper } from '@/core/use-query.utils'

export const useGetTournament = (id: number) => {
  return useQueryWrapper<TTournamentDetail>({
    key: ['teams', id],
    query: async () => tournamentsService.fetchTournament(id),
    refetchOnWindowFocus: false
  })
}
