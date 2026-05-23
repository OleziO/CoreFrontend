import type { TQualificationMatch, TTeam } from '@/api/types/api.types'

export type QualificationMatrixCellKind = 'diagonal' | 'win' | 'loss' | 'empty'

/** Стабільний ключ неупорядкованої пари команд для пошуку матчу. */
export function qualificationPairKey (teamAId: string, teamBId: string): string {
  return teamAId < teamBId ? `${teamAId}\u0000${teamBId}` : `${teamBId}\u0000${teamAId}`
}

/**
 * Порядок рядків/стовпців: спочатку команди турніру (як у списку учасників),
 * далі команди, що зустрічаються лише в матчах.
 */
export function buildQualificationMatrixTeams (
  tournamentTeams: readonly TTeam[] | null | undefined,
  matches: readonly TQualificationMatch[]
): TTeam[] {
  const byId = new Map<string, TTeam>()

  for (const t of tournamentTeams ?? []) {
    byId.set(t.id, t)
  }
  for (const m of matches) {
    if (!m.teamA || !m.teamB) continue
    if (!byId.has(m.teamA.id)) byId.set(m.teamA.id, m.teamA)
    if (!byId.has(m.teamB.id)) byId.set(m.teamB.id, m.teamB)
  }

  const orderedIds: string[] = []
  const pushUnique = (id: string) => {
    if (!orderedIds.includes(id)) orderedIds.push(id)
  }

  for (const t of tournamentTeams ?? []) {
    pushUnique(t.id)
  }
  for (const m of matches) {
    if (!m.teamA || !m.teamB) continue
    pushUnique(m.teamA.id)
    pushUnique(m.teamB.id)
  }

  return orderedIds
    .map((id) => byId.get(id))
    .filter((t): t is TTeam => !!t)
}

export function buildQualificationPairMap (
  matches: readonly TQualificationMatch[]
): Map<string, TQualificationMatch> {
  const map = new Map<string, TQualificationMatch>()
  for (const m of matches) {
    if (!m.teamA || !m.teamB) continue
    map.set(qualificationPairKey(m.teamA.id, m.teamB.id), m)
  }
  return map
}

/**
 * Стан клітинки відносно команди рядка: перемога / поразка / діагональ / порожньо.
 * Результат вважається відомим лише за наявності `winner` (узгоджено з відображенням W/L).
 */
export function resolveQualificationMatrixCell (
  rowTeamId: string,
  colTeamId: string,
  pairMap: ReadonlyMap<string, TQualificationMatch>
): QualificationMatrixCellKind {
  if (rowTeamId === colTeamId) return 'diagonal'
  const match = pairMap.get(qualificationPairKey(rowTeamId, colTeamId))
  if (!match?.winner) return 'empty'
  return match.winner.id === rowTeamId ? 'win' : 'loss'
}

export function qualificationMatrixCellLabel (kind: QualificationMatrixCellKind): string {
  switch (kind) {
    case 'diagonal':
      return 'X'
    case 'win':
      return 'W'
    case 'loss':
      return 'L'
    default:
      return ''
  }
}
