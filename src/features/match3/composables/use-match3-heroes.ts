import { useQueryWrapper } from '@/core/use-query.utils'
import { useAuthStore } from '@/store/modules/auth'
import {
  heroPortraitUrl,
  heroShortName,
  openDotaService,
  steamId64ToAccountId
} from '@/services/opendota.service'
import type { IOpenDotaPlayerHero, TOpenDotaHeroConstants } from '@/services/opendota.service'
import { MATCH3_KINDS } from '@/features/match3/match3-engine.utils'
import { MATCH3_DEFAULT_HEROES } from '@/features/match3/match3.utils'
import type { IMatch3HeroSkin } from '@/features/match3/match3.d'

const HERO_CONSTANTS_TTL = 24 * 60 * 60 * 1000
const PLAYER_HEROES_TTL = 5 * 60 * 1000

/**
 * Герої на фішках: топ-6 улюблених героїв гравця з OpenDota (як «Улюблені герої» в профілі),
 * а якщо Steam не прив'язаний чи даних замало — добираємо відомими героями за замовчуванням.
 * Ключі запитів ті самі, що в профілі гравця, тож кеш спільний.
 */
export function useMatch3Heroes () {
  const authStore = useAuthStore()
  const accountId = computed(() => steamId64ToAccountId(authStore.user?.steamId))

  const constantsQuery = useQueryWrapper<TOpenDotaHeroConstants>({
    key: ['opendota', 'hero-constants'],
    query: () => openDotaService.getHeroConstants(),
    enabled: () => !!accountId.value,
    refetchOnWindowFocus: false,
    staleTime: HERO_CONSTANTS_TTL,
    gcTime: HERO_CONSTANTS_TTL
  }, {})

  const heroesQuery = useQueryWrapper<IOpenDotaPlayerHero[]>({
    key: () => ['opendota', 'player-heroes', accountId.value ?? 'none'],
    query: () => openDotaService.getPlayerHeroes(accountId.value as string),
    enabled: () => !!accountId.value,
    refetchOnWindowFocus: false,
    staleTime: PLAYER_HEROES_TTL
  }, [])

  const favorites = computed<IMatch3HeroSkin[]>(() => {
    const constants = constantsQuery.data.value ?? {}
    return [...(heroesQuery.data.value ?? [])]
      .filter((hero) => Number(hero.games) > 0 && constants[String(hero.hero_id)])
      .sort((a, b) => Number(b.games) - Number(a.games))
      .slice(0, MATCH3_KINDS)
      .map((hero) => {
        const constant = constants[String(hero.hero_id)]
        return {
          key: heroShortName(constant.name),
          name: constant.localized_name,
          imageUrl: heroPortraitUrl(constant.name)
        }
      })
  })

  /** Рівно MATCH3_KINDS героїв без повторів: спершу улюблені, решта — за замовчуванням. */
  const skins = computed<IMatch3HeroSkin[]>(() => {
    const result = [...favorites.value]
    for (const hero of MATCH3_DEFAULT_HEROES) {
      if (result.length >= MATCH3_KINDS) break
      if (result.some((skin) => skin.key === hero.key)) continue
      result.push({ key: hero.key, name: hero.name, imageUrl: heroPortraitUrl(hero.key) })
    }
    return result
  })

  const isPersonal = computed(() => favorites.value.length > 0)

  return { skins, isPersonal }
}
