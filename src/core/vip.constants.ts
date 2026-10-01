/** Знижка VIP на вступний внесок турнірів, % (бек — `VIP_TOURNAMENT_DISCOUNT_PERCENT`). */
export const VIP_TOURNAMENT_DISCOUNT_PERCENT = 10

/** Внесок (копійки) з VIP-знижкою — те саме округлення, що й на беку (`vipEntryFee`). */
export function getVipEntryFee (entryFee: number, isVip: boolean): number {
  if (!isVip || entryFee <= 0) return entryFee
  return Math.round((entryFee * (100 - VIP_TOURNAMENT_DISCOUNT_PERCENT)) / 100)
}

/** Ціна VIP за місяць, ₴ (бек — `VIP_MONTHLY_PRICE_KOPECKS`). Показується до відповіді `/vip/me`. */
export const VIP_PRICE_UAH = 250

/**
 * Палітра рамки VIP — дзеркало `VIP_FRAME_COLORS` на беку (бек відхилить інший колір).
 * Закрита на відміну від вільного піпетки: кольори ролей (адмін — золото, медіа — фіолет,
 * гравець — синій, капітан — бурштин, стандартна рамка — ціан) зарезервовані.
 */
export const VIP_FRAME_PALETTE: ReadonlyArray<{ hex: string; label: string }> = [
  { hex: '#10B981', label: 'Смарагд' },
  { hex: '#A3E635', label: 'Лайм' },
  { hex: '#F97316', label: 'Мандарин' },
  { hex: '#FDA4AF', label: 'Пудра' },
  { hex: '#EC4899', label: 'Фуксія' },
  { hex: '#9D174D', label: 'Ягода' },
  { hex: '#E2E8F0', label: 'Срібло' },
  { hex: '#64748B', label: 'Графіт' }
]

/** Варіанти ручної видачі VIP адміном (вкладка «VIP» в адмінці). */
export const VIP_ADMIN_GRANT_OPTIONS: ReadonlyArray<{ months: number; label: string }> = [
  { months: 1, label: '1 місяць' },
  { months: 2, label: '2 місяці' },
  { months: 3, label: '3 місяці' },
  { months: 5, label: '5 місяців' },
  { months: 6, label: '6 місяців' }
]

/** Безстроковий VIP бек зберігає як `vipUntil` = 9999-12-31 (`VIP_LIFETIME_UNTIL`). */
const VIP_LIFETIME_FROM_YEAR = 9999

export function isVipLifetime (vipUntil: string | null | undefined): boolean {
  return !!vipUntil && new Date(vipUntil).getUTCFullYear() >= VIP_LIFETIME_FROM_YEAR
}
