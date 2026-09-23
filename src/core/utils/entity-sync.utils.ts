/**
 * Чисті хелпери для синхронізації копій сутностей між сторами
 * (players ↔ teams ↔ tournaments ↔ auth). Без стану і без імпортів сторів —
 * оркестрацію робить `src/store/entity-sync.ts`.
 *
 * Усі функції повертають ТОЙ САМИЙ обʼєкт, якщо змін не було, щоб стори не
 * підміняли посилання й не тригерили зайвих ререндерів.
 */

type TTeamTournamentEmbedded = TTeam['tournaments'][number]
type TBestOf = TTeamTournamentEmbedded['grandFinalBestOf']

/** Будь-який контейнер ростеру: TTeam (PlayerResponseDto) або TTournamentTeam (Player). */
type TRosterHolder = {
  captain?: { id: string } | null
  coach?: { id: string } | null
  mainPlayers?: { id: string }[]
  reservedPlayers?: { id: string }[]
}

/**
 * Накладає `patch` на `base`, ігноруючи `undefined` (відсутній ключ у JSON ≠ null).
 * Бекенд після адмін-дій може повертати часткові payload-и — не затираємо наявні поля.
 */
export function mergeDefined<T extends object> (base: T, patch: Partial<T>): T {
  const out: T = { ...base }
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const value = patch[key]
    if (value !== undefined) out[key] = value as T[keyof T]
  }
  return out
}

/** Усі гравці ростеру без дублів: капітан, тренер, основа, запас. */
export function collectTeamRosterPlayers (team: TTeam): TPlayer[] {
  const seen = new Set<string>()
  const out: TPlayer[] = []
  const candidates: (TPlayer | null | undefined)[] = [
    team.captain,
    team.coach,
    ...(team.mainPlayers ?? []),
    ...(team.reservedPlayers ?? [])
  ]
  for (const p of candidates) {
    if (!p || seen.has(p.id)) continue
    seen.add(p.id)
    out.push(p)
  }
  return out
}

export function collectTeamRosterIds (team: TTeam): Set<string> {
  return new Set(collectTeamRosterPlayers(team).map((p) => p.id))
}

/**
 * Оновлює гравця в усіх слотах ростеру. Спред `TPlayer` поверх ембеднутого запису
 * коректний і для `Player` з турніру (той самий id/поля, лише слабша OpenAPI-типізація).
 */
export function patchPlayerInRosterHolder<T extends TRosterHolder> (holder: T, updated: TPlayer): T {
  let changed = false
  const merge = <P extends { id: string }>(p: P): P => {
    if (p.id !== updated.id) return p
    changed = true
    return mergeDefined(p, updated as unknown as Partial<P>)
  }

  const captain = holder.captain ? merge(holder.captain) : holder.captain
  const coach = holder.coach ? merge(holder.coach) : holder.coach
  const mainPlayers = holder.mainPlayers?.map(merge)
  const reservedPlayers = holder.reservedPlayers?.map(merge)

  if (!changed) return holder
  return { ...holder, captain, coach, mainPlayers, reservedPlayers } as T
}

/**
 * Прибирає гравця з основи/запасу та з посади тренера. Капітана не чіпаємо:
 * в ембеднутому `Team` турніру він не nullable, а бекенд сам вирішує долю команди.
 */
export function removePlayerFromRosterHolder<T extends TRosterHolder> (holder: T, playerId: string): T {
  const inMain = holder.mainPlayers?.some((p) => p.id === playerId) ?? false
  const inReserve = holder.reservedPlayers?.some((p) => p.id === playerId) ?? false
  const isCoach = holder.coach?.id === playerId
  if (!inMain && !inReserve && !isCoach) return holder

  return {
    ...holder,
    coach: isCoach ? null : holder.coach,
    mainPlayers: holder.mainPlayers?.filter((p) => p.id !== playerId),
    reservedPlayers: holder.reservedPlayers?.filter((p) => p.id !== playerId)
  } as T
}

