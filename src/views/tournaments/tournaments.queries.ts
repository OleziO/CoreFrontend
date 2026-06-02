import { useQueryWrapper } from '@/core/use-query.utils'
import { tournamentsService } from '@/views/tournaments/tournaments.service'

export const useGetTournaments = () => {
  return useQueryWrapper({
    key: ['tournaments'],
    query: () => tournamentsService.fetchTournaments(),
    refetchOnWindowFocus: false
  })
}
