<template>
  <el-dialog
    v-model="modelValue"
    :show-close="false"
    :width="460"
    align-center
    append-to-body
    class="paysw-dialog"
    aria-label="Змінився спосіб оплати"
  >
    <div class="paysw">
      <span class="paysw__glow" aria-hidden="true" />

      <button type="button" class="paysw__close" aria-label="Закрити" @click="modelValue = false">
        <PhX :size="16" weight="bold" />
      </button>

      <span class="paysw__eyebrow">
        <PhCrown :size="13" weight="fill" />
        Core League VIP
      </span>

      <h2 class="paysw__title">
        Змінився <span class="paysw__accent">спосіб оплати</span>
      </h2>
      <p class="paysw__lead">VIP тепер оплачується через WayForPay.</p>

      <ul class="paysw__list">
        <li>
          <PhProhibit :size="18" weight="duotone" class="paysw__icon" />
          <span>Автосписання за наступний місяць <b>скасовано</b> — більше нічого не спишеться.</span>
        </li>
        <li>
          <PhCalendarCheck :size="18" weight="duotone" class="paysw__icon" />
          <span v-if="vipUntil">Оплачений час збережено: VIP діє до <b>{{ vipUntil }}</b></span>
          <span v-else>Оплачений час збережено — VIP діє до кінця оплаченого періоду.</span>
        </li>
        <li class="is-offer">
          <PhSeal :size="18" weight="duotone" class="paysw__icon" />
          <span>
            <b>−{{ notice?.discountPercent ?? 10 }}%</b> на всі наступні місяці:
            <b>{{ price }} ₴</b> <s>{{ fullPrice }} ₴</s> / міс.
          </span>
        </li>
      </ul>

      <p v-if="notice?.adminPreview" class="paysw__note">
        Ви бачите це як адміністратор — таке сповіщення отримали гравці з оплаченим VIP.
      </p>

      <div class="paysw__actions">
        <el-button
          v-if="!notice?.adminPreview"
          type="primary"
          size="large"
          class="paysw__cta"
          @click="subscribe"
        >
          <PhCrown :size="17" weight="fill" class="mr-8" />
          Оформити зі знижкою
        </el-button>
        <el-button size="large" plain class="paysw__later" @click="modelValue = false">
          Зрозуміло
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhCalendarCheck, PhCrown, PhProhibit, PhSeal, PhX } from '@phosphor-icons/vue'
import { VIP_PRICE_UAH } from '@/core/vip.constants'
import { useVipStore } from '@/store/modules/vip'

/**
 * Одноразове сповіщення про перехід на WayForPay: гравцям, у яких оплачений VIP
 * втратив автосписання monobank, і адмінам (як попередній перегляд). Будь-яке
 * закриття позначає його прочитаним на беку — більше не з'явиться.
 */
const modelValue = defineModel<boolean>({ default: false })

const vipStore = useVipStore()
const { open } = useAppModals()

/** Знімок на момент відкриття: після підтвердження бек повертає `paymentNotice: null`. */
const notice = ref(vipStore.status?.paymentNotice ?? null)

const dateFormat = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
const vipUntil = computed(() => notice.value?.vipUntil ? dateFormat.format(new Date(notice.value.vipUntil)) : null)
const fullPrice = computed(() => Math.round((notice.value?.fullPriceKopecks ?? VIP_PRICE_UAH * 100) / 100))
const price = computed(() => Math.round((notice.value?.priceKopecks ?? fullPrice.value * 90) / 100))

let acknowledged = false
function acknowledge () {
  if (acknowledged) return
  acknowledged = true
  vipStore.ackPaymentNotice()
}

function subscribe () {
  modelValue.value = false
  open('VipModal')
}

// Модалки з useAppModals монтуються вже відкритими — тому watch, а не @open/@close.
watch(modelValue, (isOpen) => {
  if (!isOpen) acknowledge()
})
</script>

<!-- Not scoped for the dialog shell: el-dialog is teleported to <body>. -->
<style>
.paysw-dialog.el-dialog {
  max-width: calc(100vw - 32px);
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 20px;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none !important;
}

.paysw-dialog.el-dialog::before,
.paysw-dialog.el-dialog::after {
  display: none;
}

.paysw-dialog .el-dialog__header {
  display: none;
}

.paysw-dialog .el-dialog__body {
  padding: 0 !important;
}
</style>

<style scoped lang="scss">
// Same premium surface as the VIP modal: deep glass, gold → rose foil.
.paysw {
  --vip-gold: 255, 206, 84;
  --vip-rose: 255, 94, 170;

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(var(--vip-gold), 0.28);
  background:
    radial-gradient(ellipse 360px 200px at 0% -10%, rgba(var(--vip-gold), 0.16), transparent 70%),
    radial-gradient(ellipse 320px 200px at 100% 0%, rgba(var(--vip-rose), 0.12), transparent 70%),
    linear-gradient(180deg, rgba(16, 17, 30, 0.98) 0%, rgba(8, 9, 16, 0.99) 100%);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(var(--vip-gold), 0.12);
  padding: 30px 28px 24px;
  color: #fff;
  animation: paysw-in 420ms var(--ds-ease-out) both;

  @media (max-width: 480px) {
    padding: 26px 20px 20px;
  }
}

@keyframes paysw-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
}

.paysw__glow {
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--vip-gold), 0.9), rgba(var(--vip-rose), 0.9), transparent);
}

.paysw__close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  width: 32px;
  height: 32px;
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

.paysw__eyebrow {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid rgba(var(--vip-gold), 0.4);
  background: rgba(var(--vip-gold), 0.08);
  padding: 4px 11px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(255, 222, 140);
}

.paysw__title {
  margin: 0;
  padding-right: 32px;
  font-family: var(--ds-font-display);
  font-size: 24px;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.paysw__accent {
  background: linear-gradient(100deg, rgb(255, 214, 102), rgb(255, 120, 180));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.paysw__lead {
  margin: -4px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.68);
}

.paysw__list {
  display: grid;
  gap: 10px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.02);
    padding: 11px 13px;
    font-size: 13px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.78);
  }

  b {
    color: #fff;
  }

  s {
    color: rgba(255, 255, 255, 0.4);
  }

  .is-offer {
    border-color: rgba(var(--vip-gold), 0.35);
    background: linear-gradient(135deg, rgba(var(--vip-gold), 0.1), rgba(var(--vip-rose), 0.06));

    b:first-child {
      color: rgb(255, 214, 102);
    }
  }
}

.paysw__icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: rgb(255, 214, 102);
}

.paysw__note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.42);
}

.paysw__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;

  :deep(.el-button) {
    flex: 1 1 160px;
    margin: 0;
    min-height: 46px;
  }
}

.paysw__cta {
  border: 0 !important;
  border-radius: 12px !important;
  background: linear-gradient(100deg, rgb(255, 200, 70), rgb(255, 110, 170)) !important;
  box-shadow: 0 10px 30px rgba(var(--vip-rose), 0.28), 0 0 22px rgba(var(--vip-gold), 0.3) !important;
  color: #1a0f00 !important;
  font-weight: 800 !important;
  transition: transform 160ms var(--ds-ease-out), filter 200ms ease !important;

  &:hover {
    filter: brightness(1.06);
  }

  &:active {
    transform: scale(0.98);
  }
}

.paysw__later {
  border-radius: 12px !important;
}

@media (prefers-reduced-motion: reduce) {
  .paysw {
    animation: none;
  }

  .paysw__cta {
    transition: none !important;
  }
}
</style>
