type TMixTournament = TResponse<'/api/v1/mix/tournaments/', 'get'>[number]
type TMixTeam = NonNullable<TMixTournament['teams']>[number]
type TMixPoolEntry = NonNullable<TMixTournament['mix_pools']>[number]
type TMixOpenMatch = TResponse<'/api/v1/mix/tournaments/{tournament_id}/matches/open', 'get'>[number]
interface ITournamentAction {
  label: string
  nextStatus: ETournamentStatus | null
}
