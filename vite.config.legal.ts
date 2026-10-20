import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { loadEnv, type Plugin, type ResolvedConfig } from 'vite'
import { Marked } from 'marked'
import { colors } from './tailwind/tailwind.colors'
import {
  LEGAL_LANGS,
  LEGAL_PAGE_LABELS,
  LEGAL_PAGE_SLUGS,
  legalPageHref,
  type TLegalLang,
  type TLegalPageSlug
} from './src/config/legal-pages'

/*
 * STATIC LEGAL PAGES
 *
 * `legal/<lang>/<page>.md` (front matter + Markdown) → self-contained HTML:
 * UK at `dist/<page>/index.html`, EN at `dist/en/<page>/index.html`. The pages
 * live outside the SPA, so no age gate, no login and the text is in the HTML a
 * crawler gets. `npm run dev` serves the same pages from memory.
 *
 * Any build fails when a page is missing or a version differs from
 * `legal/config.json` → `legalVersion`. Unfilled seller details (`{{…}}`) do
 * not block a production build (owner 2026-10-14: the site must deploy before
 * the details are added): their footer rows are left out and the text reads
 * "[буде додано]" / "[to be added]". `LEGAL_STRICT=1` (or
 * `npm run legal:check -- --strict`) fails on them — run it before submitting
 * to WayForPay. Other modes keep the raw `{{…}}` and a draft banner.
 */

interface ILegalConfig {
  legalVersion: string
  seller: Record<string, string>
  /** English forms (transliterated name, address) that override `seller` on `/en/` pages. */
  sellerEn?: Record<string, string>
  policy: Record<string, string>
}

interface ILegalContext {
  root: string
  mode: string
  /** Production without `LEGAL_STRICT`: unfilled `{{…}}` are published as "[буде додано]". */
  publishPending: boolean
  config: ILegalConfig
  /** `{{KEY}}` → value: seller + policy keys. */
  values: Record<string, string>
  siteUrl: string
  apiBase: string
  pricingScript: string
  renderPricing: (data: unknown, lang: TLegalLang) => string
}

interface IRenderedPage {
  lang: TLegalLang
  slug: TLegalPageSlug
  html: string
  placeholders: string[]
  problems: string[]
}

const DEFAULT_SITE_URL = 'https://www.coreleague.online'
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,300..800;1,300..800' +
  '&family=JetBrains+Mono:wght@400;500;600;700&family=Russo+One&display=swap'
const PLACEHOLDER_RE = /\{\{\s*([^{}]*?)\s*\}\}/g
const PAGE_PATH_RE = new RegExp(`^/(?:(en)/)?(${LEGAL_PAGE_SLUGS.join('|')})(/?)$`)
const LINK_RE = new RegExp(`href="/(?:en/)?(${LEGAL_PAGE_SLUGS.join('|')})/?(#[^"]*)?"`, 'g')

const UI: Record<TLegalLang, Record<string, string>> = {
  uk: {
    locale: 'uk-UA',
    ogLocale: 'uk_UA',
    home: 'Core League — на головну',
    langSwitch: 'Мова',
    docs: 'Документи',
    updated: 'Остання редакція',
    version: 'Версія',
    seller: 'Продавець',
    support: 'Підтримка',
    fop: 'ФОП',
    taxId: 'РНОКПП',
    legalAddress: 'Юридична адреса',
    actualAddress: 'Фактична адреса',
    phone: 'Телефон',
    email: 'Email',
    chat: 'Чат підтримки',
    review: 'Строк розгляду звернень',
    reviewValue: 'до {days} робочих днів',
    payments: 'Оплата карткою Visa або Mastercard через платіжний сервіс WayForPay. Ціни — у гривнях (UAH).',
    valve: 'Dota 2 є торговельною маркою Valve Corporation. Core League не пов’язана з Valve і не схвалена нею.',
    loading: 'Завантажуємо актуальні ціни…',
    failed: 'Не вдалося завантажити ціни. Оновіть сторінку або напишіть у підтримку.',
    noscript: 'Ціни завантажуються з сервера Core League — увімкніть JavaScript, щоб їх побачити, ' +
      'або напишіть у підтримку.',
    draft: 'Чернетка для перевірки — не заповнено: {keys}. Заповніть legal/config.json до подання у WayForPay.',
    pending: '[буде додано]'
  },
  en: {
    locale: 'en-GB',
    ogLocale: 'en_GB',
    home: 'Core League — home',
    langSwitch: 'Language',
    docs: 'Documents',
    updated: 'Last updated',
    version: 'Version',
    seller: 'Seller',
    support: 'Support',
    fop: 'Sole proprietor (FOP)',
    taxId: 'Tax ID (RNOKPP)',
    legalAddress: 'Registered address',
    actualAddress: 'Actual address',
    phone: 'Phone',
    email: 'Email',
    chat: 'Support chat',
    review: 'Request review time',
    reviewValue: 'up to {days} business days',
    payments: 'Payment by Visa or Mastercard card through the WayForPay payment service. Prices are in UAH.',
    valve: 'Dota 2 is a trademark of Valve Corporation. Core League is not affiliated with or endorsed by Valve.',
    loading: 'Loading current prices…',
    failed: 'Could not load the prices. Reload the page or contact support.',
    noscript: 'Prices are loaded from the Core League server — enable JavaScript to see them, or contact support.',
    draft: 'Draft preview — not filled in: {keys}. Fill legal/config.json before applying to WayForPay.',
    pending: '[to be added]'
  }
}

