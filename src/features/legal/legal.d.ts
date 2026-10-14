/**
 * `GET /public/pricing` — публічні ціни (без авторизації). Ті самі хелпери, що
 * й чекаут, рахують суми на беку; звідси ж — актуальна версія юридичних умов.
 *
 * Тимчасово описано вручну: бек з ендпоінтом ще не задеплоєний, тож
 * `schema.d.ts` про нього не знає. Після `npm run api` — замінити на
 * `TResponse<'/public/pricing', 'get'>`.
 */
export interface IPublicPricingTournament {
  id: string
  name: string
  entryFeeKopecks: number
  perPlayerKopecks: number
  vipEntryFeeKopecks: number
  prizePool: number
  registrationEndsAt: string | null
  startsAt: string | null
}

export interface IPublicPricing {
  currency: 'UAH'
  legalVersion: string
  vip: {
    priceKopecks: number
    periodMonths: number
    switchDiscountPercent: number
    tournamentDiscountPercent: number
  }
  support: {
    minKopecks: number
    maxKopecks: number
  }
  tournaments: IPublicPricingTournament[]
}

/**
 * Згода з офертою, умовами й політикою повернення — у тілі всіх трьох
 * платіжних інтентів (`/vip/checkout`, `/tournaments/:id/payments/intent`,
 * `/tournaments/:id/donations/intent`). Бек відмовляє (400) без `consent: true`
 * або з застарілою `legalVersion`. Поля ще не в `schema.d.ts` — див. вище.
 */
export interface IPaymentConsentBody {
  consent: true
  legalVersion: string
}
