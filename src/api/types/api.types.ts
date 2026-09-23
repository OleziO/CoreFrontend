import type { components } from './schema'

export type TPlayerRankDto = components['schemas']['PlayerRankDto']

export type TCurrentPlayer = components['schemas']['CurrentPlayerDto']

/** Публічний зріз гравця в рості команди (GET /teams…) — сумісний з карткою гравця. */
export type TPlayerResponseDto = components['schemas']['PlayerResponseDto']

export type TQualificationMatch = components['schemas']['QualificationMatch']
/** Тіло GET /tournaments/:id/qualification — у OpenAPI це `QualificationResponseDto` (поверх `Qualification` додає `playerTournamentPoints`). */
export type TQualificationPhase = components['schemas']['QualificationResponseDto']
export type TPlayerPointsEntry = components['schemas']['PlayerPointsEntry']
/** Тіло GET /tournaments/:id/playoff та відповідь POST /playoff/start|disqualify — Challonge embed + актуальний склад. */
/** Запис матчу плей-оф (відповідь POST /tournaments/:id/playoff/submit). */
export type TPlayoffMatch = components['schemas']['PlayoffMatch']
/** Тіло POST/DELETE /tournaments/:id/playoff/teams та POST /playoff/start. */
export type TPlayoffTeamsDto = components['schemas']['PlayoffTeamsDto']
/** Тіло POST /tournaments/:id/playoff/submit. */
export type TSubmitPlayoffMatchDto = components['schemas']['SubmitPlayoffMatchDto']
/** Тіло POST /tournaments/:id/playoff/disqualify. */
export type TDisqualifyTeamDto = components['schemas']['DisqualifyTeamDto']
export type TCreateTournamentDto = components['schemas']['CreateTournamentDto']
/** Формат сітки плей-оф: SINGLE_ELIMINATION | DOUBLE_ELIMINATION. */
export type TTournamentBracketType = components['schemas']['TournamentBracketType']
/** Довжина серії у фінальних слотах плей-оф: 1 — BO1, 3 — BO3, 5 — BO5. */
export type TPlayoffBestOf = components['schemas']['CreateTournamentDto']['grandFinalBestOf']
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

/** PATCH /admin/players/:id/roles — повний набір ролей (замінює user_roles, синхронізує Discord, оновлює verifiedAt). */
export type TAdminSetPlayerRolesDto = components['schemas']['AdminSetPlayerRolesDto']
export type TAdminPlayerRoleItem = components['schemas']['AdminPlayerRoleItemDto']
/** Відповідь PATCH /admin/players/:id/roles — джерело істини після мутації ролей. */
export type TAdminPlayerRolesResult = components['schemas']['AdminPlayerRolesResultDto']
/** Відкритий матч плей-оф (GET /tournaments/:id/playoff/open-matches). */
export type TOpenPlayoffMatch = components['schemas']['OpenPlayoffMatchDto']
