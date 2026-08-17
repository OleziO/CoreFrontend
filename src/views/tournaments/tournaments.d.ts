// Entry-fee (kopecks) is not yet in the generated schema; extend locally until
// `npm run api` picks it up from the deployed backend.
type TTournament = TResponse<'/tournaments', 'get'>[number] & {
  entryFee?: number | null
  paymentJarUrl?: string | null
  // ISO-дата ручного закриття реєстрації адміном; null/undefined — не закрито вручну.
  registrationClosedAt?: string | null
  // Populated client-side by hydrating from GET /tournaments/:id/qualification
  qualification?: import('@/api/types/api.types').TQualificationPhase | null
}
type TPlayoff = TResponse<'/tournaments/{id}/playoff', 'get'>
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
  jarUrl: string | null
}
