<template>
  <el-dialog
    v-model="modelValue"
    :show-close="false"
    :width="980"
    align-center
    append-to-body
    class="vip-dialog"
    aria-label="VIP-статус Core League"
  >
    <div class="vip" :class="{ 'is-member': isVip }">
      <span class="vip__glow" aria-hidden="true" />

      <button type="button" class="vip__close" aria-label="Закрити" @click="modelValue = false">
        <PhX :size="18" weight="bold" />
      </button>

      <div class="vip__grid">
        <!-- ─── STAGE: живий перегляд картки на верхівці реєстру ───────── -->
        <section class="vip-stage" :style="previewStyle" aria-label="Попередній перегляд картки">
          <span class="vip-stage__glow" aria-hidden="true" />

          <span class="vip__label vip-reveal" :style="revealDelay(120)">
            {{ isVip ? 'Твоя картка в реєстрі' : 'Так тебе побачать у реєстрі' }}
          </span>

          <!-- Міні-реєстр: твоя картка #1, решта — приглушені рядки під нею -->
          <div class="vip-stage__viewport">
            <ol class="vip-stage__list">
              <li class="vip-preview neon-card hud-corners role-frame--vip">
                <span class="vip-preview__aura" aria-hidden="true" />
                <span class="vip-preview__sheen" aria-hidden="true" />
                <span class="vip-preview__bar" aria-hidden="true" />
                <span class="vip-stage__pos is-top">
                  <PhCrown :size="12" weight="fill" />
                  1
                </span>
                <el-avatar :size="48" :src="authStore.user?.avatarUrl ?? ''" class="vip-preview__avatar">
                  <template #default>
                    <PhUser :size="22" weight="bold" class="text-white/70" />
                  </template>
                </el-avatar>
                <span class="relative z-10 flex min-w-0 flex-1 flex-col gap-6">
                  <span class="vip-preview__name">{{ previewName }}</span>
                  <span class="flex min-w-0 items-center gap-8">
                    <VipBadge size="xs" class="shrink-0" />
                    <span class="vip-preview__handle">@{{ previewHandle }}</span>
                  </span>
                </span>
                <span v-if="previewRating" class="vip-preview__mmr">
                  <b>{{ previewRating }}</b>
                  <span>MMR</span>
                </span>
              </li>
              <li v-for="n in 8" :key="n" class="vip-ghost" aria-hidden="true">
                <span class="vip-stage__pos">#{{ n + 1 }}</span>
                <span class="vip-ghost__avatar" />
                <span class="flex flex-1 flex-col gap-6">
                  <span class="vip-ghost__bar" :style="{ width: `${[64, 48, 58, 42, 54, 46, 60, 40][n - 1]}%` }" />
                  <span class="vip-ghost__bar is-short" />
                </span>
              </li>
            </ol>
          </div>

          <div class="vip-stage__colors">
            <span class="vip__label">Колір рамки</span>
            <div class="vip-swatches" role="radiogroup" aria-label="Колір рамки">
              <button
                v-for="color in VIP_FRAME_PALETTE"
                :key="color.hex"
                type="button"
                role="radio"
                class="vip-swatch"
                :class="{ 'is-active': previewColor === color.hex }"
                :style="{ '--swatch': color.hex }"
                :aria-checked="previewColor === color.hex"
                :aria-label="color.label"
                :title="color.label"
                :disabled="vipStore.mutating"
                @click="pickColor(color.hex)"
              />
              <button
                v-if="isVip"
                type="button"
                role="radio"
                class="vip-swatch vip-swatch--reset"
                :class="{ 'is-active': !previewColor }"
                :aria-checked="!previewColor"
                aria-label="Стандартна рамка"
                title="Стандартна рамка"
                :disabled="vipStore.mutating"
                @click="pickColor(null)"
              >
                <PhProhibit :size="14" weight="bold" />
              </button>
            </div>
            <p class="vip__hint">
              <template v-if="isVip">Колір зберігається одразу. </template>
              Кольори ролей зарезервовані — твій стиль лише твій.
            </p>
          </div>
        </section>

        <!-- ─── RIGHT COLUMN ──────────────────────────────────────────── -->
        <section class="vip__main">
          <!-- ─── HERO ─────────────────────────────────────────────────────── -->
          <header class="vip__hero">
            <span class="vip__eyebrow vip-reveal" :style="revealDelay(80)">
              <PhCrown :size="14" weight="fill" />
              Core League VIP
            </span>

            <!-- Заголовок проявляється по словах; акцентні слова несуть градієнт самі,
                 бо background-clip на батьківському span ламається під transform дітей -->
            <h2 class="vip__title" :aria-label="titleWords.map(w => w.text).join(' ')">
              <template v-for="(word, i) in titleWords" :key="`${isVip}-${i}`">
                <span
                  class="vip-word"
                  :class="{ 'vip__title-accent': word.accent }"
                  :style="revealDelay(160 + i * 70)"
                  aria-hidden="true"
                >{{ word.text }}</span>{{ ' ' }}
              </template>
            </h2>
            <p class="vip__lead vip-reveal" :style="revealDelay(180 + titleWords.length * 70)">
              <template v-if="isVip">
                Дякуємо, що підтримуєш лігу. Налаштуй рамку — її побачать усі у реєстрі гравців.
              </template>
              <template v-else>
                Статус для тих, хто живе Dota 2 — і хоче, щоб це було видно.
              </template>
            </p>
          </header>

          <!-- Переваги: для VIP (для решти ті самі пункти — у таблиці порівняння) -->
          <ul v-if="isVip" class="vip-perks">
            <li
              v-for="(perk, i) in perks"
              :key="perk.title"
              class="vip-perk vip-reveal"
              :style="revealDelay(contentStart + i * 50)"
            >
              <span class="vip-perk__icon">
                <component :is="perk.icon" :size="20" weight="duotone" />
              </span>
              <span class="flex min-w-0 flex-col gap-2">
                <span class="vip-perk__title">{{ perk.title }}</span>
                <span class="vip-perk__text">{{ perk.text }}</span>
              </span>
            </li>
          </ul>

          <!-- Порівняння: лише для тих, хто ще не VIP -->
          <table v-if="!isVip" class="vip-compare">
            <thead>
              <tr class="vip-reveal" :style="revealDelay(contentStart)">
                <th scope="col">Що дає VIP</th>
                <th scope="col">Звичайний</th>
                <th scope="col" class="is-vip">VIP</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in compareRows"
                :key="row.label"
                class="vip-reveal"
                :style="revealDelay(contentStart + 40 + i * 45)"
              >
                <th scope="row">
                  <span class="vip-compare__label">
                    <component :is="row.icon" :size="16" weight="duotone" class="vip-compare__icon" />
                    {{ row.label }}
                  </span>
                </th>
                <td data-label="Звичайний">
                  <span v-if="row.links" class="vip-compare__locked">
                    <PhLockSimple :size="12" weight="bold" /> Закрито
                  </span>
                  <template v-else>{{ row.base }}</template>
                </td>
                <td class="is-vip" data-label="VIP">
                  <span v-if="row.links" class="vip-compare__brands" aria-label="Steam, Dotabuff, Discord">
                    <Icon :size="16" name="steam" />
                    <Icon :size="16" name="dotabuff" />
                    <Icon :size="16" name="discord" />
                  </span>
                  <span v-else class="vip-compare__value">{{ row.vip }}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Керування підпискою: для VIP -->
          <div v-else class="vip-member vip-reveal" :style="revealDelay(contentStart + perks.length * 50)">
            <div class="vip-member__row">
              <PhCalendarCheck :size="18" weight="duotone" class="shrink-0 text-[rgb(255,206,84)]" />
              <span v-if="isLifetime">VIP <b>безстроковий</b> — назавжди з тобою</span>
              <span v-else>VIP діє до <b>{{ formatDate(status?.vipUntil ?? authStore.user?.vipUntil) }}</b></span>
            </div>
            <div class="vip-member__row">
              <PhArrowsClockwise :size="18" weight="duotone" class="shrink-0 text-[rgb(255,206,84)]" />
              <span v-if="status?.autoRenew">
                Автопродовження: {{ formatDate(status.nextChargeAt) }}
                <template v-if="status.maskedPan"> · картка {{ maskPan(status.maskedPan) }}</template>
              </span>
              <span v-else>Автопродовження вимкнено</span>
            </div>
          </div>

          <!-- ─── OFFER / CTA ───────────────────────────────────────── -->
          <!-- Безстроковий VIP: платити нічого, блок оплати не потрібен -->
          <div
            v-if="!isLifetime"
            class="vip-offer vip-reveal"
            :class="{ 'is-card': !isVip }"
            :style="revealDelay(offerStart)"
          >
            <div class="vip-offer__main">
              <div v-if="!isVip || !status?.autoRenew" class="vip-offer__price">
                <div class="vip-offer__amount">
                  <span class="vip-offer__value">{{ price }}</span>
                  <span class="vip-offer__currency">₴</span>
                  <span class="vip-offer__period">/ місяць</span>
                </div>
                <div class="vip-offer__daily">
                  <!-- Чашка, налита наполовину -->
                  <svg
                    class="vip-offer__cup"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 14h12v1a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-1z" fill="currentColor" stroke="none" />
                    <path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z" />
                    <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
                    <path d="M8 3.5v2M12 3.5v2" opacity="0.5" />
                  </svg>
                  <span>
                    ≈ <b>{{ pricePerDay }} ₴</b> на день
                    <small>дешевше за чашку кави</small>
                  </span>
                </div>
              </div>

              <div class="vip-offer__actions">
                <template v-if="!isVip">
                  <el-button
                    type="primary"
                    size="large"
                    class="vip-cta"
                    :loading="vipStore.checkoutLoading"
                    @click="onBuy"
                  >
                    <PhCrown v-if="!vipStore.checkoutLoading" :size="18" weight="fill" class="mr-8" />
                    {{ authStore.token ? `Стати VIP за ${price} ₴` : 'Увійти й стати VIP' }}
                  </el-button>
                </template>

                <template v-else>
                  <el-button
                    v-if="status?.autoRenew"
                    plain
                    size="large"
                    :loading="vipStore.mutating"
                    @click="confirmCancel"
                  >
                    Скасувати автопродовження
                  </el-button>
                  <el-button
                    v-else-if="status?.hasSavedCard"
                    type="primary"
                    size="large"
                    class="vip-cta"
                    :loading="vipStore.mutating"
                    @click="vipStore.resumeAutoRenew()"
                  >
                    <PhArrowsClockwise :size="18" weight="bold" class="mr-8" />
                    Увімкнути автопродовження
                  </el-button>
                  <el-button
                    v-else
                    type="primary"
                    size="large"
                    class="vip-cta"
                    :loading="vipStore.checkoutLoading"
                    @click="onBuy"
                  >
                    <PhCrown v-if="!vipStore.checkoutLoading" :size="18" weight="fill" class="mr-8" />
                    Продовжити VIP за {{ price }} ₴
                  </el-button>
                </template>
              </div>
            </div>

            <ul v-if="!isVip" class="vip-trust">
              <li class="vip-reveal" :style="revealDelay(offerStart + 120)">
                <PhShieldCheck :size="14" weight="fill" /> Безпечна оплата через monobank
              </li>
              <li class="vip-reveal" :style="revealDelay(offerStart + 170)">
                <PhArrowCounterClockwise :size="14" weight="bold" /> Скасування в 1 клік
              </li>
              <li class="vip-reveal" :style="revealDelay(offerStart + 220)">
                <PhHeart :size="14" weight="fill" /> Кошти йдуть на розвиток ліги
              </li>
            </ul>
          </div>
          <p class="vip__fine vip-reveal" :style="revealDelay(offerStart + 280)">
            Підписка продовжується автоматично щомісяця зі збереженої картки.
            Скасувати можна будь-коли — VIP діятиме до кінця оплаченого періоду.
          </p>
        </section>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  PhArrowCounterClockwise,
  PhArrowsClockwise,
  PhCalendarCheck,
  PhCrown,
  PhHeart,
  PhArrowFatLinesUp,
  PhInfinity,
  PhPalette,
  PhProhibit,
  PhSealCheck,
  PhIdentificationCard,
  PhTicket,
  PhLockSimple,
  PhShieldCheck,
  PhUser,
  PhX
} from '@phosphor-icons/vue'
import { ElMessageBox } from 'element-plus'
import {
  VIP_FRAME_PALETTE,
  VIP_PRICE_UAH,
  VIP_TOURNAMENT_DISCOUNT_PERCENT,
  isVipLifetime
} from '@/core/vip.constants'
import { useVipStore } from '@/store/modules/vip'
import VipBadge from '@/components/VipBadge.vue'

