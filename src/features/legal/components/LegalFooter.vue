<template>
  <footer class="legal-footer" aria-label="Юридична інформація">
    <div class="legal-footer__inner">
      <div class="legal-footer__grid">
        <nav class="legal-footer__col legal-footer__col--docs" aria-labelledby="legal-footer-docs">
          <h2 id="legal-footer-docs" class="legal-footer__heading">Документи</h2>
          <ul class="legal-footer__links">
            <!-- Звичайні посилання, не router-link: це статичні сторінки поза SPA -->
            <li v-for="slug in LEGAL_PAGE_SLUGS" :key="slug">
              <a :href="legalPageHref(slug)" class="legal-footer__link">{{ LEGAL_PAGE_LABELS.uk[slug] }}</a>
            </li>
          </ul>
        </nav>

        <section v-if="sellerRows.length" class="legal-footer__col" aria-labelledby="legal-footer-seller">
          <h2 id="legal-footer-seller" class="legal-footer__heading">Продавець</h2>
          <dl class="legal-footer__list">
            <div v-for="item in sellerRows" :key="item.label">
              <dt>{{ item.label }}</dt>
              <dd>{{ item.value }}</dd>
            </div>
          </dl>
        </section>

        <section class="legal-footer__col" aria-labelledby="legal-footer-support">
          <h2 id="legal-footer-support" class="legal-footer__heading">Підтримка</h2>
          <dl class="legal-footer__list">
            <div v-for="item in supportRows" :key="item.label">
              <dt>{{ item.label }}</dt>
              <dd>
                <a v-if="item.href" :href="item.href" :target="item.external ? '_blank' : undefined" rel="noopener">
                  {{ item.value }}
                </a>
                <template v-else>{{ item.value }}</template>
              </dd>
            </div>
          </dl>
        </section>

        <section class="legal-footer__col" aria-labelledby="legal-footer-pay">
          <h2 id="legal-footer-pay" class="legal-footer__heading">Оплата</h2>
          <CardBrandMarks />
          <p class="legal-footer__note">
            Карткою Visa або Mastercard через платіжний сервіс WayForPay. Ціни — у гривнях.
          </p>
        </section>
      </div>

      <!-- Ліворуч і одним абзацом: праворуч унизу плаває кнопка чату -->
      <p class="legal-footer__fine">
        <span class="legal-footer__copy">© {{ year }} Core League</span>
        Dota 2 є торговельною маркою Valve Corporation. Core League не пов’язана з Valve і не схвалена нею.
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { LEGAL_PAGE_LABELS, LEGAL_PAGE_SLUGS, legalPageHref } from '@/config/legal-pages'
import { LEGAL_POLICY, LEGAL_SELLER, isLegalPlaceholder } from '@/config/legal'

/**
 * Юридичний блок наприкінці кожної сторінки SPA (усі розміри екрана): колонки
 * «Документи» (сім сторінок), «Продавець» (коли реквізити заповнені),
 * «Підтримка», «Оплата» (знаки карток) і рядок із © та приміткою про Valve.
 * Реквізити — з `legal/config.json`.
 */
interface ILegalRow {
  label: string
  value: string
  href?: string
  external?: boolean
}

const year = new Date().getFullYear()

/** Ще не заповнені реквізити (`{{…}}`) не показуємо — рядок з'явиться, щойно власник їх внесе. */
const filled = (rows: ILegalRow[]) => rows.filter(row => !isLegalPlaceholder(row.value))

const sellerRows: ILegalRow[] = filled([
  { label: 'ФОП', value: LEGAL_SELLER.FOP_NAME },
  { label: 'РНОКПП', value: LEGAL_SELLER.TAX_ID },
  { label: 'Юридична адреса', value: LEGAL_SELLER.LEGAL_ADDRESS },
  { label: 'Фактична адреса', value: LEGAL_SELLER.ACTUAL_ADDRESS }
])

/** Посилання лише на заповнені значення — плейсхолдер `{{…}}` лишається текстом. */
function contactHref (value: string, kind: 'tel' | 'mail' | 'chat'): string | undefined {
  if (isLegalPlaceholder(value)) return undefined
  if (kind === 'tel') return `tel:${value.replace(/[^\d+]/g, '')}`
  if (kind === 'mail') return `mailto:${value}`
  return /^https?:\/\//.test(value) ? value : undefined
}

