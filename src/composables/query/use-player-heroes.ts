import { computed } from 'vue'
import { useQueryWrapper } from '@/core/use-query.utils'
import {
  openDotaService,
  steamId64ToAccountId,
  heroIconUrl
} from '@/services/opendota.service'
import type {
  IOpenDotaPlayerHero,
  TOpenDotaHeroConstants
} from '@/services/opendota.service'

/** Герої майже не змінюються — тримаємо довго, без зайвих повторних запитів. */
const HERO_CONSTANTS_TTL = 24 * 60 * 60 * 1000
/** Топ героїв гравця оновлюємо нечасто, але не кешуємо назавжди. */
const PLAYER_HEROES_TTL = 5 * 60 * 1000

const useGetHeroConstants = (enabled: () => boolean) => {
  return useQueryWrapper<TOpenDotaHeroConstants>({
    key: ['opendota', 'hero-constants'],
    query: () => openDotaService.getHeroConstants(),
    enabled,
    refetchOnWindowFocus: false,
    staleTime: HERO_CONSTANTS_TTL,
    gcTime: HERO_CONSTANTS_TTL
  }, {})
}

const useGetPlayerHeroes = (getAccountId: () => string | null) => {
  return useQueryWrapper<IOpenDotaPlayerHero[]>({
    key: () => ['opendota', 'player-heroes', getAccountId() ?? 'none'],
    query: () => openDotaService.getPlayerHeroes(getAccountId() as string),
    enabled: () => !!getAccountId(),
    refetchOnWindowFocus: false,
    staleTime: PLAYER_HEROES_TTL
  }, [])
}

/** Готовий до відмалювання запис улюбленого героя. */
export interface IFavoriteHero {
  heroId: string
  name: string
  iconUrl: string
  games: number
  win: number
  /** 0–100, заокруглено; null якщо ігор немає. */
  winrate: number | null
}

/**
 * Топ улюблених героїв гравця для профілю.
 * `getSteamId` — гетер SteamID64; запити вмикаються лише коли він резолвиться в account_id.
 * Об'єднує OpenDota player/heroes + constants/heroes, кешовані через @pinia/colada.
 */
export const usePlayerFavoriteHeroes = (
  getSteamId: () => string | null | undefined,
  options?: { limit?: number }
) => {
  const limit = options?.limit ?? 3

  const accountId = computed(() => steamId64ToAccountId(getSteamId()))
  const hasAccount = computed(() => !!accountId.value)

  const constantsQuery = useGetHeroConstants(() => hasAccount.value)
  const heroesQuery = useGetPlayerHeroes(() => accountId.value)

  const heroes = computed<IFavoriteHero[]>(() => {
    const raw = heroesQuery.data.value ?? []
    const constants = constantsQuery.data.value ?? {}

    return [...raw]
      .filter((h) => Number(h.games) > 0)
      .sort((a, b) => Number(b.games) - Number(a.games))
      .slice(0, limit)
      .map((h) => {
        const c = constants[String(h.hero_id)]
        const games = Number(h.games) || 0
        const win = Number(h.win) || 0
        return {
          heroId: String(h.hero_id),
          name: c?.localized_name ?? `#${h.hero_id}`,
          iconUrl: heroIconUrl(c?.name),
          games,
          win,
          winrate: games > 0 ? Math.round((win / games) * 100) : null
        }
      })
  })

  const isPending = computed(
    () => hasAccount.value && (heroesQuery.isPending.value || constantsQuery.isPending.value)
  )
  const isError = computed(
    () => hasAccount.value && (!!heroesQuery.error.value || !!constantsQuery.error.value)
  )
  /** Steam прив'язаний, запит успішний, але героїв немає. */
  const isEmpty = computed(
    () => hasAccount.value && !isPending.value && !isError.value && heroes.value.length === 0
  )

  return { accountId, hasAccount, heroes, isPending, isError, isEmpty }
}
