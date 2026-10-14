/**
 * Локальне джерело даних про спонсорів для публічного відображення.
 *
 * Спонсор = широкий БАНЕР (зображення). Логотип лишається лише як запасний
 * варіант, якщо банер не задано/не завантажився.
 *
 * Чому не API: єдиний бекенд-ендпоінт `/sponsors` (v2) — адмінський, потребує
 * авторизації і повертає 401 анонімам, а глобальний interceptor на 401 робить
 * жорсткий редірект на головну. Тому публічних даних про спонсорів зараз немає.
 *
 * Коли з'явиться публічний ендпоінт (напр. GET /public/sponsors) — достатньо
 * переписати `getSponsors`; компоненти (SponsorShowcase/SponsorBanner) не зміняться.
 */

/** Рівень спонсорства. Визначає вагу ротації (дорожчі — довше в кадрі). */
export type TSponsorTier = 'title' | 'gold' | 'silver' | 'partner'

export type TSponsor = {
  id: string
  /** Публічна назва — alt-текст і текстовий fallback. */
  name: string
  /** Широкий банер (зображення). Основний спосіб показу. */
  bannerUrl: string | null
  /** Логотип — запасний варіант, якщо немає/не вантажиться банер. */
  logoUrl?: string | null
  /** Необов'язкове посилання на сайт спонсора. */
  websiteUrl?: string | null
  /** Рівень спонсорства. */
  tier: TSponsorTier
  /** Пріоритет у межах рівня + додаткова вага ротації. Більше = помітніше. За замовч. 0. */
  priority?: number
}

/**
 * Букмекерські спонсори (BETKING: титульний слот на головній і банери bet_1/bet_2
 * на сторінці турніру) приховані з публічного сайту на час перевірки WayForPay —
 * рішення власника від 2026-10-14. Асети й записи лишаються; `true` повертає показ.
 */
export const SHOW_BETTING_SPONSORS = false

/** Титульний спонсор для стійки «Партнери та спонсори» на головній (за прапором вище). */
export const BETTING_TITLE_SPONSOR = {
  name: 'BETKING',
  url: 'https://77953937.uatracer.link/',
  logo: '/sponsors/BETKING_Logo_Compact_Secondary_Secondary_Red_On_White.png'
} as const

/** Банери на сторінці турніру (за прапором вище). */
const BETTING_TOURNAMENT_BANNERS: TSponsor[] = [
  {
    id: 'sponsor-1',
    name: 'BETKING',
    bannerUrl: '/sponsors/bet_1.webp',
    logoUrl: '/sponsors/logo_1.png',
    websiteUrl: 'https://77953937.uatracer.link/',
    tier: 'title',
    priority: 1
  },
  {
    id: 'sponsor-2',
    name: 'BETKING',
    bannerUrl: '/sponsors/bet_2.webp',
    logoUrl: '/sponsors/logo_2.png',
    websiteUrl: 'https://77953937.uatracer.link/',
    tier: 'title',
    priority: 2
  }
]

/** Банери спонсорів для сторінки турніру; без букмекерів, поки прапор вимкнено. */
export function getTournamentSponsors (): TSponsor[] {
  return SHOW_BETTING_SPONSORS ? [...BETTING_TOURNAMENT_BANNERS] : []
}

/** Вага ротації за рівнем (більше = довше в кадрі). */
const TIER_WEIGHT: Record<TSponsorTier, number> = {
  title: 4,
  gold: 3,
  silver: 2,
  partner: 1
}

/**
 * Наразі порожньо: банери BETKING приховані, карусель показує вільні місця
 * (див. порожній стан у SponsorBanner). Щоб повернути спонсора — просто додати
 * запис сюди, компоненти не змінюються.
 */
const SPONSORS: TSponsor[] = []

export function getSponsors (): TSponsor[] {
  return SPONSORS
}

/** Спонсори для банерної ротації — від найвагоміших (титульні) до найлегших. */
export function getBannerSponsors (sponsors: TSponsor[] = SPONSORS): TSponsor[] {
  return [...sponsors].sort((a, b) => getRotationWeight(b) - getRotationWeight(a))
}

/** Вага ротації: довше в кадрі для дорожчих рівнів і вищого пріоритету. */
export function getRotationWeight (sponsor: TSponsor): number {
  return TIER_WEIGHT[sponsor.tier] * (1 + (sponsor.priority ?? 0))
}
