import type { TOpenPlayoffMatch } from '@/api/types/api.types'

interface IPodiumBracketOptions {
  bracketType: TTournament['bracketType']
  hasThirdPlaceMatch: boolean
}

type TSeriesTeam = TOpenPlayoffMatch['teamA']

function winnerOf (series: TOpenPlayoffMatch): TSeriesTeam | null {
  if (!series.seriesWinnerTeamId) return null
  if (series.teamA.id === series.seriesWinnerTeamId) return series.teamA
  if (series.teamB.id === series.seriesWinnerTeamId) return series.teamB
  return null
}

function loserOf (series: TOpenPlayoffMatch): TSeriesTeam | null {
  if (!series.seriesWinnerTeamId) return null
  if (series.teamA.id === series.seriesWinnerTeamId) return series.teamB
  if (series.teamB.id === series.seriesWinnerTeamId) return series.teamA
  return null
}

function toPodiumTeam (team: TSeriesTeam): TTournamentPodiumTeam {
  return { id: team.id, name: team.name, logoUrl: team.logoUrl ?? null }
}

/**
 * Матч за 3-тє місце в single elimination — між тими, хто програв фіналістам у півфіналах.
 * Не покладаємось на нумерацію раундів Challonge: беремо серії, які виграли фіналісти
 * (крім самого фіналу) з найвищого раунду, — це і є півфінали.
 */
function thirdPlaceFromConsolationMatch (
  series: readonly TOpenPlayoffMatch[],
  grandFinal: TOpenPlayoffMatch
): TSeriesTeam | null {
  const finalistIds = new Set([grandFinal.teamA.id, grandFinal.teamB.id])
  const wonByFinalist = series.filter(s =>
    s.seriesId !== grandFinal.seriesId &&
    !!s.seriesWinnerTeamId &&
    finalistIds.has(s.seriesWinnerTeamId)
  )
  if (wonByFinalist.length === 0) return null

  const semifinalRound = Math.max(...wonByFinalist.map(s => s.round))
  const semifinalLoserIds = wonByFinalist
    .filter(s => s.round === semifinalRound)
    .map(loserOf)
    .filter((team): team is TSeriesTeam => team !== null)
    .map(team => team.id)
  if (semifinalLoserIds.length !== 2) return null

  const consolation = series.find(s =>
    s.seriesId !== grandFinal.seriesId &&
    semifinalLoserIds.includes(s.teamA.id) &&
    semifinalLoserIds.includes(s.teamB.id)
  )
  return consolation ? winnerOf(consolation) : null
}

function deriveThirdPlace (
  series: readonly TOpenPlayoffMatch[],
  grandFinal: TOpenPlayoffMatch,
  opts: IPodiumBracketOptions
): TSeriesTeam | null {
  if (opts.bracketType === 'DOUBLE_ELIMINATION') {
    // У double elimination третій — той, хто програв фінал нижньої сітки.
    const lowerFinal = series.find(s => s.finalSeriesType === 'lower_bracket_final')
    return lowerFinal ? loserOf(lowerFinal) : null
  }
  if (!opts.hasThirdPlaceMatch) return null
  return thirdPlaceFromConsolationMatch(series, grandFinal)
}

/**
 * Призери плей-оф із серій сітки (GET /tournaments/:id/playoff/open-matches).
 * Порожній масив, доки гранд-фінал не вирішено. Bracket reset у double elimination
 * дає два гранд-фінали — чемпіона визначає останній за раундом, і лише коли зіграно обидва.
 */
export function derivePlayoffPodium (
  series: readonly TOpenPlayoffMatch[],
  opts: IPodiumBracketOptions
): TTournamentPodiumEntry[] {
  const grandFinals = series.filter(s => s.finalSeriesType === 'grand_final')
  if (grandFinals.length === 0 || grandFinals.some(s => !s.seriesWinnerTeamId)) return []

  const grandFinal = grandFinals.reduce((latest, s) => (s.round > latest.round ? s : latest))
  const champion = winnerOf(grandFinal)
  const runnerUp = loserOf(grandFinal)
  if (!champion || !runnerUp) return []

  const entries: TTournamentPodiumEntry[] = [
    { place: 1, team: toPodiumTeam(champion) },
    { place: 2, team: toPodiumTeam(runnerUp) }
  ]

  const third = deriveThirdPlace(series, grandFinal, opts)
  if (third && third.id !== champion.id && third.id !== runnerUp.id) {
    entries.push({ place: 3, team: toPodiumTeam(third) })
  }

  return entries
}