const supportRows: ILegalRow[] = filled([
  { label: 'Телефон', value: LEGAL_SELLER.PHONE, href: contactHref(LEGAL_SELLER.PHONE, 'tel') },
  { label: 'Email', value: LEGAL_SELLER.SUPPORT_EMAIL, href: contactHref(LEGAL_SELLER.SUPPORT_EMAIL, 'mail') },
  {
    label: 'Чат підтримки',
    value: LEGAL_SELLER.SUPPORT_CHAT,
    href: contactHref(LEGAL_SELLER.SUPPORT_CHAT, 'chat'),
    external: true
  },
  { label: 'Строк розгляду звернень', value: `до ${LEGAL_POLICY.SUPPORT_REVIEW_DAYS} робочих днів` }
])
</script>

<style scoped lang="scss">
// Той самий скляний рецепт, що в Header / Footer: темна смуга, слабкі «лампи»
// по кутах і cyan → pink лінія по верхньому краю.
.legal-footer {
  position: relative;
  margin-top: 96px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ds-text-muted);
  background:
    radial-gradient(ellipse 420px 140px at 0% 0%, rgba(var(--ds-primary-rgb), 0.07), transparent 70%),
    radial-gradient(ellipse 380px 120px at 100% 0%, rgba(var(--ds-pink-rgb), 0.05), transparent 70%),
    linear-gradient(180deg, rgba(13, 15, 28, 0.72) 0%, rgba(7, 8, 15, 0.9) 100%);

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(var(--ds-primary-rgb), 0.45) 30%,
      rgba(var(--ds-pink-rgb), 0.35) 70%,
      transparent 100%
    );
  }
}

.legal-footer__inner {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 16px 32px;
}

// Мобільний — одна колонка; md — документи на всю ширину, решта парами;
// lg+ — документи вдвічі ширші, решта колонок рівні (продавець додає ще одну).
.legal-footer__grid {
  display: grid;
  gap: 32px;
}

@screen sm {
  .legal-footer__inner {
    padding-inline: 24px;
  }
}

@screen md {
  .legal-footer__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 40px;
  }

  .legal-footer__col--docs {
    grid-column: 1 / -1;
  }
}

@screen lg {
  .legal-footer__inner {
    padding: 48px 40px 32px;
  }

  .legal-footer__grid {
    grid-template-columns: minmax(0, 2fr);
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    gap: 48px;
  }

  .legal-footer__col--docs {
    grid-column: auto;
  }

  .legal-footer__links {
    grid-template-columns: repeat(2, max-content);
    column-gap: 56px;
  }
}

.legal-footer__col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.legal-footer__heading {
  margin: 0;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

// Документи — дві колонки навіть на телефоні: сім рядків в одну колонку
// розтягнули б футер на пів екрана. Читаються згори вниз, колонка за колонкою.
.legal-footer__links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(4, auto);
  grid-auto-flow: column;
  gap: 0 24px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

// 44px — ціль для пальця; під мишею рядки щільніші.
.legal-footer__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--ds-text);
  text-decoration: none;
  transition: color var(--ds-duration-fast) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
    border-radius: 4px;
  }
}

.legal-footer__list {
  display: grid;
  gap: 12px;
  margin: 0;

  dt {
    font-size: 12px;
    color: var(--ds-text-faint);
  }

  dd {
    margin: 2px 0 0;
    overflow-wrap: anywhere;
    color: var(--ds-text);
  }

  a {
    color: var(--ds-primary);
    text-underline-offset: 2px;
  }
}

.legal-footer__note {
  max-width: 34ch;
  margin: 0;
  color: var(--ds-text-muted);
}

// Праве поле — під кнопку чату, що плаває в нижньому правому куті.
.legal-footer__fine {
  margin: 0;
  padding: 20px 80px 0 0;
  border-top: 1px solid var(--ds-border-neutral);
  font-size: 12px;
  color: var(--ds-text-faint);
}

.legal-footer__copy {
  margin-right: 8px;
  font-family: var(--ds-font-mono);
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: var(--ds-text-muted);
}

@media (hover: hover) and (pointer: fine) {
  .legal-footer__link {
    min-height: 34px;
  }

  .legal-footer__link:hover,
  .legal-footer__list a:hover {
    color: var(--ds-primary);
  }
}
</style>
