import type { components } from './schema'

export type TPlayerRankDto = components['schemas']['PlayerRankDto']

/** У ростері /teams `rank` нормалізується на клієнті (`coercePlayerRankFromApi`). */
export type TPlayer = components['schemas']['Player'] & {
  rank?: TPlayerRankDto | null
}
export type TCurrentPlayer = components['schemas']['CurrentPlayerDto']
export type TTeam = components['schemas']['Team']

export type TTournamentDivision = components['schemas']['TournamentDivision']
export type TTournament = components['schemas']['Tournament']
export type TQualificationMatch = components['schemas']['QualificationMatchDto']
export type TQualificationPhase = components['schemas']['QualificationPhaseDto']
export type TCreateTournamentDto = components['schemas']['CreateTournamentDto']
export type TMatch = components['schemas']['Match']
export type TUserRole = components['schemas']['UserRoles']
export type TCurrentPlayerRole = components['schemas']['CurrentPlayerRoleDto']
// export type TTournamentStatus = components['schemas']['TournamentStatus']

// export type TCreatePlayerDto = components['schemas']['CreatePlayerDto']
export type TUpdatePlayerDto = components['schemas']['UpdatePlayerDto']
export type TCreateTeamDto = components['schemas']['CreateTeamDto']
export type TUpdateTeamDto = components['schemas']['UpdateTeamDto']
export type TAddTeamPlayerDto = components['schemas']['AddTeamPlayerDto']
export type TUpdateTournamentDto = components['schemas']['UpdateTournamentDto']
export type TCreateMatchDto = components['schemas']['CreateMatchDto']
export type TUpdateMatchDto = components['schemas']['UpdateMatchDto']
export type TCreateUserRoleDto = components['schemas']['CreateUserRoleDto']
export type TUpdateUserRoleDto = components['schemas']['UpdateUserRoleDto']
export type TUserRoleCatalog = components['schemas']['UserRoleResponseDto']
