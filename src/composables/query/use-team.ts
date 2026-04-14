// import { useQueryWrapper } from '@/core/use-query.utils'

// export const useGetTeam = (id: string, enabled: boolean = true) => {
//   return useQueryWrapper({
//     key: () => ['team', id],
//     query: async () => teamsService.fetchTeam(id),
//     refetchOnWindowFocus: false,
//     enabled: () => enabled && !!id
//   })
// }