const modelValue = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const vipStore = useVipStore()
const { open, close } = useAppModals()
const route = useRoute()

const status = computed(() => vipStore.status)
const isVip = computed(() => vipStore.isVip)
const isLifetime = computed(() => isVipLifetime(status.value?.vipUntil ?? authStore.user?.vipUntil))

const price = computed(() => Math.round((status.value?.priceKopecks ?? VIP_PRICE_UAH * 100) / 100))
const pricePerDay = computed(() => Math.round(price.value / 30))

/** Колір попереднього перегляду: у VIP — збережений, у решти — вибраний для приміряння. */
const trialColor = ref<string>(VIP_FRAME_PALETTE[0].hex)
const previewColor = computed<string | null>(() =>
  isVip.value ? (authStore.user?.vipFrameColor ?? status.value?.vipFrameColor ?? null) : trialColor.value
)

/** Без кольору — стандартна ціан-рамка сайту (`--ds-primary-rgb`). */
const previewStyle = computed(() => {
  const hex = previewColor.value
  if (!hex) return { '--vip-frame-rgb': 'var(--ds-primary-rgb)' }
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')
  return { '--vip-frame-rgb': rgb }
})

const previewName = computed(() => authStore.user?.discordName || 'Твій нік')
const previewHandle = computed(() => authStore.user?.discordUsername || 'nickname')
/** MMR праворуч урівноважує рядок; без рейтингу (гість, 0) — не показуємо. */
const previewRating = computed(() => authStore.user?.rating || null)

