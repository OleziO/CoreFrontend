import type { components } from './schema'

export type TPlayerRankDto = components['schemas']['PlayerRankDto']

/** У ростері /teams `rank` нормалізується на клієнті (`coercePlayerRankFromApi`). */
export type TPlayer = components['schemas']['Player'] & {
  rank?: TPlayerRankDto | null
}
export type TCurrentPlayer = components['schemas']['CurrentPlayerDto']
export type TTournamentDivision = components['schemas']['TournamentDivision']

/** Відповіді GET/POST/PATCH команд (`TeamResponseDto`) — без `matches*` / discord-каналів з вкладеної схеми `Team`. */
export type TTeamResponse = components['schemas']['TeamResponseDto'] & {
  division: TTournamentDivision | null
}

/** Публічний зріз гравця в рості команди (GET /teams…) — сумісний з карткою гравця. */
export type TPlayerResponseDto = components['schemas']['PlayerResponseDto']

export type TTeam = components['schemas']['Team'] & {
  division: TTournamentDivision | null
}
export type TQualificationMatch = components['schemas']['QualificationMatch']
/** Тіло GET /tournaments/:id/qualification — у OpenAPI це `QualificationResponseDto` (поверх `Qualification` додає `playerTournamentPoints`). */
export type TQualificationPhase = components['schemas']['QualificationResponseDto']
export type TPlayerPointsEntry = components['schemas']['PlayerPointsEntry']
export type TTournament = components['schemas']['Tournament'] & {
  division?: TTournamentDivision | null
  /** Підмішується з GET /tournaments/:id/qualification на клієнті; у базовій схемі турніру може не бути. */
  qualification?: TQualificationPhase | null
}
export type TCreateTournamentDto = components['schemas']['CreateTournamentDto']
export type TMatch = components['schemas']['Match']
export type TUserRole = components['schemas']['UserRoles']
export type TCurrentPlayerRole = components['schemas']['CurrentPlayerRoleDto']
// export type TTournamentStatus = components['schemas']['TournamentStatus']

// export type TCreatePlayerDto = components['schemas']['CreatePlayerDto']
/** OpenAPI кладе `positions` як `1|…|5|null`; фактично PATCH приймає масив позицій. */
export type TUpdatePlayerDto = Omit<components['schemas']['UpdatePlayerDto'], 'positions'> & {
  positions?: (1 | 2 | 3 | 4 | 5)[] | null
}
export type TCreateTeamDto = components['schemas']['CreateTeamDto']
export type TUpdateTeamDto = components['schemas']['UpdateTeamDto']
/** У OpenAPI схема називається `AddPlayerDto` (POST /teams/:id/players). */
export type TAddTeamPlayerDto = components['schemas']['AddPlayerDto']
export type TUpdateTournamentDto = components['schemas']['UpdateTournamentDto']
export type TCreateMatchDto = components['schemas']['CreateMatchDto']
export type TUpdateMatchDto = components['schemas']['UpdateMatchDto']
export type TCreateUserRoleDto = components['schemas']['CreateUserRoleDto']
export type TUpdateUserRoleDto = components['schemas']['UpdateUserRoleDto']
export type TUserRoleCatalog = components['schemas']['UserRoleResponseDto']