/** Поля TTeam, які безпечно накласти на ембеднутий `Team` у `TTournament.teams[]`. */
const TEAM_OVERLAY_KEYS = [
  'name',
  'logoUrl',
  'dotaTeamId',
  'isVerified',
  'isPlayingTournament',
  'verifiedAt',
  'disbandedAt',
  'captain',
  'coach',
  'mainPlayers',
  'reservedPlayers'
] as const satisfies readonly (keyof TTeam)[]

export function overlayTeamOntoTournamentTeam (embedded: TTournamentTeam, next: TTeam): TTournamentTeam {
  const patch: Partial<Record<(typeof TEAM_OVERLAY_KEYS)[number], unknown>> = {}
  for (const key of TEAM_OVERLAY_KEYS) patch[key] = next[key]
  return mergeDefined(embedded, patch as Partial<TTournamentTeam>)
}

function coerceBestOf (value: unknown, fallback: TBestOf): TBestOf {
  return value === 1 || value === 3 || value === 5 ? value : fallback
}

/**
 * `TTournament` → запис у `TTeam.tournaments[]`. `prev` — наявний запис, щоб зберегти
 * поля, яких у списковій відповіді може не бути (див. коментар у tournaments.d.ts про bestOf).
 */
export function toTeamTournamentEmbedded (
  t: TTournament,
  prev?: TTeamTournamentEmbedded | null
): TTeamTournamentEmbedded {
  const next: TTeamTournamentEmbedded = {
    id: t.id,
    name: t.name,
    prizePool: t.prizePool ?? prev?.prizePool ?? 0,
    headerBannerUrl: t.headerBannerUrl ?? prev?.headerBannerUrl ?? null,
    listBannerUrl: t.listBannerUrl ?? prev?.listBannerUrl ?? null,
    tournamentSlots: t.tournamentSlots ?? prev?.tournamentSlots ?? null,
    registrationStartsAt: t.registrationStartsAt,
    registrationEndsAt: t.registrationEndsAt,
    qualificationStartsAt: t.qualificationStartsAt ?? prev?.qualificationStartsAt ?? null,
    qualificationEndsAt: t.qualificationEndsAt ?? prev?.qualificationEndsAt ?? null,
    tournamentStartsAt: t.tournamentStartsAt,
    tournamentEndsAt: t.tournamentEndsAt,
    tournamentStatus: t.tournamentStatus,
    bracketType: t.bracketType,
    hasThirdPlaceMatch: t.hasThirdPlaceMatch,
    upperBracketFinalBestOf: coerceBestOf(t.upperBracketFinalBestOf, prev?.upperBracketFinalBestOf ?? 1),
    lowerBracketFinalBestOf: coerceBestOf(t.lowerBracketFinalBestOf, prev?.lowerBracketFinalBestOf ?? 1),
    grandFinalBestOf: coerceBestOf(t.grandFinalBestOf, prev?.grandFinalBestOf ?? 1),
    tournamentGridUrl: t.tournamentGridUrl ?? prev?.tournamentGridUrl ?? null
  }
  return prev ? mergeDefined(prev, next) : next
}

/**
 * Синхронізує `team.tournaments[]` із фактичним складом турніру:
 * команда в `tournament.teams` → upsert запису, інакше → видалення.
 */
export function applyTournamentMembershipToTeam (team: TTeam, tournament: TTournament): TTeam {
  if (!Array.isArray(tournament.teams)) return team

  const list = team.tournaments ?? []
  const ix = list.findIndex((x) => x.id === tournament.id)
  const isMember = tournament.teams.some((t) => t.id === team.id)

  if (isMember) {
    const entry = toTeamTournamentEmbedded(tournament, ix >= 0 ? list[ix] : null)
    const tournaments = ix >= 0 ? list.map((x, i) => (i === ix ? entry : x)) : [...list, entry]
    return { ...team, tournaments }
  }

  if (ix < 0) return team
  return { ...team, tournaments: list.filter((x) => x.id !== tournament.id) }
}

export function removeTournamentFromTeam (team: TTeam, tournamentId: string): TTeam {
  if (!team.tournaments?.some((x) => x.id === tournamentId)) return team
  return { ...team, tournaments: team.tournaments.filter((x) => x.id !== tournamentId) }
}