// Кількість кольорів рамки — з палітри, з українським відмінюванням (1 колір / 3 кольори / 8 кольорів).
const frameColorCount = VIP_FRAME_PALETTE.length
const COLOR_FORMS: Record<string, { noun: string; exclusive: string }> = {
  one: { noun: 'колір', exclusive: 'ексклюзивний колір' },
  few: { noun: 'кольори', exclusive: 'ексклюзивні кольори' },
  many: { noun: 'кольорів', exclusive: 'ексклюзивних кольорів' }
}
const colorForms = COLOR_FORMS[new Intl.PluralRules('uk-UA').select(frameColorCount)] ?? COLOR_FORMS.many

const perks = [
  {
    icon: PhInfinity,
    title: 'Безліміт дружніх дуелей',
    text: 'Грай з друзями скільки завгодно — і вони з тобою теж.'
  },
  {
    icon: PhIdentificationCard,
    title: 'Steam, Dotabuff, Discord',
    text: 'Відкриті профілі гравців — перевір статистику й напиши тімейту.'
  },
  {
    icon: PhTicket,
    title: `−${VIP_TOURNAMENT_DISCOUNT_PERCENT}% на всі турніри`,
    text: 'Знижка на вступний внесок, коли оплачуєш як капітан.'
  },
  {
    icon: PhPalette,
    title: 'Власний колір рамки',
    text: `${frameColorCount} ${colorForms.exclusive} профілю й картки.`
  },
  {
    icon: PhSealCheck,
    title: 'VIP-бейдж і топ реєстру',
    text: 'Бейдж на картці й місце на верхівці реєстру гравців.'
  }
] as const

