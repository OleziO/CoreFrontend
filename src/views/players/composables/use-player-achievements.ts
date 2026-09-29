import { useQueryWrapper } from '@/core/use-query.utils'
import { playersService } from '@/views/players/players.service'
import type { TPlayerAchievement, TPlayerAchievements } from '@/api/types/api.types'

/** Трофеї змінюються лише після результатів матчів / фіналів — свіжість у кілька хвилин достатня. */
const ACHIEVEMENTS_TTL = 2 * 60 * 1000

/**
 * Досягнення гравця (GET /players/:id/achievements): місця в турнірах і рекорди платформи.
 * `getPlayerId` — гетер id; запит вимкнено, поки id порожній.
 */
export const usePlayerAchievements = (getPlayerId: () => string | null | undefined) => {
  const playerId = computed(() => getPlayerId() || null)

  const query = useQueryWrapper<TPlayerAchievements | null>({
    key: () => ['players', 'achievements', playerId.value ?? 'none'],
    query: () => playersService.fetchPlayerAchievements(playerId.value as string),
    enabled: () => !!playerId.value,
    refetchOnWindowFocus: false,
    staleTime: ACHIEVEMENTS_TTL
  }, null)

  const achievements = computed<TPlayerAchievement[]>(() => query.data.value?.achievements ?? [])
  const isPending = computed(() => !!playerId.value && query.isPending.value)
  const isError = computed(() => !!playerId.value && !!query.error.value)
  const isEmpty = computed(() => !isPending.value && !isError.value && achievements.value.length === 0)

  return { achievements, isPending, isError, isEmpty }
}
