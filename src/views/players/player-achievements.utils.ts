import type { Component } from 'vue'
import {
  PhAnchor,
  PhArrowElbowLeftUp,
  PhBooks,
  PhChartLineUp,
  PhCloudRain,
  PhCoins,
  PhCompass,
  PhCrosshair,
  PhCrown,
  PhFire,
  PhFlagBanner,
  PhFlagCheckered,
  PhGhost,
  PhHandCoins,
  PhHandshake,
  PhHeart,
  PhLightning,
  PhMapPin,
  PhMedal,
  PhMedalMilitary,
  PhMoon,
  PhPackage,
  PhPercent,
  PhPlugsConnected,
  PhSealCheck,
  PhShieldStar,
  PhSkull,
  PhSmileyXEyes,
  PhSparkle,
  PhStar,
  PhSun,
  PhSword,
  PhTarget,
  PhTrophy,
  PhUsersThree
} from '@phosphor-icons/vue'
import type { TPlayerAchievementKind } from '@/api/types/api.types'

export type TAchievementCategory =
  | 'podium'
  | 'records'
  | 'milestones'
  | 'combat'
  | 'heroes'
  | 'community'
  | 'fun'

export interface IAchievementMeta {
  category: TAchievementCategory
  label: string
  description: string
  icon: Component
  /** `r, g, b` для `--tile-tone` — колір обводки, кільця та світіння плитки. */
  tone: string
  /**
   * Підпис під трофеєм з числа за ним (`value`) та кількості (`count`).
   * Без нього місця показують кількість турнірів, решта — нічого.
   */
  caption?: (value: number | null, count: number) => string
  /** Жартівливий трофей — приглушена палітра замість урочистої. */
  gloomy?: boolean
}