/** Ряди порівняння: найцінніше — згори. `links` — ряд із фірмовими іконками профілів. */
const compareRows: ReadonlyArray<{
  label: string
  icon: Component
  base: string
  vip: string
  links?: boolean
}> = [
  { label: 'Дружні дуелі', icon: PhInfinity, base: '3 на день', vip: 'Безліміт' },
  { label: 'Профілі гравців', icon: PhIdentificationCard, base: '', vip: '', links: true },
  { label: 'Внесок за турнір', icon: PhTicket, base: 'Повний', vip: `−${VIP_TOURNAMENT_DISCOUNT_PERCENT}%` },
  { label: 'Рамка й бейдж', icon: PhPalette, base: 'Стандартні', vip: `${frameColorCount} ${colorForms.noun} + VIP` },
  { label: 'Місце в реєстрі', icon: PhArrowFatLinesUp, base: 'Випадково', vip: 'Топ списку' }
]

// ─── Поява тексту при відкритті ─────────────────────────────────────────────
// Чистий CSS: el-dialog ховає оверлей через v-show (display: none), тож
// анімації перезапускаються на кожне відкриття. Тут — лише таймлайн затримок:
// заголовок по словах → лід → переваги/таблиця → оферта → дрібний шрифт.
const titleWords = computed<Array<{ text: string; accent?: boolean }>>(() => isVip.value
  ? [{ text: 'Ти' }, { text: '—' }, { text: 'VIP', accent: true }]
  : [{ text: 'Грай' }, { text: 'без' }, { text: 'меж.' }, { text: 'Виділяйся.', accent: true }]
)
const contentStart = computed(() => 260 + titleWords.value.length * 70)
const offerStart = computed(() => contentStart.value + 40 + compareRows.length * 45 + 60)

function revealDelay (ms: number) {
  return { '--reveal-delay': `${ms}ms` }
}

const dateFormat = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
function formatDate (value: string | null | undefined) {
  return value ? dateFormat.format(new Date(value)) : '—'
}

