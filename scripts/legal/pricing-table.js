/**
 * Таблиця цін для статичної сторінки `/prices/` з відповіді `GET /public/pricing`.
 *
 * Один код на двох етапах: `vite.config.legal.ts` викликає функцію під час білду
 * (дані вшиваються в HTML, сторінку видно без JS), а потім вставляє цей самий
 * файл інлайн-скриптом, який оновлює таблицю з API вже в браузері.
 * Тому тут лише чистий браузерний JS: без import/export і без залежностей.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function renderPricingTable (data, lang) {
  const en = lang === 'en'
  const locale = en ? 'en-GB' : 'uk-UA'
  const t = en
    ? {
      vipTitle: 'Core League VIP status — 1 month',
      perMonth: 'per month',
      vipRenew: 'Renews automatically every month at {price} until cancelled. ' +
          'Auto-renewal can be cancelled at any time in the VIP window; VIP stays active until the end of the paid period.',
      vipLoyalty: 'Loyalty discount −{p}% for players who paid for VIP before the switch to WayForPay.',
      vipTournament: 'VIP captains pay {p}% less for a tournament entry fee.',
      entryTitle: 'Team tournament entry fee',
      entryHow: 'Paid once by the team captain for the whole team (5 players). The amount is set for each tournament ' +
          'and shown before payment. The team is registered automatically once the payment is confirmed.',
      colTournament: 'Tournament',
      colTeam: 'Per team',
      colPlayer: 'Per player (equivalent)',
      colVip: 'VIP captain',
      colStart: 'Starts',
      colRegistration: 'Registration until',
      noTournaments: 'There are no paid tournaments open for registration right now.',
      supportTitle: 'Voluntary support of the league',
      supportRange: 'Any amount from {min} to {max}, chosen by the payer.',
      supportNote: 'A voluntary payment towards streams and tournaments. Nothing is delivered in return, ' +
          'and it does not change any prize pool.',
      currency: 'All prices are in Ukrainian hryvnias (UAH). Payment by Visa or Mastercard card through WayForPay.',
      kyiv: 'Kyiv time',
      fetched: 'Prices as of {date}.'
    }
    : {
      vipTitle: 'VIP-статус Core League — 1 місяць',
      perMonth: 'на місяць',
      vipRenew: 'Підписка продовжується автоматично щомісяця за {price} до скасування. ' +
          'Скасувати автопродовження можна будь-коли у вікні VIP — статус діє до кінця оплаченого періоду.',
      vipLoyalty: 'Знижка лояльності −{p}% для гравців, які оплачували VIP до переходу на WayForPay.',
      vipTournament: 'VIP-капітани сплачують вступний внесок на {p}% менше.',
      entryTitle: 'Вступний внесок за участь команди у турнірі',
      entryHow: 'Сплачує капітан один раз за всю команду (5 гравців). Сума встановлюється окремо для кожного ' +
          'турніру й показується перед оплатою. Після підтвердження оплати команду реєструють автоматично.',
      colTournament: 'Турнір',
      colTeam: 'За команду',
      colPlayer: 'З гравця (еквівалент)',
      colVip: 'Для VIP-капітана',
      colStart: 'Початок',
      colRegistration: 'Реєстрація до',
      noTournaments: 'Зараз немає платних турнірів із відкритою реєстрацією.',
      supportTitle: 'Добровільна підтримка ліги',
      supportRange: 'Сума на вибір платника: від {min} до {max}.',
      supportNote: 'Добровільний платіж на розвиток трансляцій і турнірів. Нічого не нараховується, ' +
          'на призовий фонд не впливає.',
      currency: 'Усі ціни — в українських гривнях (UAH). Оплата карткою Visa або Mastercard через WayForPay.',
      kyiv: 'за київським часом',
      fetched: 'Ціни станом на {date}.'
    }

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch])

  const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key])

  const money = (kopecks) => {
    const value = Number(kopecks) || 0
    const amount = (value / 100).toLocaleString(locale, {
      minimumFractionDigits: value % 100 ? 2 : 0,
      maximumFractionDigits: 2
    })
    return `${amount}&nbsp;₴`
  }

  const dateTime = new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv'
  })
  const when = (iso) => {
    if (!iso) return '—'
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? '—' : dateTime.format(date)
  }

  const vip = data.vip || {}
  const support = data.support || {}
  const tournaments = Array.isArray(data.tournaments) ? data.tournaments : []
  const vipPrice = money(vip.priceKopecks)

  const vipNotes = [fill(t.vipRenew, { price: vipPrice })]
  if (vip.switchDiscountPercent) vipNotes.push(fill(t.vipLoyalty, { p: vip.switchDiscountPercent }))
  if (vip.tournamentDiscountPercent) vipNotes.push(fill(t.vipTournament, { p: vip.tournamentDiscountPercent }))

  const rows = tournaments.map((item) => `
      <tr>
        <th scope="row" data-label="${t.colTournament}">${escapeHtml(item.name)}</th>
        <td data-label="${t.colTeam}">${money(item.entryFeeKopecks)}</td>
        <td data-label="${t.colPlayer}">${money(item.perPlayerKopecks)}</td>
        <td data-label="${t.colVip}">${money(item.vipEntryFeeKopecks)}</td>
        <td data-label="${t.colStart}">${escapeHtml(when(item.startsAt))}</td>
        <td data-label="${t.colRegistration}">${escapeHtml(when(item.registrationEndsAt))}</td>
      </tr>`).join('')

  const table = tournaments.length
    ? `
    <div class="lg-table-wrap">
      <table class="lg-table lg-table--stack">
        <thead>
          <tr>
            <th scope="col">${t.colTournament}</th>
            <th scope="col">${t.colTeam}</th>
            <th scope="col">${t.colPlayer}</th>
            <th scope="col">${t.colVip}</th>
            <th scope="col">${t.colStart}</th>
            <th scope="col">${t.colRegistration}</th>
          </tr>
        </thead>
        <tbody>${rows}
        </tbody>
      </table>
    </div>
    <p class="lg-muted">${t.kyiv}</p>`
    : `<p class="lg-muted">${t.noTournaments}</p>`

  return `
  <section class="lg-price" aria-labelledby="price-vip">
    <h2 id="price-vip">${t.vipTitle}</h2>
    <p class="lg-price__amount">${vipPrice} <span>${t.perMonth}</span></p>
    <ul class="lg-price__notes">${vipNotes.map((note) => `<li>${note}</li>`).join('')}</ul>
  </section>
  <section class="lg-price" aria-labelledby="price-entry">
    <h2 id="price-entry">${t.entryTitle}</h2>
    <p>${t.entryHow}</p>${table}
  </section>
  <section class="lg-price" aria-labelledby="price-support">
    <h2 id="price-support">${t.supportTitle}</h2>
    <p class="lg-price__amount">${money(support.minKopecks)} – ${money(support.maxKopecks)}</p>
    <ul class="lg-price__notes">
      <li>${fill(t.supportRange, { min: money(support.minKopecks), max: money(support.maxKopecks) })}</li>
      <li>${t.supportNote}</li>
    </ul>
  </section>
  <p class="lg-muted">${t.currency} ${fill(t.fetched, { date: escapeHtml(when(new Date().toISOString())) })}</p>`
}
