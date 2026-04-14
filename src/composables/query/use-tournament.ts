// import { useQueryWrapper } from '@/core/use-query.utils'
// import { tournamentsService } from '@/views/tournaments/tournaments.service'
// import type { TTournament as Tournament } from '@/api/types/api.types'

// export const useGetTournament = (id: string) => {
//   return useQueryWrapper<Tournament>({
//     key: ['tournaments', id],
//     query: async () => tournamentsService.fetchTournament(id),
//     refetchOnWindowFocus: false
//   })
// }
