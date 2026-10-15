import { useQueryWrapper } from '@/core/use-query.utils'
import { duelBracketsService } from '@/views/media/media.service'
import type { TDuelBracket, TDuelBracketSummary } from '@/api/types/api.types'

/**
 * Ключі медіа-турнірів — під префіксом `duels`, тож `invalidateDuelQueries()` після
 * дуелі (сторінка дуелей) освіжає й сітки.
 */
export const DUEL_BRACKETS_QUERY_KEY = ['duels', 'brackets'] as const
export const duelBracketQueryKey = (id: string) => ['duels', 'brackets', id] as const

/** Список турнірів. `joined` / `canManage` залежать від токена — ключ включає id гравця. */
export const useGetDuelBrackets = (getViewerId: () => string | null | undefined) => {
  return useQueryWrapper<TDuelBracketSummary[]>({
    key: () => [...DUEL_BRACKETS_QUERY_KEY, 'list', getViewerId() ?? 'guest'],
    query: () => duelBracketsService.fetchBrackets(),
    refetchOnWindowFocus: true,
    staleTime: 15_000
  }, [])
}

/** Один турнір; полінг (поки сітка грається) робить сторінка. */
export const useGetDuelBracket = (getId: () => string, getViewerId: () => string | null | undefined) => {
  return useQueryWrapper<TDuelBracket | null>({
    key: () => [...duelBracketQueryKey(getId()), getViewerId() ?? 'guest'],
    query: () => duelBracketsService.fetchBracket(getId()),
    enabled: () => !!getId(),
    refetchOnWindowFocus: true,
    staleTime: 5_000
  }, null)
}
