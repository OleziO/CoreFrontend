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
/**
 * ID ліги в клієнті Dota 2 (league_id), до якої прив'язано турнір. Поля ще немає в
 * згенерованій схемі — локальне розширення, доки `npm run api` не підхопить його з бекенду.
 */
export type TTournamentDotaLeagueDto = { dotaLeagueId?: number | null }
export type TCreateTournamentDto = components['schemas']['CreateTournamentDto'] & TTournamentDotaLeagueDto
/** Формат сітки плей-оф: SINGLE_ELIMINATION | DOUBLE_ELIMINATION. */
export type TTournamentBracketType = components['schemas']['TournamentBracketType']
/** Довжина серії у фінальних слотах плей-оф: 1 — BO1, 3 — BO3, 5 — BO5. */
export type TPlayoffBestOf = components['schemas']['CreateTournamentDto']['grandFinalBestOf']
export type TMatch = components['schemas']['Match']
export type TUserRole = components['schemas']['UserRoles']
export type TCurrentPlayerRole = components['schemas']['CurrentPlayerRoleDto']
// export type TTournamentStatus = components['schemas']['TournamentStatus']

// export type TCreatePlayerDto = components['schemas']['CreatePlayerDto']
/** Формати турнірів, у яких гравець хоче брати участь (PATCH /players/:id `wantToPlay`). */
export type TTournamentFormat = 'ONLINE' | 'LAN'
/** Країна з GET /locations/countries (без RU / BY / IR — фільтрує бекенд). */
export type TCountry = components['schemas']['CountryDto']
/** Відповідь GET /locations/cities?countryCode=XX. */
export type TCitiesResponse = components['schemas']['CitiesResponseDto']
/** Відповідь POST /players/me/lan-roles/sync — що Discord відповів на призначення ролей міст. */
export type TLanRoleSyncReport = components['schemas']['LanRoleSyncReportDto']
/** Відповідь GET /players/:id/match-stats — зіграні мапи гравця у турнірах платформи. */
export type TPlayerMatchStats = components['schemas']['PlayerMatchStatsDto']
/** Відповідь GET /players/:id/achievements — трофеї гравця: місця в турнірах і рекорди платформи. */
export type TPlayerAchievements = components['schemas']['PlayerAchievementsDto']
export type TPlayerAchievement = components['schemas']['PlayerAchievementDto']
export type TPlayerAchievementKind = components['schemas']['PlayerAchievementKind']
/**
 * OpenAPI кладе `positions` / `wantToPlay` як одиничний enum `|null`; фактично PATCH приймає масиви
 * (як і `positions`).
 */
export type TUpdatePlayerDto = Omit<components['schemas']['UpdatePlayerDto'], 'positions' | 'wantToPlay'> & {
  positions?: (1 | 2 | 3 | 4 | 5)[] | null
  wantToPlay?: TTournamentFormat[] | null
}
export type TCreateTeamDto = components['schemas']['CreateTeamDto']
export type TUpdateTeamDto = components['schemas']['UpdateTeamDto']
/** У OpenAPI схема називається `AddPlayerDto` (POST /teams/:id/players). */
export type TAddTeamPlayerDto = components['schemas']['AddPlayerDto']
export type TUpdateTournamentDto = components['schemas']['UpdateTournamentDto'] & TTournamentDotaLeagueDto
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
/** Відповідь GET /leaderboard — таблиця лідерів платформи зі зваженим рахунком та вагами формули. */
export type TLeaderboard = components['schemas']['LeaderboardDto']
export type TLeaderboardPlayer = components['schemas']['LeaderboardPlayerDto']
export type TLeaderboardWeights = components['schemas']['LeaderboardWeightsDto']
/** 1v1 ліга (дуелі): записи в `schema.d.ts` додано вручну за форматом openapi-typescript. */
export type TDuel = components['schemas']['DuelDto']
export type TDuelState = TDuel['state']
export type TDuelCancelReason = NonNullable<TDuel['cancelReason']>
export type TDuelFailReason = NonNullable<TDuel['failReason']>
export type TDuelStatus = components['schemas']['DuelStatusDto']
export type TDuelQueueBlockedReason = NonNullable<TDuelStatus['queueBlockedReason']>
export type TDuelQueueState = components['schemas']['DuelQueueStateDto']
export type TDuelBotsStatus = components['schemas']['DuelBotsStatusDto']
export type TDuelRating = components['schemas']['DuelRatingDto']
export type TDuelLeaderboard = components['schemas']['DuelLeaderboardDto']
export type TDuelLeaderboardRow = components['schemas']['DuelLeaderboardRowDto']
export type TDuelPlayerProfile = components['schemas']['DuelPlayerProfileDto']
export type TDuelPlayer = components['schemas']['DuelPlayerDto']
export type TDuelLobbyPlayer = components['schemas']['DuelLobbyPlayerDto']
export type TDuelLobbySide = NonNullable<TDuelLobbyPlayer['side']>
export type TDuelStats = components['schemas']['DuelStatsDto']
export type TDuelStatsPlayer = components['schemas']['DuelStatsPlayerDto']
export type THostBot = components['schemas']['HostBotDto']
export type THostBotStatus = THostBot['status']
export type TCreateHostBotDto = components['schemas']['CreateHostBotDto']
export type TUpdateHostBotDto = components['schemas']['UpdateHostBotDto']
export type TAdminResolveDuelDto = components['schemas']['AdminResolveDuelDto']
