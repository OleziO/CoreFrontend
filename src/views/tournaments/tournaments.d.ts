type TTournament = TResponse<'/tournaments', 'get'>[number]
type TPlayoff = TResponse<'/tournaments/{id}/playoff', 'get'>
