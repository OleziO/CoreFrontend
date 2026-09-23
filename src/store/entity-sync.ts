import type { TCurrentPlayer } from '@/api/types/api.types'
import { useAuthStore } from '@/store/modules/auth'
import { usePlayersStore } from '@/views/players/players.store'
import { useTeamsStore } from '@/views/teams/teams.store'
import { useTournamentStore } from '@/views/tournaments/tournaments.store'

/**
 * Єдина точка розсилки змін між сторами (players ↔ teams ↔ tournaments ↔ auth).
 *
 * Контракт: публічні мутатори сторів (`patchXInList`, `getX`, `removeX…`) викликають
 * методи цього хаба; хаб викликає лише НЕпропагуючі `apply*` / `remove*From*` методи
 * інших сторів. Так цикл структурно неможливий: `apply*` ніколи не звертається до хаба.
 *
 * Правило «не додавати»: жоден `apply*` не вставляє нову сутність у чужий список —
 * лише оновлює наявні копії. Інакше частковий список видавав би себе за завантажений.
 */
export const entitySync = {
  /** Гравець змінився (PATCH, ролі, верифікація): ембеднуті копії в ростерах + поточний користувач. */
  playerChanged (updated: TPlayer): void {
    useTeamsStore().applyPlayerToRosters(updated)
    useTournamentStore().applyPlayerToRosters(updated)
    useAuthStore().applyPlayerToCurrentUser(updated)
  },

  /** Свіжий GET /players — найновіші дані гравців перетікають у ростери та /me. */
  playersLoaded (players: TPlayer[]): void {
    for (const p of players) this.playerChanged(p)
  },

  playerRemoved (playerId: string): void {
    useTeamsStore().removePlayerFromRosters(playerId)
    useTournamentStore().removePlayerFromRosters(playerId)
  },

  /** Команда змінилась (профіль, ростер, капітан, верифікація). */
  teamChanged (next: TTeam): void {
    usePlayersStore().applyTeamMembership(next)
    useAuthStore().applyTeamMembership(next)
    useTournamentStore().applyTeamToTournaments(next)
  },

  teamsLoaded (teams: TTeam[]): void {
    for (const t of teams) this.teamChanged(t)
  },

  teamRemoved (teamId: string): void {
    usePlayersStore().clearTeamMembership(teamId)
    useAuthStore().clearTeamMembership(teamId)
    useTournamentStore().removeTeamFromTournaments(teamId)
  },

  /** Турнір змінився — синхронізуємо `team.tournaments[]` у всіх закешованих команд. */
  tournamentChanged (next: TTournament): void {
    useTeamsStore().applyTournamentToTeams(next)
  },

  tournamentsLoaded (tournaments: TTournament[]): void {
    for (const t of tournaments) this.tournamentChanged(t)
  },

  tournamentRemoved (tournamentId: string): void {
    useTeamsStore().removeTournamentFromTeams(tournamentId)
  },

  /** Свіжий GET /auth/me — ті самі дані гравця в players та ростерах. */
  currentUserChanged (user: TCurrentPlayer): void {
    usePlayersStore().applyPlayerData(user)
    useTeamsStore().applyPlayerToRosters(user)
    useTournamentStore().applyPlayerToRosters(user)
  }
}
