import { useQueryWrapper } from '@/core/use-query.utils'

export const useGetPlayer = (id: number) => {
  return useQueryWrapper({
    key: ['players', id],
    query: () => playersService.fetchPlayerItemById(id),
    refetchOnWindowFocus: false
  })
}
