<template>
  <footer class="legal-footer" aria-label="Юридична інформація">
    <div class="legal-footer__inner">
      <nav aria-label="Документи">
        <ul class="legal-footer__links">
          <!-- Звичайні посилання, не router-link: це статичні сторінки поза SPA -->
          <li v-for="slug in LEGAL_PAGE_SLUGS" :key="slug">
            <a :href="legalPageHref(slug)" class="legal-footer__link">{{ LEGAL_PAGE_LABELS.uk[slug] }}</a>
          </li>
        </ul>
      </nav>

      <div class="legal-footer__grid">
        <dl class="legal-footer__list" aria-label="Продавець">
          <div v-for="item in sellerRows" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>

        <dl class="legal-footer__list" aria-label="Підтримка">
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

        <div class="legal-footer__pay">
          <CardBrandMarks />
          <p class="m-0">Оплата карткою Visa або Mastercard через платіжний сервіс WayForPay. Ціни — у гривнях.</p>
        </div>
      </div>

      <p class="legal-footer__fine">
        Dota 2 є торговельною маркою Valve Corporation. Core League не пов’язана з Valve і не схвалена нею.
        <span class="whitespace-nowrap">© {{ year }} Core League</span>
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { LEGAL_PAGE_LABELS, LEGAL_PAGE_SLUGS, legalPageHref } from '@/config/legal-pages'
import { LEGAL_POLICY, LEGAL_SELLER, isLegalPlaceholder } from '@/config/legal'

/**
 * Юридичний блок наприкінці кожної сторінки SPA (усі розміри екрана): сім
 * документів, реквізити продавця, контакти підтримки, знаки карток і примітка
 * про торговельну марку Valve. Реквізити — з `legal/config.json`.
 */
interface ILegalRow {
  label: string
  value: string
  href?: string
  external?: boolean
}

const year = new Date().getFullYear()

const sellerRows: ILegalRow[] = [
  { label: 'ФОП', value: LEGAL_SELLER.FOP_NAME },
  { label: 'РНОКПП', value: LEGAL_SELLER.TAX_ID },
  { label: 'Юридична адреса', value: LEGAL_SELLER.LEGAL_ADDRESS },
  { label: 'Фактична адреса', value: LEGAL_SELLER.ACTUAL_ADDRESS }
]

/** Посилання лише на заповнені значення — плейсхолдер `{{…}}` лишається текстом. */
function contactHref (value: string, kind: 'tel' | 'mail' | 'chat'): string | undefined {
  if (isLegalPlaceholder(value)) return undefined
  if (kind === 'tel') return `tel:${value.replace(/[^\d+]/g, '')}`
  if (kind === 'mail') return `mailto:${value}`
  return /^https?:\/\//.test(value) ? value : undefined
}

const supportRows: ILegalRow[] = [
  { label: 'Телефон', value: LEGAL_SELLER.PHONE, href: contactHref(LEGAL_SELLER.PHONE, 'tel') },
  { label: 'Email', value: LEGAL_SELLER.SUPPORT_EMAIL, href: contactHref(LEGAL_SELLER.SUPPORT_EMAIL, 'mail') },
  {
    label: 'Чат підтримки',
    value: LEGAL_SELLER.SUPPORT_CHAT,
    href: contactHref(LEGAL_SELLER.SUPPORT_CHAT, 'chat'),
    external: true
  },
  { label: 'Строк розгляду звернень', value: `до ${LEGAL_POLICY.SUPPORT_REVIEW_DAYS} робочих днів` }
]
</script>

<style scoped>
.legal-footer {
  @apply relative mt-24 border-t text-small text-white/60;
  border-color: var(--ds-border);
  background: rgba(var(--ds-primary-rgb), 0.02);
}

.legal-footer__inner {
  @apply mx-auto flex max-w-7xl flex-col gap-20 px-16 py-24 sm:px-24 lg:px-40;
}

.legal-footer__links {
  @apply m-0 flex list-none flex-wrap gap-x-20 gap-y-2 p-0;
}

/* Висота 44px — зручна ціль для пальця, але рядок посилань лишається щільним. */
.legal-footer__link {
  @apply inline-flex min-h-44 items-center text-white/80 no-underline transition-colors duration-200;
}

.legal-footer__grid {
  @apply grid gap-20 md:grid-cols-2 xl:grid-cols-3;
}

.legal-footer__list {
  @apply m-0 grid gap-8;

  dt {
    @apply text-caption text-white/45;
  }

  dd {
    @apply m-0 break-words text-white/75;
  }

  a {
    @apply text-primary underline-offset-2;
  }
}

.legal-footer__pay {
  @apply flex flex-col items-start gap-10;
}

.legal-footer__fine {
  @apply m-0 text-caption text-white/45;
}

@media (hover: hover) and (pointer: fine) {
  .legal-footer__link:hover,
  .legal-footer__list a:hover {
    @apply text-primary;
  }
}
</style>
