import { pluralizeUk } from '@/views/players/player-achievements.utils'

/** Порядок і підписи сортування — перший пункт є типовим. */
export const leaderboardSortOptions: ReadonlyArray<TLeaderboardSortOption> = [
  { key: 'score', label: 'Рахунок' },
  { key: 'wins', label: 'Перемоги' },
  { key: 'winrate', label: 'Вінрейт' },
  { key: 'maps', label: 'Матчі' },
  { key: 'achievements', label: 'Досягнення' },
  { key: 'tournamentPoints', label: 'Турнірні очки' },
  { key: 'rating', label: 'MMR' },
  { key: 'kills', label: 'Вбивства' }
]

export const DEFAULT_LEADERBOARD_SORT: TLeaderboardSortKey = 'score'

const numberFormat = new Intl.NumberFormat('uk-UA')

export function formatLeaderboardNumber (value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return numberFormat.format(Math.round(value))
}

export function formatLeaderboardPercent (value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${Math.round(value)}%`
}

/** Значення обраного ключа сортування у рядку; `null`-вінрейт іде в кінець. */
export function getLeaderboardSortValue (row: TLeaderboardRow, key: TLeaderboardSortKey): number {
  const value = row[key]
  return value == null ? -1 : value
}

/**
 * Впорядковує рядки за ключем (спадання). Позиція з бекенду — стабільний
 * tie-break, тож при однакових значеннях зберігається порядок за рахунком.
 */
export function sortLeaderboardRows (rows: TLeaderboardRow[], key: TLeaderboardSortKey): TLeaderboardRow[] {
  if (key === DEFAULT_LEADERBOARD_SORT) return [...rows].sort((a, b) => a.position - b.position)
  return [...rows].sort(
    (a, b) => getLeaderboardSortValue(b, key) - getLeaderboardSortValue(a, key) || a.position - b.position
  )
}

export function leaderboardRowMatchesSearch (row: TLeaderboardRow, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [row.discordName, row.discordUsername]
    .some((value) => (value ?? '').toLowerCase().includes(needle))
}

export const pluralizeLeaderboardPlayers = (n: number) => pluralizeUk(n, 'гравець', 'гравці', 'гравців')
export const pluralizeLeaderboardPoints = (n: number) => pluralizeUk(n, 'очко', 'очки', 'очок')

/** Людське пояснення формули з ваг, що прийшли з бекенду. */
export function describeLeaderboardWeights (w: TLeaderboardScoreWeights): string[] {
  const per = (n: number) => `+${formatLeaderboardNumber(n)}`
  return [
    `${per(w.firstPlace)} за 1-е місце в турнірі`,
    `${per(w.secondPlace)} за 2-е місце`,
    `${per(w.thirdPlace)} за 3-є місце`,
    `${per(w.achievement)} за кожне досягнення (без п’єдесталу та жартівливих)`,
    `${per(w.mapWon)} за виграну мапу`,
    `${per(w.mapPlayed)} за зіграну мапу`,
    `${w.tournamentPoint} за кожне турнірне очко`
  ]
}
