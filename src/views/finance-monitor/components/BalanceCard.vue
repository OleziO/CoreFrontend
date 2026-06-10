<template>
  <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-sm">
    <FinanceBlockHeader
      :icon="PhWallet"
      title="Баланс"
      :subtitle="subtitle"
    />

    <div class="p-20 sm:p-24">
      <div v-if="isPending" class="h-48 flex items-center">
        <el-skeleton :rows="1" animated />
      </div>

      <p v-else-if="isError" class="text-red-400 text-sm">
        Не вдалося завантажити баланс
      </p>

      <div v-else-if="balance" class="flex flex-col gap-4">
        <p
          class="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums break-words"
          :class="displayAmount < 0 ? 'text-red-400' : 'text-white'"
        >
          {{ formatUah(displayAmount, undefined, { showSign: false }) }}
        </p>

        <p
          v-if="balance.includesForecast && balance.forecast !== 0"
          class="text-sm text-gray-400"
        >
          Фактичний: {{ formatUah(balance.actual, undefined, { showSign: false }) }}
          <span class="mx-6">·</span>
          Прогноз: {{ formatUah(balance.forecast, balance.forecast >= 0 ? 'POSITIVE' : 'NEGATIVE') }}
        </p>
      </div>

      <p v-else class="text-gray-500 text-sm">
        Не вдалося завантажити баланс
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhWallet } from '@phosphor-icons/vue'
import type { TBalance } from '../finance.types'
import { formatUah } from '../utils/format-money'

const props = defineProps<{
  balance?: TBalance
  isPending?: boolean
  isError?: boolean
}>()

const displayAmount = computed(() => {
  if (!props.balance) return 0
  return props.balance.includesForecast ? props.balance.total : props.balance.actual
})

const subtitle = computed(() =>
  props.balance?.includesForecast
    ? 'Баланс з урахуванням прогнозу'
    : 'Поточний баланс'
)
</script>