// ─── Small helpers ──────────────────────────────────────────────────────────

function escapeHtml (value: string): string {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch)
}

function fill (template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole)
}

function hexToRgb (hex: string): string {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')
}

/** Мінімальний front matter: рядки `key: value` між `---`. */
export function parseFrontMatter (source: string): { data: Record<string, string>; body: string } {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(source)
  if (!match) return { data: {}, body: source }
  const data: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line)
    if (pair) data[pair[1]] = pair[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return { data, body: source.slice(match[0].length) }
}

function substitute (text: string, values: Record<string, string>): string {
  return text.replace(PLACEHOLDER_RE, (whole, key: string) => values[key] ?? whole)
}

function findPlaceholders (text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER_RE)].map(m => m[1]))]
}

function formatDay (value: string, lang: TLegalLang): string {
  const date = new Date(`${value}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(UI[lang].locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(date)
}

function renderMarkdown (body: string, lang: TLegalLang): string {
  const seen = new Map<string, number>()
  const marked = new Marked({ gfm: true, async: false })
  marked.use({
    renderer: {
      // Заголовки з id — на розділи можна посилатися (`/terms/#payment`).
      heading ({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens)
        const base = inner.replace(/<[^>]+>/g, '').toLowerCase().trim()
          .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'section'
        const count = seen.get(base) ?? 0
        seen.set(base, count + 1)
        const id = count ? `${base}-${count}` : base
        return `<h${depth} id="${escapeHtml(id)}">${inner}</h${depth}>\n`
      }
    }
  })
  return (marked.parse(body) as string)
    // Посилання між юридичними сторінками: канонічна адреса зі слешем, в EN — під /en/.
    .replace(LINK_RE, (_whole, slug: TLegalPageSlug, hash?: string) => `href="${legalPageHref(slug, lang)}${hash ?? ''}"`)
    // Широкі таблиці прокручуються в собі, а не розпирають сторінку на телефоні.
    .replace(/<table>/g, '<div class="lg-table-wrap"><table class="lg-table">')
    .replace(/<\/table>/g, '</table></div>')
}

// ─── Page pieces ────────────────────────────────────────────────────────────

function cardMarks (): string {
  const white = colors.white
  return `<span class="lg-marks">
      <svg class="lg-mark" viewBox="0 0 64 40" role="img" aria-label="Visa">
        <rect width="64" height="40" rx="6" fill="${white}"/>
        <text x="32" y="26.5" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17"
          font-weight="700" font-style="italic" letter-spacing="0.5" fill="${colors.blue[900]}">VISA</text>
      </svg>
      <svg class="lg-mark" viewBox="0 0 64 40" role="img" aria-label="Mastercard">
        <rect width="64" height="40" rx="6" fill="${white}"/>
        <circle cx="26" cy="20" r="11" fill="${colors.red[600]}"/>
        <circle cx="38" cy="20" r="11" fill="${colors.yellow[500]}"/>
        <path d="M32 10.78A11 11 0 0 1 32 29.22A11 11 0 0 1 32 10.78Z" fill="${colors.orange[500]}"/>
      </svg>
    </span>`
}