/** `537541******1234` → `•••• 1234`. */
function maskPan (pan: string) {
  return `•••• ${pan.slice(-4)}`
}

function pickColor (hex: string | null) {
  if (!isVip.value) {
    if (hex) trialColor.value = hex
    return
  }
  if (hex === previewColor.value) return
  vipStore.setFrameColor(hex)
}

function onBuy () {
  if (!authStore.token) {
    modelValue.value = false
    close('VipModal')
    open('LoginModal', { redirectTo: route.fullPath })
    return
  }
  vipStore.checkout()
}

async function confirmCancel () {
  try {
    await ElMessageBox.confirm(
      `VIP діятиме до ${formatDate(status.value?.vipUntil)}, після цього переваги вимкнуться. ` +
        'Увімкнути автопродовження знову можна тут же.',
      'Скасувати автопродовження?',
      { confirmButtonText: 'Так, скасувати', cancelButtonText: 'Залишити VIP', type: 'warning' }
    )
  } catch {
    return
  }
  vipStore.cancelAutoRenew()
}

watch(modelValue, (isOpen) => {
  if (isOpen) vipStore.fetchStatus()
}, { immediate: true })
</script>

<!-- Not scoped for the dialog shell: el-dialog is teleported to <body>. The
     unique `.vip-dialog` class keeps these rules confined to this modal. -->
<style>
.vip-dialog.el-dialog {
  max-width: 94vw;
  max-height: 94vh;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 20px;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none !important;
}

.vip-dialog.el-dialog::before,
.vip-dialog.el-dialog::after {
  display: none;
}

.vip-dialog .el-dialog__header {
  display: none;
}

.vip-dialog .el-dialog__body {
  padding: 0 !important;
  overflow: auto;
}
</style>

<style scoped lang="scss">
// Premium surface of the HUD design system: deep glass, a warm gold → pink
// lamp behind the hero (the VIP foil colours), the player's own card as the
// hero visual, then perks → proof → price → one loud CTA.
.vip {
  --vip-gold: 255, 206, 84;
  --vip-rose: 255, 94, 170;

  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(var(--vip-gold), 0.28);
  background:
    radial-gradient(ellipse 520px 260px at 12% -10%, rgba(var(--vip-gold), 0.16), transparent 70%),
    radial-gradient(ellipse 480px 260px at 100% 0%, rgba(var(--vip-rose), 0.12), transparent 70%),
    linear-gradient(180deg, rgba(16, 17, 30, 0.98) 0%, rgba(8, 9, 16, 0.99) 100%);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(var(--vip-gold), 0.12);
  padding: 40px 48px 36px;
  color: #fff;

  @media (max-width: 640px) {
    padding: 28px 20px 24px;
  }
}

.vip__glow {
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--vip-gold), 0.9), rgba(var(--vip-rose), 0.9), transparent);
  z-index: 1;
}

.vip__close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 5;
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: color var(--ds-duration-fast) ease, border-color var(--ds-duration-fast) ease;

  &:hover {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--vip-gold), 0.7);
    outline-offset: 2px;
  }
}

// ─── Hero ───────────────────────────────────────────────────────────────
.vip__hero {
  position: relative;
  z-index: 2;
  display: flex;
  max-width: 620px;
  flex-direction: column;
  gap: 14px;
  padding-right: 48px;
}

.vip__eyebrow {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid rgba(var(--vip-gold), 0.4);
  background: rgba(var(--vip-gold), 0.08);
  padding: 5px 12px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(255, 222, 140);
}

.vip__title {
  margin: 0;
  font-family: var(--ds-font-display);
  font-size: clamp(24px, 3.6vw, 36px);
  line-height: 1.05;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.vip__title-accent {
  background: linear-gradient(100deg, rgb(255, 214, 102), rgb(255, 120, 180));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 14px rgba(var(--vip-gold), 0.35));
}

// ─── Text reveal on open ────────────────────────────────────────────────────
// Rise + fade + de-blur, strong ease-out so each line "lands". `both` keeps
// items hidden through their delay. Title words travel further and blur more —
// they are the headline beat; everything else is a quieter cascade.
// `from`-only keyframes: each element animates back to its own styles, so the
// accent word keeps its gold drop-shadow instead of being forced to `filter: none`.
.vip-reveal {
  animation: vip-reveal 520ms var(--ds-ease-out) var(--reveal-delay, 0ms) both;
}

.vip-word {
  display: inline-block;
  animation: vip-word 620ms var(--ds-ease-out) var(--reveal-delay, 0ms) both;
}

