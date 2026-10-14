import legalConfig from '../../legal/config.json'

/**
 * Реквізити продавця й параметри політик — `legal/config.json`, той самий файл,
 * з якого білд підставляє `{{KEY}}` у статичні юридичні сторінки. Реквізити
 * заповнює лише власник; production-білд падає, поки лишається хоч один `{{…}}`.
 *
 * Версію умов для згоди на оплату беремо НЕ звідси, а з `GET /public/pricing`
 * (див. `usePaymentConsent`) — бек перевіряє саме її.
 */
export type TLegalSellerKey = keyof typeof legalConfig.seller

export const LEGAL_SELLER: Readonly<Record<TLegalSellerKey, string>> = legalConfig.seller

export const LEGAL_POLICY: Readonly<Record<keyof typeof legalConfig.policy, string>> = legalConfig.policy

/** Значення ще не заповнене власником (`{{FOP_NAME}}` тощо). */
export function isLegalPlaceholder (value: string): boolean {
  return /\{\{[^}]*\}\}/.test(value)
}
