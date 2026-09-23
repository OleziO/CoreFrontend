import dayjs from 'dayjs'

/** Життєвий етап турніру відносно «зараз» — для порядку в списку. */
export type TTournamentPhase = 'live' | 'upcoming' | 'past'

const PHASE_ORDER: Record<TTournamentPhase, number> = { live: 0, upcoming: 1, past: 2 }

/** Мінімум полів для визначення етапу — щоб приймати й скорочені записи (турніри команди). */
export type TTournamentTiming = Pick<TTournament, 'tournamentStatus' | 'tournamentStartsAt' | 'tournamentEndsAt'>

export function getTournamentPhase (tournament: TTournamentTiming, now = dayjs()): TTournamentPhase {
  const start = dayjs(tournament.tournamentStartsAt)
  const end = dayjs(tournament.tournamentEndsAt)

  if (tournament.tournamentStatus === 'COMPLETED' || (end.isValid() && end.isBefore(now))) return 'past'
  if (start.isValid() && start.isAfter(now)) return 'upcoming'
  return 'live'
}

/**
 * Порядок списку: спочатку ті, що йдуть зараз (раніше завершуються — вище),
 * далі найближчі майбутні (ближчий старт — вище), наприкінці минулі
 * (свіжіші — вище). Повертає новий масив.
 */
export function sortTournamentsForList<T extends TTournamentTiming> (tournaments: readonly T[]): T[] {
  const now = dayjs()
  const time = (value: string | undefined | null) => {
    const d = dayjs(value)
    return d.isValid() ? d.valueOf() : Number.POSITIVE_INFINITY
  }

  return tournaments
    .map(t => ({ t, phase: getTournamentPhase(t, now) }))
    .sort((a, b) => {
      if (a.phase !== b.phase) return PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]
      switch (a.phase) {
        case 'live':
          return time(a.t.tournamentEndsAt) - time(b.t.tournamentEndsAt)
        case 'upcoming':
          return time(a.t.tournamentStartsAt) - time(b.t.tournamentStartsAt)
        default:
          return time(b.t.tournamentEndsAt) - time(a.t.tournamentEndsAt)
      }
    })
    .map(({ t }) => t)
}
