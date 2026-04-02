import { useQueryWrapper } from '@/core/use-query.utils'
import { tournamentsService } from '@/views/tournaments/tournaments.service'

export const useGetTournaments = () => {
  return useQueryWrapper({
    key: ['tournaments'],
    query: () => tournamentsService.fetchTournaments(),
    refetchOnWindowFocus: false
  })
}

export const useGetAllTournaments = () => {
  return useQueryWrapper({
    key: ['tournaments', 'all'],
    query: () => tournamentsService.fetchAllTournaments(),
    refetchOnWindowFocus: false
  })
}
