type TTournament = TResponse<'/tournaments', 'get'>[number] & {
  // Populated client-side by hydrating from GET /tournaments/:id/qualification
  qualification?: import('@/api/types/api.types').TQualificationPhase | null
}
type TPlayoff = TResponse<'/tournaments/{id}/playoff', 'get'>
type TTournamentTeam = TTournament['teams'][number]