@keyframes vip-reveal {
  from {
    opacity: 0;
    transform: translateY(10px);
    filter: blur(4px);
  }
}

@keyframes vip-word {
  from {
    opacity: 0;
    transform: translateY(0.45em) scale(0.96);
    filter: blur(8px);
  }
}

.vip__lead {
  margin: 0;
  max-width: 560px;
  font-size: 15px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.68);
}

.vip__grid {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  align-items: stretch;
  gap: 48px;

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
  }
}

// Right column: headline on top, then proof (table), then the offer.
.vip__main {
  display: flex;
  min-width: 0;
  flex-direction: column;

  .vip__hero {
    margin-bottom: 28px;
  }
}

.vip__label {
  display: block;
  margin-bottom: 14px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.vip__hint,
.vip__fine {
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.42);
}

// ─── Live preview ───────────────────────────────────────────────────────
// Stage: the left column's single surface, tinted by the picked frame colour,
// so the column reads as one showcase instead of loose parts.
.vip-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(var(--vip-frame-rgb), 0.18);
  background:
    radial-gradient(ellipse 320px 220px at 30% 0%, rgba(var(--vip-frame-rgb), 0.14), transparent 70%),
    rgba(255, 255, 255, 0.02);
  padding: 24px;
  transition: border-color 260ms ease, background 260ms ease;
}

.vip-stage__glow {
  position: absolute;
  inset: 0 24px auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--vip-frame-rgb), 0.8), transparent);
}

// The registry fills whatever height the right column gives the stage and
// fades out; absolute so the rows never make the modal taller.
.vip-stage__viewport {
  position: relative;
  flex: 1 1 auto;
  min-height: 230px;
}

.vip-stage__list {
  position: absolute;
  inset: 0;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, #000 45%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 45%, transparent 100%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.vip-stage__pos {
  position: relative;
  z-index: 1;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  width: 20px;
  flex-shrink: 0;
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);

  &.is-top {
    color: rgb(var(--vip-frame-rgb));
    text-shadow: 0 0 10px rgba(var(--vip-frame-rgb), 0.6);
  }
}

.vip-ghost {
  flex-shrink: 0;
  opacity: 0.55;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  padding: 12px 16px;
}

.vip-ghost__avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.vip-ghost__bar {
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);

  &.is-short {
    width: 34%;
    height: 6px;
    background: rgba(255, 255, 255, 0.06);
  }
}

.vip-stage__colors {
  padding-top: 20px;
}

.vip-preview {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  border-radius: 14px;
  padding: 16px 18px 16px 13px;
  transition: border-color 260ms ease, box-shadow 260ms ease;
}

// Тонка вертикальна смуга кольору рамки зліва — «лідер реєстру».
// Окремий елемент: `::before`/`::after` уже зайняті кутами `.hud-corners`.
.vip-preview__bar {
  position: absolute;
  inset: 14px auto 14px 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: rgb(var(--vip-frame-rgb));
  box-shadow: 0 0 12px rgba(var(--vip-frame-rgb), 0.8);
  transition: background 260ms ease, box-shadow 260ms ease;
}

// Відблиск, що зрідка пробігає карткою: VIP-рядок живий на тлі приглушених.
.vip-preview__sheen {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    105deg,
    transparent 35%,
    rgba(var(--vip-frame-rgb), 0.14) 48%,
    rgba(255, 255, 255, 0.08) 50%,
    transparent 62%
  );
  transform: translateX(-100%);
  animation: vip-preview-sheen 5.5s var(--ds-ease-out) 1.2s infinite;
}

@keyframes vip-preview-sheen {
  0% {
    transform: translateX(-100%);
  }

  30%,
  100% {
    transform: translateX(100%);
  }
}

.vip-preview__handle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

.vip-preview__mmr {
  position: relative;
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  padding-left: 14px;
  line-height: 1;

  b {
    font-family: var(--ds-font-mono);
    font-size: 16px;
    font-weight: 700;
    color: #fff;
  }

  span {
    font-family: var(--ds-font-mono);
    font-size: 9px;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.4);
  }
}

.vip-preview__aura {
  position: absolute;
  inset: -40px auto auto -40px;
  width: 200px;
  height: 160px;
  pointer-events: none;
  background: radial-gradient(closest-side, rgba(var(--vip-frame-rgb), 0.28), transparent 100%);
  transition: background 260ms ease;
}

.vip-preview__avatar {
  border: 1px solid rgba(var(--vip-frame-rgb), 0.6);
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 14px rgba(var(--vip-frame-rgb), 0.45);
}

