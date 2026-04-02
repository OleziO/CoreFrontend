type TTournament = TResponse<'/api/v1/tournaments/', 'get'>[number]
type TTournamentWithParticipants = TTournament & { // Не работает нормально тип с получением одного турнира где есть participants
  participants: TTeam[]
}
type TTournamentItem = TTournament & {
  participants: TTeam[]
}

type TCreateTournament = Pick<TTournament, 'title' | 'description' | 'prizes' | 'start_time' | 'end_time' | 'start_registration' | 'end_registration' | 'status'> & {
  img?: File | Blob | null
  division_id: string | null
}

type TUpdateTournament = Pick<TTournament, 'id' | 'title' | 'description' | 'prizes' | 'start_time' | 'end_time' | 'start_registration' | 'end_registration' | 'status'> & {
  img?: File | Blob | null
  division_id: string | null
}

type TDivision = TResponse<'/api/v1/constants/divisions', 'get'>[number]

interface ITournamentFilters {
  status: string[] | null
  division: string[] | null
}

type TTournamentOpenMatch = TResponse<'/api/v1/tournaments/{tournament_id}/matches/open', 'get'>[number]
