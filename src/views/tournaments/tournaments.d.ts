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

// Матч, результат якого внесено вручну (техпоразка / ручне внесення): переможець є,
// а справжнього числового dotaMatchId немає (null, `tech_loss_*`, `manual_*`).
// GET /tournaments/:id/manual-matches; ендпоінт ще відсутній у згенерованій схемі.
type TManualMatchStage = 'qualification' | 'playoff'
type TManualMatchTeam = {
  id: string
  name: string
  logoUrl: string | null
}
type TManualMatch = {
  stage: TManualMatchStage
  matchId: string
  teamA: TManualMatchTeam
  teamB: TManualMatchTeam
  winnerTeamId: string
  dotaMatchId: string | null
  /** Лише плей-оф: номер гри в серії. */
  gameNumber: number | null
  /** Лише плей-оф: довжина серії (1 / 3 / 5). */
  bestOf: number | null
  /** Лише плей-оф: тип фіналу для фінальних слотів. */
  finalType: 'upper_bracket_final' | 'lower_bracket_final' | 'grand_final' | string | null
}

// POST /tournaments/:id/manual-matches/link — прив'язати справжній ID Dota-матчу.
type TLinkManualMatchPayload = {
  stage: TManualMatchStage
  matchId: string
  dotaMatchId: string
}
type TLinkManualMatchResult = {
  stage: TManualMatchStage
  matchId: string
  dotaMatchId: string
  /** true, якщо команди вдалося розпізнати в OpenDota і переможець збігся. */
  winnerVerified: boolean
  /** Скільки рядків статистики гравців записано. */
  participantsRecorded: number
}
