// Entry-fee (kopecks) is not yet in the generated schema; extend locally until
// `npm run api` picks it up from the deployed backend.
// NB: Swagger бекенду описує `upperBracketFinalBestOf` / `lowerBracketFinalBestOf` /
// `grandFinalBestOf` у відповіді як `Record<string, never>`, хоча реально приходить
// 1 | 3 | 5 (див. CreateTournamentDto). Читайте їх через нормалізатор (`toBestOf`),
// а не напряму, доки бекенд не виправить @ApiProperty на сутності Tournament.
type TTournament = TResponse<'/tournaments', 'get'>[number] & {
  entryFee?: number | null
  // ISO-дата ручного закриття реєстрації адміном; null/undefined — не закрито вручну.
  registrationClosedAt?: string | null
  // Вікно подачі кваліфікаційних матчів. Власні колонки турніру, більше не
  // виводяться з дат реєстрації. Опційні, доки `npm run api` не підхопить схему.
  qualificationStartsAt?: string
  qualificationEndsAt?: string
  // ID ліги в клієнті Dota 2 (league_id); null/undefined — не прив'язано. Опційне, доки
  // `npm run api` не підхопить схему.
  dotaLeagueId?: number | null
  // Populated client-side by hydrating from GET /tournaments/:id/qualification
  qualification?: import('@/api/types/api.types').TQualificationPhase | null
}

// Призове місце плей-оф (елемент `TPlayoff.placements`).
type TTournamentPodiumPlace = 1 | 2 | 3
type TTournamentPodiumTeam = {
  id: string
  name: string
  logoUrl: string | null
}
type TTournamentPodiumEntry = {
  place: TTournamentPodiumPlace
  team: TTournamentPodiumTeam
}

// `placements` — призери плей-оф, які бек рахує з таблиці playoff_series (без Challonge):
// [] доки гранд-фінал не вирішено. Опційне, доки `npm run api` не підхопить схему.
type TPlayoff = TResponse<'/tournaments/{id}/playoff', 'get'> & {
  placements?: TTournamentPodiumEntry[]
}
type TTournamentTeam = TTournament['teams'][number]

// Per-team entry-fee payment status. Mirrors the backend PaymentStatus enum and
// GET /tournaments/:id/payments; declared locally until the schema is regenerated.
type TTournamentPaymentStatus = 'PENDING' | 'UNDERPAID' | 'PAID'
type TTournamentPaymentSummary = {
  teamId: string
  status: TTournamentPaymentStatus
  amountPaid: number
}

// Captain-scoped payment intent (POST .../payments/intent, GET .../payments/me).
type TTournamentPaymentIntent = {
  reference: string
  status: TTournamentPaymentStatus
  amount: number
  amountPaid: number
  pageUrl: string | null
}

// Донат на лігу через той самий Monobank ФОП-еквайринг, що й вступний внесок
// (POST .../donations/intent). Ендпоінт ще відсутній у згенерованій схемі.
type TTournamentDonationIntent = {
  reference: string
  /** Сума донату в копійках. */
  amount: number
  pageUrl: string | null
}
