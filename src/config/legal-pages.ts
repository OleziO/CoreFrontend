/**
 * Юридичні сторінки сайту — статичний HTML, який під час білду рендерить
 * `vite.config.legal.ts` з `legal/<lang>/<page>.md` (поза SPA: без вікового
 * гейта й без логіну). Єдине джерело слагів і коротких назв для футера SPA,
 * мобільного меню, згоди на оплату і самих статичних сторінок.
 *
 * Файл без імпортів: його читає і застосунок, і конфіг Vite (tsconfig.node).
 */
export const LEGAL_PAGE_SLUGS = ['terms', 'offer', 'refund', 'privacy', 'contacts', 'rules', 'prices'] as const

export type TLegalPageSlug = typeof LEGAL_PAGE_SLUGS[number]

export type TLegalLang = 'uk' | 'en'

export const LEGAL_LANGS: readonly TLegalLang[] = ['uk', 'en']

/** Короткі назви для навігації (заголовки сторінок — з front matter самих текстів). */
export const LEGAL_PAGE_LABELS: Record<TLegalLang, Record<TLegalPageSlug, string>> = {
  uk: {
    terms: 'Умови користування',
    offer: 'Договір публічної оферти',
    refund: 'Повернення коштів',
    privacy: 'Політика конфіденційності',
    contacts: 'Контакти',
    rules: 'Правила турнірів',
    prices: 'Ціни'
  },
  en: {
    terms: 'Terms of Use',
    offer: 'Public Offer Agreement',
    refund: 'Refund Policy',
    privacy: 'Privacy Policy',
    contacts: 'Contacts',
    rules: 'Tournament Rules',
    prices: 'Prices'
  }
}

/**
 * Публічна адреса сторінки, завжди з кінцевим слешем: хостинг віддає
 * `dist/<page>/index.html` як справжній файл раніше за SPA-фолбек.
 */
export function legalPageHref (slug: TLegalPageSlug, lang: TLegalLang = 'uk'): string {
  return lang === 'en' ? `/en/${slug}/` : `/${slug}/`
}