function contactValue (key: string, value: string): string {
  const safe = escapeHtml(value)
  if (findPlaceholders(value).length) return safe
  if (key === 'SUPPORT_EMAIL') return `<a href="mailto:${safe}">${safe}</a>`
  if (key === 'PHONE') return `<a href="tel:${escapeHtml(value.replace(/[^\d+]/g, ''))}">${safe}</a>`
  if (key === 'SUPPORT_CHAT' && /^https?:\/\//.test(value)) {
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${safe.replace(/^https?:\/\//, '')}</a>`
  }
  return safe
}

function sellerFor (ctx: ILegalContext, lang: TLegalLang): Record<string, string> {
  return lang === 'en' ? { ...ctx.config.seller, ...ctx.config.sellerEn } : ctx.config.seller
}

function footer (ctx: ILegalContext, lang: TLegalLang, current: TLegalPageSlug): string {
  const ui = UI[lang]
  const seller = sellerFor(ctx, lang)
  const row = (label: string, key: string) => {
    const value = seller[key] ?? `{{${key}}}`
    if (ctx.publishPending && findPlaceholders(value).length) return ''
    return `<div><dt>${label}</dt><dd>${contactValue(key, value)}</dd></div>`
  }
  const sellerRows = [
    row(ui.fop, 'FOP_NAME'),
    row(ui.taxId, 'TAX_ID'),
    row(ui.legalAddress, 'LEGAL_ADDRESS'),
    row(ui.actualAddress, 'ACTUAL_ADDRESS')
  ].filter(Boolean)
  const sellerSection = sellerRows.length
    ? `<section aria-label="${ui.seller}">
        <h2>${ui.seller}</h2>
        <dl>
          ${sellerRows.join('\n          ')}
        </dl>
      </section>`
    : ''
  const links = LEGAL_PAGE_SLUGS.map(slug => {
    const currentAttr = slug === current ? ' aria-current="page"' : ''
    return `<li><a href="${legalPageHref(slug, lang)}"${currentAttr}>${LEGAL_PAGE_LABELS[lang][slug]}</a></li>`
  }).join('')

  return `<footer class="lg-footer">
  <div class="lg-wrap">
    <nav aria-label="${ui.docs}"><ul class="lg-footer__links">${links}</ul></nav>
    <div class="lg-footer__grid">
      ${sellerSection}
      <section aria-label="${ui.support}">
        <h2>${ui.support}</h2>
        <dl>
          ${row(ui.phone, 'PHONE')}
          ${row(ui.email, 'SUPPORT_EMAIL')}
          ${row(ui.chat, 'SUPPORT_CHAT')}
          <div><dt>${ui.review}</dt><dd>${fill(ui.reviewValue, { days: escapeHtml(ctx.values.SUPPORT_REVIEW_DAYS ?? '') })}</dd></div>
        </dl>
      </section>
    </div>
    <div class="lg-footer__pay">${cardMarks()}<p>${ui.payments}</p></div>
    <p class="lg-footer__fine">${ui.valve}</p>
    <p class="lg-footer__fine">© ${new Date().getFullYear()} Core League</p>
  </div>
</footer>`
}

function styles (): string {
  const primary = colors.primary.DEFAULT
  return `
:root {
  --bg: ${colors.background};
  --bg-rgb: ${hexToRgb(colors.background)};
  --surface: ${colors.surface};
  --elevated: ${colors['elevated-surface']};
  --overlay: ${colors.overlay};
  --primary: ${primary};
  --primary-rgb: ${hexToRgb(primary)};
  --primary-soft: ${colors.primary[300]};
  --gold: ${colors.gold.DEFAULT};
  --gold-rgb: ${hexToRgb(colors.gold.DEFAULT)};
  --warning: ${colors.warning.DEFAULT};
  --warning-rgb: ${hexToRgb(colors.warning.DEFAULT)};
  --white: ${colors.white};
  --text: rgba(255, 255, 255, 0.88);
  --muted: rgba(255, 255, 255, 0.66);
  --faint: rgba(255, 255, 255, 0.5);
  --border: rgba(var(--primary-rgb), 0.16);
  --border-neutral: rgba(255, 255, 255, 0.1);
  --font-body: 'Exo 2', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Russo One', 'Exo 2', system-ui, sans-serif;
}
*, *::before, *::after { box-sizing: border-box; }
html { color-scheme: dark; -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font: 400 16px/1.65 var(--font-body); font-variant-numeric: tabular-nums;
  background-image: radial-gradient(ellipse 70% 40% at 0% 0%, rgba(var(--primary-rgb), 0.08), transparent 70%);
  background-repeat: no-repeat;
}
a { color: var(--primary); text-underline-offset: 3px; }
a:hover { color: var(--primary-soft); }
a:focus-visible { outline: 2px solid rgba(var(--primary-rgb), 0.6); outline-offset: 2px; border-radius: 4px; }
.lg-wrap { max-width: 860px; margin: 0 auto; padding: 0 16px; }
.lg-skip { position: absolute; left: -999px; }
.lg-skip:focus { left: 16px; top: 8px; z-index: 20; background: var(--surface); padding: 8px 12px; }
.lg-draft {
  margin: 0; padding: 10px 16px; text-align: center; font-size: 14px; color: var(--warning);
  background: rgba(var(--warning-rgb), 0.12); border-bottom: 1px solid rgba(var(--warning-rgb), 0.45);
}
.lg-header {
  position: sticky; top: 0; z-index: 10; border-bottom: 1px solid var(--border);
  background: rgba(var(--bg-rgb), 0.9); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
}
.lg-header .lg-wrap { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px; }
.lg-logo {
  display: inline-flex; align-items: center; gap: 10px; min-height: 44px; text-decoration: none;
  font-family: var(--font-display); font-size: 17px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--white);
}
.lg-logo:hover { color: var(--primary); }
.lg-logo__dot { width: 8px; height: 8px; border-radius: 2px; background: var(--primary); box-shadow: 0 0 10px rgba(var(--primary-rgb), 0.9); }
.lg-lang { display: inline-flex; gap: 2px; padding: 3px; border: 1px solid var(--border); border-radius: 999px; }
.lg-lang a {
  display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 36px; padding: 0 12px;
  border-radius: 999px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; color: var(--muted); text-decoration: none;
}
.lg-lang a[aria-current] { color: var(--primary); background: rgba(var(--primary-rgb), 0.14); }
.lg-main { padding: 28px 0 48px; }
.lg-doc h1 {
  margin: 0 0 14px; font-family: var(--font-display); font-weight: 400; color: var(--white);
  font-size: clamp(26px, 6vw, 38px); line-height: 1.15; overflow-wrap: anywhere;
}
.lg-meta {
  display: flex; flex-wrap: wrap; gap: 4px 18px; margin: 0 0 28px; padding: 10px 14px; font-size: 14px; color: var(--muted);
  border: 1px solid var(--border); border-radius: 12px; background: var(--surface);
}
.lg-meta b { color: var(--white); font-weight: 600; }
.lg-doc h2 { margin: 36px 0 12px; font-family: var(--font-display); font-weight: 400; font-size: 22px; line-height: 1.25; color: var(--white); }
.lg-doc h3 { margin: 26px 0 8px; font-size: 18px; font-weight: 700; color: var(--white); }
.lg-doc h4 { margin: 20px 0 6px; font-size: 16px; font-weight: 700; color: var(--white); }
.lg-doc p, .lg-doc ul, .lg-doc ol { margin: 0 0 14px; }
.lg-doc ul, .lg-doc ol { padding-left: 22px; }
.lg-doc li { margin: 4px 0; }
.lg-doc strong { color: var(--white); }
.lg-doc blockquote {
  margin: 16px 0; padding: 12px 16px; color: var(--muted);
  border-left: 3px solid var(--gold); border-radius: 0 12px 12px 0; background: var(--surface);
}
.lg-doc blockquote p:last-child { margin-bottom: 0; }
.lg-doc hr { margin: 28px 0; border: 0; border-top: 1px solid var(--border-neutral); }
.lg-doc code { padding: 1px 6px; border-radius: 6px; background: var(--elevated); font: 0.9em 'JetBrains Mono', monospace; }
.lg-doc :is(p, li, td, dd) { overflow-wrap: anywhere; }
.lg-table-wrap { margin: 0 0 14px; overflow-x: auto; border: 1px solid var(--border); border-radius: 12px; }
.lg-table { width: 100%; border-collapse: collapse; font-size: 15px; }
.lg-table th, .lg-table td { padding: 10px 12px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--border-neutral); }
.lg-table thead th { color: var(--white); font-weight: 700; background: var(--elevated); }
.lg-table tbody tr:last-child > * { border-bottom: 0; }
.lg-table tbody th { color: var(--white); font-weight: 600; }
.lg-price { margin: 22px 0; padding: 18px 18px 4px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); }
.lg-doc .lg-price h2 { margin-top: 0; font-size: 20px; }
.lg-price__amount { margin: 0 0 10px !important; font-family: var(--font-display); font-size: 28px; line-height: 1.2; color: var(--white); }
.lg-price__amount span { font-family: var(--font-body); font-size: 15px; color: var(--muted); }
.lg-price__notes { color: var(--muted); }
.lg-muted { color: var(--faint); font-size: 14px; }
.lg-marks { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.lg-mark { display: block; width: 52px; height: 32px; }
.lg-footer { padding: 32px 0 40px; border-top: 1px solid var(--border); background: var(--surface); font-size: 14px; color: var(--muted); }
.lg-footer__links { display: flex; flex-wrap: wrap; gap: 4px 18px; margin: 0 0 24px; padding: 0; list-style: none; }
.lg-footer__links a { display: inline-flex; align-items: center; min-height: 44px; color: var(--text); text-decoration: none; }
.lg-footer__links a:hover, .lg-footer__links a[aria-current] { color: var(--primary); }
.lg-footer__grid { display: grid; gap: 20px; margin-bottom: 24px; }
.lg-footer h2 { margin: 0 0 8px; font: 700 12px/1.4 var(--font-body); letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); }
.lg-footer dl { margin: 0; display: grid; gap: 8px; }
.lg-footer dt { font-size: 12px; color: var(--faint); }
.lg-footer dd { margin: 0; color: var(--text); overflow-wrap: anywhere; }
.lg-footer__pay { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin-bottom: 16px; }
.lg-footer__pay p { margin: 0; flex: 1 1 240px; }
.lg-footer__fine { margin: 6px 0 0; font-size: 12px; color: var(--faint); }
@media (min-width: 720px) {
  .lg-wrap { padding: 0 24px; }
  .lg-main { padding: 44px 0 64px; }
  .lg-footer__grid { grid-template-columns: 1fr 1fr; gap: 32px; }
}
@media (max-width: 640px) {
  .lg-table--stack thead { display: none; }
  .lg-table--stack, .lg-table--stack tbody, .lg-table--stack tr, .lg-table--stack th, .lg-table--stack td { display: block; width: 100%; }
  .lg-table--stack tr { padding: 10px 12px; border-bottom: 1px solid var(--border-neutral); }
  .lg-table--stack tbody tr:last-child { border-bottom: 0; }
  .lg-table--stack th, .lg-table--stack td { padding: 3px 0; border: 0; }
  .lg-table--stack td::before { content: attr(data-label); display: block; font-size: 12px; color: var(--faint); }
}
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
`
}

function pricingBlock (ctx: ILegalContext, lang: TLegalLang, pricing: unknown): string {
  const ui = UI[lang]
  const url = `${ctx.apiBase}/public/pricing`
  const initial = pricing
    ? ctx.renderPricing(pricing, lang)
    : `<p class="lg-muted">${ui.loading}</p><noscript><p>${ui.noscript}</p></noscript>`
  const failHtml = `<p class="lg-muted">${ui.failed}</p>`

  return `
<div id="pricing-table" class="lg-pricing" data-filled="${pricing ? '1' : '0'}" aria-live="polite">${initial}</div>
<p>${cardMarks()}</p>
<script>
${ctx.pricingScript}
(function () {
  var box = document.getElementById('pricing-table');
  if (!box || !window.fetch) return;
  fetch(${JSON.stringify(url)}, { headers: { Accept: 'application/json' } })
    .then(function (res) { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
    .then(function (data) { box.innerHTML = renderPricingTable(data, ${JSON.stringify(lang)}); box.setAttribute('data-filled', '1'); })
    .catch(function () { if (box.getAttribute('data-filled') !== '1') box.innerHTML = ${JSON.stringify(failHtml)}; });
})();
</script>`
}

// ─── Page ───────────────────────────────────────────────────────────────────

function renderPage (
  ctx: ILegalContext,
  lang: TLegalLang,
  slug: TLegalPageSlug,
  pricing: unknown
): IRenderedPage | null {
  const file = resolve(ctx.root, 'legal', lang, `${slug}.md`)
  if (!existsSync(file)) return null

  const ui = UI[lang]
  const problems: string[] = []
  const { data, body } = parseFrontMatter(readFileSync(file, 'utf8'))
  const values = { ...ctx.values, ...sellerFor(ctx, lang) }
  const title = substitute(data.title ?? '', values)
  const description = substitute(data.description ?? '', values)
  const version = data.version ?? ''
  const updated = data.updated ?? ''
  if (!data.title) problems.push('front matter has no `title`')
  if (!version) problems.push('front matter has no `version`')
  if (!updated) problems.push('front matter has no `updated`')
  if (version && version !== ctx.config.legalVersion) {
    problems.push(`version ${version} ≠ legalVersion ${ctx.config.legalVersion} (legal/config.json)`)
  }

  let content = renderMarkdown(substitute(body, values), lang)
  const meta = `<p class="lg-meta"><span>${ui.updated}: <b>${escapeHtml(formatDay(updated, lang))}</b></span>` +
    `<span>${ui.version}: <b>${escapeHtml(version)}</b></span></p>`
  // Якщо текст сам відкривається `# Заголовком` — не дублюємо його з front matter.
  const h1 = /^\s*<h1[^>]*>[\s\S]*?<\/h1>\n?/.exec(content)
  if (h1) content = h1[0] + meta + content.slice(h1[0].length)
  else content = `<h1>${escapeHtml(title)}</h1>\n${meta}\n${content}`

  const url = (l: TLegalLang) => `${ctx.siteUrl}${legalPageHref(slug, l)}`
  const langLink = (l: TLegalLang) => `<a href="${legalPageHref(slug, l)}" hreflang="${l}" lang="${l}"` +
    `${l === lang ? ' aria-current="true"' : ''}>${l === 'uk' ? 'UA' : 'EN'}</a>`

  const doc = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="${colors.background}">
<title>${escapeHtml(title)} — Core League</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url(lang)}">
<link rel="alternate" hreflang="uk" href="${url('uk')}">
<link rel="alternate" hreflang="en" href="${url('en')}">
<link rel="alternate" hreflang="x-default" href="${url('uk')}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Core League">
<meta property="og:locale" content="${ui.ogLocale}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url(lang)}">
<link rel="icon" type="image/png" sizes="64x64" href="/favicon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS_URL}" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="${FONTS_URL}" rel="stylesheet"></noscript>
<style>${styles()}</style>
</head>
<body>
<!--legal-draft-banner-->
<a class="lg-skip" href="#content">${lang === 'uk' ? 'До тексту' : 'Skip to content'}</a>
<header class="lg-header">
  <div class="lg-wrap">
    <a class="lg-logo" href="/" aria-label="${ui.home}"><span class="lg-logo__dot" aria-hidden="true"></span>Core League</a>
    <nav class="lg-lang" aria-label="${ui.langSwitch}">${langLink('uk')}${langLink('en')}</nav>
  </div>
</header>
<main id="content" class="lg-main">
  <article class="lg-wrap lg-doc" lang="${lang}">
${content}
<!--legal-pricing-->
  </article>
</main>
${footer(ctx, lang, slug)}
</body>
</html>
`
  // Плейсхолдери шукаємо до вставки даних API: назва турніру — вільний текст адміна.
  const placeholders = findPlaceholders(doc)
  const banner = placeholders.length && !ctx.publishPending
    ? `<p class="lg-draft" role="status">${escapeHtml(fill(ui.draft, { keys: placeholders.join(', ') }))}</p>`
    : ''
  const published = ctx.publishPending ? doc.replace(PLACEHOLDER_RE, ui.pending) : doc
  const html = published
    .replace('<!--legal-draft-banner-->', banner)
    .replace('<!--legal-pricing-->', slug === 'prices' ? pricingBlock(ctx, lang, pricing) : '')
  return { lang, slug, html, placeholders, problems }
}

async function fetchPricing (ctx: ILegalContext, warn: (msg: string) => void): Promise<unknown> {
  if (!ctx.apiBase) {
    warn('[legal] VITE_API_PUBLIC_URL is not set — /prices/ will load the table at runtime only.')
    return null
  }
  try {
    const res = await fetch(`${ctx.apiBase}/public/pricing`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8000)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { vip?: unknown }
    if (!data || typeof data !== 'object' || !data.vip) throw new Error('unexpected response shape')
    return data
  } catch (err) {
    warn(`[legal] GET /public/pricing failed at build time (${(err as Error).message}). ` +
      '/prices/ is built without the table; the page fills it from the API at runtime.')
    return null
  }
}

function createContext (config: ResolvedConfig): ILegalContext {
  const root = config.root
  const env = loadEnv(config.mode, config.envDir || root, 'VITE_')
  const legalConfig = JSON.parse(readFileSync(resolve(root, 'legal/config.json'), 'utf8')) as ILegalConfig
  // Без шапкового коментаря й eslint-директиви — у сторінку йде лише сам код.
  const pricingScript = readFileSync(resolve(root, 'scripts/legal/pricing-table.js'), 'utf8')
    .replace(/^\/\*\*[\s\S]*?\*\/\s*/, '')
    .replace(/^\/\/ eslint-disable.*\r?\n/m, '')
  // Той самий код, що піде в браузер, — виконуємо й під час білду.
  // eslint-disable-next-line no-new-func
  const renderPricing = new Function(`${pricingScript}\nreturn renderPricingTable`)() as ILegalContext['renderPricing']
  return {
    root,
    mode: config.mode,
    publishPending: config.command === 'build' && config.mode === 'production' && process.env.LEGAL_STRICT !== '1',
    config: legalConfig,
    values: { ...legalConfig.seller, ...legalConfig.policy },
    siteUrl: (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, ''),
    apiBase: (env.VITE_API_PUBLIC_URL || '').replace(/\/+$/, ''),
    pricingScript,
    renderPricing
  }
}

export const LegalPagesPlugin = (): Plugin => {
  let resolved: ResolvedConfig

  return {
    name: 'core-league-legal-pages',

    configResolved (config) {
      resolved = config
    },

    // npm run dev: сторінки рендеряться на кожен запит — правки в .md видно одразу.
    configureServer (server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split(/[?#]/)[0]
        const match = PAGE_PATH_RE.exec(path)
        if (!match) return next()
        const [, en, slug, slash] = match
        if (!slash) {
          res.statusCode = 301
          res.setHeader('Location', `${path}/`)
          return res.end()
        }
        const page = renderPage(createContext(resolved), en ? 'en' : 'uk', slug as TLegalPageSlug, null)
        if (!page) return next()
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(page.html)
      })
    },

    async closeBundle () {
      if (resolved.command !== 'build' || resolved.build.ssr) return
      const ctx = createContext(resolved)
      const production = resolved.mode === 'production'
      const strict = process.env.LEGAL_STRICT === '1'
      const warn = (msg: string) => resolved.logger.warn(msg)
      const outDir = resolve(resolved.root, resolved.build.outDir)
      const pricing = await fetchPricing(ctx, warn)

      const errors: string[] = []
      const pending: string[] = []
      const placeholderKeys = new Set<string>()
      const pages: IRenderedPage[] = []

      for (const lang of LEGAL_LANGS) {
        for (const slug of LEGAL_PAGE_SLUGS) {
          const page = renderPage(ctx, lang, slug, pricing)
          if (!page) {
            errors.push(`legal/${lang}/${slug}.md is missing`)
            continue
          }
          page.problems.forEach(p => errors.push(`legal/${lang}/${slug}.md: ${p}`))
          if (page.placeholders.length) {
            page.placeholders.forEach(k => placeholderKeys.add(k))
            pending.push(`legal/${lang}/${slug}.md (+ footer): unfilled ${page.placeholders.map(k => `{{${k}}}`).join(', ')}`)
          }
          pages.push(page)
        }
      }

      const fatal = [...(production ? errors : []), ...(strict ? pending : [])]
      if (fatal.length) {
        const keys = strict ? [...placeholderKeys] : []
        throw new Error([
          'Legal pages are not ready for this build:',
          ...fatal.map(e => `  - ${e}`),
          keys.length ? `Fill these keys in legal/config.json (or fix the Markdown): ${keys.join(', ')}` : ''
        ].filter(Boolean).join('\n'))
      }
      // Пишемо лише після перевірки: невдала збірка не лишає в dist/ чернеток.
      for (const page of pages) {
        const target = resolve(outDir, page.lang === 'en' ? 'en' : '', page.slug, 'index.html')
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, page.html)
      }
      errors.forEach(e => warn(`[legal] ${e}`))
      if (placeholderKeys.size) {
        warn(`[legal] Seller details not filled yet (${[...placeholderKeys].join(', ')}): ` +
          (ctx.publishPending ? 'published as "[буде додано]", footer rows hidden.' : 'draft banner shown.') +
          ' Fill legal/config.json and run `npm run legal:check -- --strict` before applying to WayForPay.')
      }
      resolved.logger.info(`[legal] ${pages.length} static legal pages written`)
    }
  }
}