.vip-preview__name {
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--ds-font-display);
  font-size: 15px;
  line-height: 1.15;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.vip-swatches {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

// Кружки тягнуться на всю ширину блоку: у вузькій колонці стискаються, а не переносяться.
.vip-swatch {
  position: relative;
  flex: 0 1 30px;
  min-width: 22px;
  aspect-ratio: 1;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.14);
  background: var(--swatch);
  box-shadow: 0 0 10px color-mix(in srgb, var(--swatch) 40%, transparent);
  cursor: pointer;
  transition: transform 160ms var(--ds-ease-out), border-color 160ms ease;

  &:hover:not(:disabled) {
    transform: scale(1.08);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &.is-active {
    border-color: #fff;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.6), 0 0 16px var(--swatch);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--vip-gold), 0.8);
    outline-offset: 3px;
  }

  &:disabled {
    cursor: progress;
    opacity: 0.6;
  }

  &--reset {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.55);
    box-shadow: none;
  }
}

// ─── Perks ──────────────────────────────────────────────────────────────
.vip-perks {
  display: grid;
  gap: 22px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.vip-perk {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vip-perk__icon {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid rgba(var(--vip-gold), 0.35);
  background: linear-gradient(135deg, rgba(var(--vip-gold), 0.16), rgba(var(--vip-rose), 0.12));
  color: rgb(255, 214, 102);
}

.vip-perk__title {
  font-size: 15px;
  font-weight: 700;
}

.vip-perk__text {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
}

// ─── Compare ────────────────────────────────────────────────────────────
.vip-compare {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;

  th,
  td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  thead th {
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.42);
  }

  tbody th {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.72);
  }

  td {
    color: rgba(255, 255, 255, 0.45);
  }

  .is-vip {
    background: rgba(var(--vip-gold), 0.06);
    color: rgb(255, 222, 140);
    font-weight: 700;
  }

  thead .is-vip {
    border-radius: 10px 10px 0 0;
    color: rgb(255, 214, 102);
  }

  tbody tr:last-child .is-vip {
    border-radius: 0 0 10px 10px;
  }
}

.vip-compare__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.vip-compare__icon {
  flex-shrink: 0;
  color: rgb(255, 214, 102);
  opacity: 0.85;
}

// Phones: the same three-column table as desktop (benefit | regular | VIP), so
// every value sits right under its header — just tighter: smaller type, narrow
// padding, a framed table with a header bar and the continuous VIP column.
@media (max-width: 640px) {
  .vip-compare {
    table-layout: fixed;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    font-size: 12px;

    th,
    td {
      padding: 10px 8px;
      vertical-align: middle;
      overflow-wrap: anywhere;
    }

    th:first-child {
      width: 36%;
      padding-left: 12px;
    }

    thead th {
      background: rgba(255, 255, 255, 0.04);
      font-size: 9px;
      letter-spacing: 0.1em;
    }

    thead .is-vip {
      border-radius: 0;
      background: rgba(var(--vip-gold), 0.14);
    }

    tbody th {
      font-size: 12px;
      line-height: 1.3;
    }

    tbody tr:last-child th,
    tbody tr:last-child td {
      border-bottom: 0;
    }

    tbody tr:last-child .is-vip {
      border-radius: 0;
    }

    .vip-compare__icon {
      display: none;
    }

    .vip-compare__brands {
      gap: 6px;
    }
  }
}

.vip-compare__brands {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  filter: drop-shadow(0 0 6px rgba(255, 206, 84, 0.35));
}

