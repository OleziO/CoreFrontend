#!/usr/bin/env node
/**
 * `npm run legal:check [-- --strict]` — перевірка юридичних сторінок без браузера.
 *
 * 1. Кожна сторінка є в обох мовах (`legal/<lang>/<page>.md` і згенерований
 *    `dist/…/index.html`), у front matter є `version` і `updated`.
 * 2. Версії offer/terms/refund/privacy/rules/contacts/prices = `legalVersion`
 *    з `legal/config.json` (та сама, що бек приймає в згоді на оплату).
 * 3. Внутрішні посилання згенерованих сторінок ведуть на наявні файли `dist/`.
 * 4. Заборонені слова (контракт) відсутні в юридичних текстах і платіжному UI.
 * 5. `{{…}}` плейсхолдери — лише з `--strict` (їх заповнює власник).
 *
 * Працює по `dist/`, тож спершу білд: `npm run build` (production) або для
 * локальної перевірки з плейсхолдерами `npm run build-only -- --mode staging`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const DIST = join(ROOT, 'dist')
const STRICT = process.argv.includes('--strict')

const PAGES = ['terms', 'offer', 'refund', 'privacy', 'contacts', 'rules', 'prices']
const LANGS = ['uk', 'en']

/** Контракт 2026-10-14: регістр не важливий, пошук підрядком. */
const BANNED = [
  'donate', 'donation', 'bet', 'betting', 'odds', 'stake', 'jackpot', 'casino', 'lottery', 'win money',
  'донат', 'ставка', 'коефіцієнт', 'джекпот', 'казино', 'лотерея', 'виграш', 'розіграш'
]

/**
 * Невинні слова, що містять заборонений підрядок: «between», «better», CSS
 * `justify-between`, «mistake», «доставка» / «виставка» (будь-яка літера перед
 * «ставка» — це вже інше слово). Маскуються перед пошуком.
 */
const ALLOWED = [/between/giu, /alphabet/giu, /better/giu, /mistak/giu, /(?<=\p{L})ставк/giu]

/** Платіжний UI, який чіпала ця зміна (сервіси з шляхом бекенду `/donations/intent` — не UI). */
const PAYMENT_UI_FILES = [
  'src/components/modals/VipModal.vue',
  'src/views/tournaments/components/TournamentJoinPanel.vue',
  'src/views/tournaments/components/TournamentStreamTab.vue',
  'src/views/tournaments/Tournament.vue',
  'src/features/legal/components/PaymentConsent.vue',
  'src/features/legal/components/CardBrandMarks.vue',
  'src/features/legal/components/LegalFooter.vue',
  'src/components/Footer.vue',
  'src/components/MobileMenu.vue',
  'scripts/legal/pricing-table.js',
  'vite.config.legal.ts'
]

const errors = []
const warnings = []

function parseFrontMatter (source) {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(source)
  const data = {}
  if (!match) return data
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line)
    if (pair) data[pair[1]] = pair[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return data
}

function pageHref (lang, page) {
  return lang === 'en' ? `/en/${page}/` : `/${page}/`
}

function distFileFor (urlPath) {
  const clean = decodeURI(urlPath.split(/[?#]/)[0])
  if (clean.endsWith('/')) return join(DIST, clean, 'index.html')
  return join(DIST, clean)
}

function scanBanned (label, text) {
  let masked = text
  for (const re of ALLOWED) masked = masked.replace(re, m => ' '.repeat(m.length))
  const lower = masked.toLowerCase()
  for (const word of BANNED) {
    let from = 0
    let at
    while ((at = lower.indexOf(word, from)) !== -1) {
      const line = text.slice(0, at).split('\n').length
      const lineText = text.split('\n')[line - 1].trim().slice(0, 100)
      errors.push(`banned word "${word}" in ${label}:${line} — ${lineText}`)
      from = at + word.length
    }
  }
}

// ─── 1–2. Тексти: наявність, front matter, версії ───────────────────────────
const config = JSON.parse(readFileSync(join(ROOT, 'legal/config.json'), 'utf8'))
const legalVersion = config.legalVersion

for (const lang of LANGS) {
  for (const page of PAGES) {
    const rel = `legal/${lang}/${page}.md`
    const file = join(ROOT, rel)
    if (!existsSync(file)) {
      errors.push(`${rel} is missing`)
      continue
    }
    const source = readFileSync(file, 'utf8')
    const fm = parseFrontMatter(source)
    if (!fm.title) errors.push(`${rel}: front matter has no title`)
    if (!fm.version) errors.push(`${rel}: front matter has no version`)
    if (!fm.updated) errors.push(`${rel}: front matter has no updated`)
    if (fm.version && fm.version !== legalVersion) {
      errors.push(`${rel}: version ${fm.version} ≠ legalVersion ${legalVersion}`)
    }
    scanBanned(rel, source)
    if (STRICT && /\{\{[^}]*\}\}/.test(source)) {
      const keys = [...new Set(source.match(/\{\{[^}]*\}\}/g))]
      const unknown = keys.filter(k => !(k.slice(2, -2).trim() in { ...config.seller, ...config.policy }))
      if (unknown.length) errors.push(`${rel}: placeholders with no key in legal/config.json: ${unknown.join(', ')}`)
    }
  }
}

// ─── 3. Згенеровані сторінки й посилання ────────────────────────────────────
if (!existsSync(DIST)) {
  errors.push('dist/ not found — build first (npm run build, or npm run build-only -- --mode staging)')
} else {
  for (const lang of LANGS) {
    for (const page of PAGES) {
      const href = pageHref(lang, page)
      const file = distFileFor(href)
      if (!existsSync(file)) {
        errors.push(`generated page ${href} is missing (${file})`)
        continue
      }
      const html = readFileSync(file, 'utf8')
      if (!html.includes(`<html lang="${lang}">`)) errors.push(`${href}: <html lang="${lang}"> missing`)
      if (!/<p class="lg-meta">[\s\S]*?\d{4}[\s\S]*?<\/p>/.test(html)) errors.push(`${href}: no updated/version line`)
      for (const [, link] of html.matchAll(/href="(\/[^"]*)"/g)) {
        if (link.startsWith('//')) continue
        if (!existsSync(distFileFor(link))) errors.push(`${href}: link ${link} does not resolve in dist/`)
      }
      const left = [...new Set(html.match(/\{\{[^{}]*\}\}/g) ?? [])]
      if (left.length) {
        if (STRICT) errors.push(`${href}: unfilled placeholders ${left.join(', ')}`)
        else warnings.push(...left)
      }
    }
  }
}

// ─── 4. Заборонені слова: конфіг і платіжний UI ─────────────────────────────
scanBanned('legal/config.json', readFileSync(join(ROOT, 'legal/config.json'), 'utf8'))
for (const rel of PAYMENT_UI_FILES) {
  const file = join(ROOT, rel)
  if (!existsSync(file)) {
    errors.push(`${rel} not found (update PAYMENT_UI_FILES in scripts/legal/check.mjs)`)
    continue
  }
  scanBanned(rel, readFileSync(file, 'utf8'))
}

// ─── Звіт ───────────────────────────────────────────────────────────────────
if (warnings.length) {
  console.warn(`legal:check — placeholders not filled yet: ${[...new Set(warnings)].join(', ')} ` +
    '(ignored without --strict; the production build refuses them).')
}
if (errors.length) {
  console.error(`legal:check FAILED — ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
console.log(`legal:check OK — ${PAGES.length * LANGS.length} pages, version ${legalVersion}, ` +
  `${PAYMENT_UI_FILES.length} payment UI files scanned${STRICT ? ', strict' : ''}.`)
