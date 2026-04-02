import { useQueryWrapper } from '@/core/use-query.utils'

export const useGetPlayers = (skip?: number | undefined) => {
  return useQueryWrapper({
    key: () => ['players', skip as number],
    query: () => playersService.fetchPlayers(skip),
    refetchOnWindowFocus: false
  })
}