.vip-compare__locked {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

// VIP members get five perks: two columns so the list stays one screen tall.
.vip.is-member .vip-perks {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 24px;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

// Members already bought it: titles are enough, the pitch text is noise.
.vip.is-member .vip-perk {
  align-items: center;
  gap: 12px;
}

.vip.is-member .vip-perk__text {
  display: none;
}

.vip.is-member .vip-perk__icon {
  width: 34px;
  height: 34px;
}

// ─── Member ─────────────────────────────────────────────────────────────
.vip-member {
  display: grid;
  gap: 12px;
  margin-top: 28px;
  border-radius: 14px;
  border: 1px solid rgba(var(--vip-gold), 0.22);
  background: rgba(var(--vip-gold), 0.05);
  padding: 16px 18px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.vip-member__row {
  display: flex;
  align-items: center;
  gap: 10px;
}

// ─── Offer ──────────────────────────────────────────────────────────────
.vip-offer {
  margin-top: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding-top: 24px;
}

.vip-offer.is-card {
  border: 1px solid rgba(var(--vip-gold), 0.35);
  border-radius: 18px;
  background:
    radial-gradient(ellipse 360px 160px at 100% 0%, rgba(var(--vip-rose), 0.1), transparent 70%),
    linear-gradient(135deg, rgba(var(--vip-gold), 0.08), rgba(var(--vip-rose), 0.04));
  box-shadow: 0 0 30px rgba(var(--vip-gold), 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  padding: 22px 24px;
}

.vip-offer__main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 28px;
}

// Цінник — смуга на всю ширину з двох рівних половин, розділених рискою:
// місячна ціна і ціна за день, кожна по центру своєї половини.
.vip-offer__price {
  display: grid;
  flex: 1 1 100%;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  padding: 14px 0;

  > * {
    justify-content: center;
    padding: 0 16px;
  }

  > * + * {
    border-left: 1px solid rgba(255, 255, 255, 0.08);
  }
}

.vip-offer__amount {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1;
}

.vip-offer__value {
  font-family: var(--ds-font-display);
  font-size: 34px;
  letter-spacing: -0.02em;
  color: #fff;
}

.vip-offer__currency {
  font-family: var(--ds-font-display);
  font-size: 22px;
  color: rgb(var(--vip-gold));
}

.vip-offer__period {
  margin-left: 2px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
}

.vip-offer__daily {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.7);

  b {
    font-weight: 700;
    color: #fff;
  }

  small {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }
}

.vip-offer__cup {
  flex-shrink: 0;
  color: rgb(var(--vip-gold));
}

.vip-offer__actions {
  display: flex;
  flex-wrap: wrap;
  flex: 1 1 240px;
  gap: 10px;

  :deep(.el-button) {
    margin: 0;
  }
}

.vip-cta {
  flex: 1 1 100%;
  height: 52px !important;
  border: 0 !important;
  border-radius: 12px !important;
  background: linear-gradient(100deg, rgb(255, 200, 70), rgb(255, 110, 170)) !important;
  box-shadow: 0 10px 30px rgba(var(--vip-rose), 0.28), 0 0 22px rgba(var(--vip-gold), 0.3) !important;
  color: #1a0f00 !important;
  font-size: 16px !important;
  font-weight: 800 !important;
  letter-spacing: 0.02em;
  transition: transform 160ms var(--ds-ease-out), box-shadow 200ms ease, filter 200ms ease !important;

  &:hover {
    filter: brightness(1.06);
    box-shadow: 0 14px 36px rgba(var(--vip-rose), 0.36), 0 0 30px rgba(var(--vip-gold), 0.4) !important;
  }

  &:active {
    transform: scale(0.98);
  }
}

// Пункти центровані: при переносі на другий рядок блок лишається симетричним.
.vip-trust {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 24px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  :deep(svg) {
    color: rgb(255, 206, 84);
  }
}

// Phones: headline first, then the stage, then proof and the offer.
@media (max-width: 860px) {
  .vip__main {
    display: contents;
  }

  .vip__main .vip__hero {
    order: -1;
    margin-bottom: 0;
  }

  .vip-stage__viewport {
    min-height: 150px;
  }

  .vip-offer {
    margin-top: 0;
  }
}

// Short desktop screens (768px laptops): same layout, tighter rhythm — no scroll.
@media (min-width: 861px) and (max-height: 820px) {
  .vip {
    padding: 28px 40px 26px;
  }

  .vip__title {
    font-size: 30px;
  }

  .vip__main .vip__hero {
    margin-bottom: 18px;
  }

  .vip-stage {
    padding: 18px;
  }

  .vip-ghost {
    padding: 9px 14px;
  }

  .vip-stage__colors {
    padding-top: 14px;
  }

  .vip-stage__viewport {
    min-height: 190px;
  }

  .vip-offer.is-card {
    padding: 16px 20px;
  }

  .vip-perks {
    gap: 14px;
  }

  .vip-compare th,
  .vip-compare td {
    padding: 8px 12px;
  }

  .vip-offer {
    margin-top: 18px;
    padding-top: 18px;
  }

  .vip-trust {
    margin-top: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  // The global rule shortens durations but keeps delays — skip the cascade entirely.
  .vip-reveal,
  .vip-word {
    animation: none;
  }

  .vip-preview,
  .vip-preview__bar,
  .vip-preview__aura,
  .vip-swatch,
  .vip-cta {
    transition: none !important;
  }

  .vip-preview__sheen {
    display: none;
  }
}
</style>
