<template>
  <div class="pay-consent">
    <el-checkbox v-model="agreed" class="pay-consent__check" :disabled="unavailable">
      Я погоджуюся з
      <a :href="legalPageHref('offer')" target="_blank" rel="noopener" @click.stop>Договором публічної оферти</a>,
      <a :href="legalPageHref('terms')" target="_blank" rel="noopener" @click.stop>Умовами користування</a>
      та
      <a :href="legalPageHref('refund')" target="_blank" rel="noopener" @click.stop>Політикою повернення коштів</a>
    </el-checkbox>

    <p v-if="unavailable" class="pay-consent__error" role="alert">
      Не вдалося завантажити актуальну версію умов — оплата тимчасово недоступна.
      <button type="button" class="pay-consent__retry" @click="emit('retry')">Спробувати ще раз</button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { legalPageHref } from '@/config/legal-pages'

/**
 * Галочка згоди перед оплатою (VIP, вступний внесок, підтримка ліги). Стан і
 * версію умов тримає `usePaymentConsent` у батька — тут лише розмітка; кнопка
 * оплати в батька вимкнена, доки галочку не поставлено.
 */
defineProps<{
  /** Версію умов не отримано з `GET /public/pricing` — погодитися ні з чим. */
  unavailable?: boolean
}>()

const agreed = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  retry: []
}>()
</script>

<style scoped lang="scss">
.pay-consent {
  @apply flex flex-col gap-6 text-left;
}

// Чекбокс Element Plus — однорядковий; тут текст переноситься, а квадрат — біля першого рядка.
.pay-consent__check {
  @apply h-auto items-start whitespace-normal;
  margin-right: 0;

  :deep(.el-checkbox__input) {
    @apply mt-2;
  }

  :deep(.el-checkbox__label) {
    @apply whitespace-normal text-xs leading-relaxed text-white/70;
  }

  a {
    @apply text-primary underline underline-offset-2;
  }
}

.pay-consent__error {
  @apply m-0 text-xs leading-snug text-error;
}

.pay-consent__retry {
  @apply cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-primary underline underline-offset-2;
}

@media (hover: hover) and (pointer: fine) {
  .pay-consent__check a:hover,
  .pay-consent__retry:hover {
    @apply text-primary-300;
  }
}
</style>