/** Український відмінок: «1 матч», «2 матчі», «5 матчів» (форми: одн., 2–4, 5+). */
export function pluralizeUk (n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`
  return `${n} ${many}`
}

export const pluralizeMatches = (n: number) => pluralizeUk(n, 'матч', 'матчі', 'матчів')
export const pluralizeTournaments = (n: number) => pluralizeUk(n, 'турнір', 'турніри', 'турнірів')
export const pluralizePlayers = (n: number) => pluralizeUk(n, 'гравець', 'гравці', 'гравців')
const pluralizeHeroes = (n: number) => pluralizeUk(n, 'герой', 'герої', 'героїв')
const pluralizeKills = (n: number) => pluralizeUk(n, 'вбивство', 'вбивства', 'вбивств')
const pluralizeDeaths = (n: number) => pluralizeUk(n, 'смерть', 'смерті', 'смертей')
const pluralizeAssists = (n: number) => pluralizeUk(n, 'асист', 'асисти', 'асистів')
const pluralizePoints = (n: number) => pluralizeUk(n, 'очко', 'очки', 'очок')
const pluralizeCities = (n: number) => pluralizeUk(n, 'місто', 'міста', 'міст')
const pluralizeDonations = (n: number) => pluralizeUk(n, 'донат', 'донати', 'донатів')
const pluralizeTeammates = (n: number) => pluralizeUk(n, 'тімейт', 'тімейти', 'тімейтів')

/** Підпис, коли трофей за одну мапу міг повторитись: «3 мапи · макс. 24 вбивства». */
const perMap = (label: (n: number) => string) => (value: number | null, count: number) =>
  value != null ? `${pluralizeMatches(count)} · до ${label(value)}` : pluralizeMatches(count)

const GOLD = 'var(--ds-gold-rgb)'
const SILVER = '198, 205, 220'
const BRONZE = '205, 127, 50'
const CYAN = 'var(--ds-primary-rgb)'
const VIOLET = 'var(--ds-secondary-rgb)'
const PINK = 'var(--ds-pink-rgb)'
const GREEN = '34, 197, 94'
const RED = '239, 68, 68'
const AMBER = '245, 158, 11'

/** Категорії дошки трофеїв — у порядку показу. */
export const achievementCategories: ReadonlyArray<{ key: TAchievementCategory; label: string; hint: string }> = [
  { key: 'podium', label: 'П’єдестал', hint: 'Місця у завершених турнірах платформи' },
  { key: 'records', label: 'Рекорди платформи', hint: 'Максимум серед усіх гравців; ділять усі, хто його повторив' },
  { key: 'milestones', label: 'Віхи', hint: 'Пороги за зіграними матчами й серіями' },
  { key: 'combat', label: 'Бойові подвиги', hint: 'Статистика окремих мап із даних Dota' },
  { key: 'heroes', label: 'Герої та сторони', hint: 'Пул героїв і улюблена сторона карти' },
  { key: 'community', label: 'Спільнота', hint: 'Профіль, команда та підтримка ліги' },
  { key: 'fun', label: 'З гумором', hint: 'Досягнення, якими не хваляться, але які пам’ятають' }
]

/**
 * Каталог трофеїв: відображення `kind` з беку у підпис, іконку, тон і категорію.
 * Порядок ключів — порядок показу в профілі та на дошці аналітики.
 */
export const achievementCatalog: Record<TPlayerAchievementKind, IAchievementMeta> = {
  // ─── П’єдестал ──────────────────────────────────────────────────────────
  TOURNAMENT_FIRST_PLACE: {
    category: 'podium',
    label: 'Чемпіон',
    description: '1-е місце в турнірі платформи',
    icon: PhTrophy,
    tone: GOLD
  },
  TOURNAMENT_SECOND_PLACE: {
    category: 'podium',
    label: 'Срібло',
    description: '2-е місце в турнірі платформи',
    icon: PhMedal,
    tone: SILVER
  },
  TOURNAMENT_THIRD_PLACE: {
    category: 'podium',
    label: 'Бронза',
    description: '3-є місце в турнірі платформи',
    icon: PhMedalMilitary,
    tone: BRONZE
  },
  FLAWLESS_CHAMPION: {
    category: 'podium',
    label: 'Бездоганний чемпіон',
    description: 'Виграв турнір, не програвши жодної мапи',
    icon: PhSparkle,
    tone: GOLD
  },
  LOWER_BRACKET_CHAMPION: {
    category: 'podium',
    label: 'З нижньої сітки',
    description: 'Програв серію в плей-оф — і все одно взяв титул',
    icon: PhArrowElbowLeftUp,
    tone: GOLD
  },
  PERFECT_QUALIFICATION: {
    category: 'podium',
    label: 'Ідеальна кваліфікація',
    description: 'Усі мапи кваліфікації турніру виграно',
    icon: PhFlagCheckered,
    tone: CYAN
  },

  // ─── Рекорди платформи ──────────────────────────────────────────────────
  MOST_MATCHES_PLAYED: {
    category: 'records',
    label: 'Ветеран',
    description: 'Найбільше зіграних матчів на платформі',
    icon: PhSword,
    tone: CYAN,
    caption: (v) => (v != null ? pluralizeMatches(v) : '')
  },
  MOST_MATCHES_WON: {
    category: 'records',
    label: 'Домінатор',
    description: 'Найбільше перемог на платформі',
    icon: PhCrown,
    tone: GREEN,
    caption: (v) => (v != null ? `${pluralizeMatches(v)} виграно` : '')
  },
  MOST_MATCHES_LOST: {
    category: 'records',
    label: 'Досвід через біль',
    description: 'Найбільше поразок на платформі. Зате який досвід!',
    icon: PhSmileyXEyes,
    tone: RED,
    caption: (v) => (v != null ? `${pluralizeMatches(v)} програно` : ''),
    gloomy: true
  },
  BEST_WINRATE: {
    category: 'records',
    label: 'Снайпер',
    description: 'Найвищий вінрейт серед гравців із 10+ матчами',
    icon: PhPercent,
    tone: GREEN,
    caption: (v) => (v != null ? `${v}% перемог` : '')
  },
  HIGHEST_RATING: {
    category: 'records',
    label: 'Вершина рейтингу',
    description: 'Найвищий MMR серед верифікованих гравців',
    icon: PhChartLineUp,
    tone: PINK,
    caption: (v) => (v != null ? `${v} MMR` : '')
  },
  MOST_TOURNAMENT_POINTS: {
    category: 'records',
    label: 'Лідер очок',
    description: 'Найбільше турнірних очок за весь час',
    icon: PhCoins,
    tone: GOLD,
    caption: (v) => (v != null ? pluralizePoints(v) : '')
  },
  MOST_KILLS: {
    category: 'records',
    label: 'Мисливець',
    description: 'Найбільше вбивств на платформі',
    icon: PhTarget,
    tone: RED,
    caption: (v) => (v != null ? pluralizeKills(v) : '')
  },
  MOST_ASSISTS: {
    category: 'records',
    label: 'Плече підтримки',
    description: 'Найбільше асистів на платформі',
    icon: PhHandshake,
    tone: VIOLET,
    caption: (v) => (v != null ? pluralizeAssists(v) : '')
  },
  MOST_DEATHS: {
    category: 'records',
    label: 'Донор',
    description: 'Найбільше смертей на платформі. Хтось же має годувати',
    icon: PhSkull,
    tone: RED,
    caption: (v) => (v != null ? pluralizeDeaths(v) : ''),
    gloomy: true
  },

  // ─── Віхи ───────────────────────────────────────────────────────────────
  FIRST_MATCH: {
    category: 'milestones',
    label: 'Дебют',
    description: 'Перший зіграний матч у турнірі платформи',
    icon: PhFlagBanner,
    tone: CYAN,
    caption: (v) => (v != null ? pluralizeMatches(v) : '')
  },
  MAPS_25: {
    category: 'milestones',
    label: 'Обстріляний',
    description: '25 і більше зіграних матчів',
    icon: PhStar,
    tone: CYAN,
    caption: (v) => (v != null ? pluralizeMatches(v) : '')
  },
  MAPS_100: {
    category: 'milestones',
    label: 'Сотник',
    description: '100 і більше зіграних матчів',
    icon: PhShieldStar,
    tone: GOLD,
    caption: (v) => (v != null ? pluralizeMatches(v) : '')
  },
  TOURNAMENTS_5: {
    category: 'milestones',
    label: 'Постійний учасник',
    description: 'Зіграв у 5 і більше турнірах',
    icon: PhCompass,
    tone: VIOLET,
    caption: (v) => (v != null ? pluralizeTournaments(v) : '')
  },
  WIN_STREAK_5: {
    category: 'milestones',
    label: 'На хвилі',
    description: '5 перемог поспіль',
    icon: PhFire,
    tone: AMBER,
    caption: (v) => (v != null ? `серія ${v}` : '')
  },
  WIN_STREAK_10: {
    category: 'milestones',
    label: 'Нестримний',
    description: '10 перемог поспіль',
    icon: PhLightning,
    tone: GOLD,
    caption: (v) => (v != null ? `серія ${v}` : '')
  },

  // ─── Бойові подвиги ────────────────────────────────────────────────────
  KILLS_20_IN_MAP: {
    category: 'combat',
    label: 'Керрі-машина',
    description: '20+ вбивств за одну мапу',
    icon: PhCrosshair,
    tone: RED,
    caption: perMap(pluralizeKills)
  },
  ASSISTS_25_IN_MAP: {
    category: 'combat',
    label: 'Диригент',
    description: '25+ асистів за одну мапу',
    icon: PhUsersThree,
    tone: VIOLET,
    caption: perMap(pluralizeAssists)
  },
  DEATHLESS_WIN: {
    category: 'combat',
    label: 'Безсмертний',
    description: 'Виграна мапа без жодної смерті',
    icon: PhGhost,
    tone: CYAN,
    caption: (_v, count) => pluralizeMatches(count)
  },

  // ─── Герої та сторони ──────────────────────────────────────────────────
  HERO_LOYALIST: {
    category: 'heroes',
    label: 'Однолюб',
    description: '10+ матчів на одному й тому самому герої',
    icon: PhHeart,
    tone: PINK,
    caption: (v) => (v != null ? `${pluralizeMatches(v)} на герої` : '')
  },
  HERO_COLLECTOR: {
    category: 'heroes',
    label: 'Колекціонер',
    description: '15+ різних героїв у турнірних матчах',
    icon: PhBooks,
    tone: VIOLET,
    caption: (v) => (v != null ? pluralizeHeroes(v) : '')
  },
  RADIANT_CHILD: {
    category: 'heroes',
    label: 'Дитя Світла',
    description: '70%+ матчів за Radiant (від 10 матчів)',
    icon: PhSun,
    tone: GREEN,
    caption: (v) => (v != null ? `${v}% за Radiant` : '')
  },
  DIRE_DEVOTEE: {
    category: 'heroes',
    label: 'Слуга Тьми',
    description: '70%+ матчів за Dire (від 10 матчів)',
    icon: PhMoon,
    tone: RED,
    caption: (v) => (v != null ? `${v}% за Dire` : '')
  },

  // ─── Спільнота ─────────────────────────────────────────────────────────
  TEAM_CAPTAIN: {
    category: 'community',
    label: 'Капітан',
    description: 'Очолює активну команду',
    icon: PhAnchor,
    tone: CYAN
  },
  VERIFIED_PLAYER: {
    category: 'community',
    label: 'Верифікований',
    description: 'Профіль підтверджено адміністрацією',
    icon: PhSealCheck,
    tone: GREEN
  },
  FULLY_CONNECTED: {
    category: 'community',
    label: 'На всіх фронтах',
    description: 'Прив’язано Steam, Discord і Telegram',
    icon: PhPlugsConnected,
    tone: VIOLET
  },
  LAN_READY: {
    category: 'community',
    label: 'Готовий до LAN',
    description: 'Хоче грати на LAN і вказав міста, куди приїде',
    icon: PhMapPin,
    tone: AMBER,
    caption: (v) => (v != null ? pluralizeCities(v) : '')
  },
  PATRON: {
    category: 'community',
    label: 'Меценат',
    description: 'Підтримав турнір платформи донатом',
    icon: PhHandCoins,
    tone: GOLD,
    caption: (_v, count) => pluralizeDonations(count)
  },
  SQUAD_SOCIALITE: {
    category: 'community',
    label: 'Душа компанії',
    description: 'Зіграв разом із 10+ різними тімейтами',
    icon: PhUsersThree,
    tone: PINK,
    caption: (v) => (v != null ? pluralizeTeammates(v) : '')
  },

  // ─── З гумором ─────────────────────────────────────────────────────────
  FEEDER_15_DEATHS: {
    category: 'fun',
    label: 'Кур’єр',
    description: '15+ смертей за одну мапу. Доставка — швидка, регулярна',
    icon: PhPackage,
    tone: RED,
    caption: perMap(pluralizeDeaths),
    gloomy: true
  },
  LOSS_STREAK_5: {
    category: 'fun',
    label: 'Чорна смуга',
    description: '5 поразок поспіль. Після смуги завжди світлішає',
    icon: PhCloudRain,
    tone: SILVER,
    caption: (v) => (v != null ? `серія ${v}` : ''),
    gloomy: true
  }
}

/** Порядок відображення — порядок ключів каталогу. */
export const achievementKindOrder = Object.keys(achievementCatalog) as TPlayerAchievementKind[]

/** Чи трофей за місце в турнірі (рахується турнірами і має список турнірів). */
export const isPlacementAchievement = (kind: TPlayerAchievementKind) =>
  achievementCatalog[kind]?.category === 'podium'

/** Підпис під трофеєм: «2 турніри» для п’єдесталу, «42 матчі» / «8450 MMR» для решти. */
export function formatAchievementCaption (
  kind: TPlayerAchievementKind,
  count: number,
  value: number | null | undefined
): string {
  const meta = achievementCatalog[kind]
  if (!meta) return ''
  if (meta.caption) return meta.caption(value ?? null, count)
  if (meta.category === 'podium') return pluralizeTournaments(count)
  return ''
}

/** Відмінки для лічильників трофеїв на дошці аналітики та в таблиці лідерів. */
export const pluralizeAchievements = (n: number) => pluralizeUk(n, 'досягнення', 'досягнення', 'досягнень')
export const pluralizeTrophies = (n: number) => pluralizeUk(n, 'трофей', 'трофеї', 'трофеїв')
export const pluralizePodiums = (n: number) => pluralizeUk(n, 'п’єдестал', 'п’єдестали', 'п’єдесталів')
