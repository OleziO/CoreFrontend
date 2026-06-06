<template>
  <div class="rounded-2xl border border-white/10 bg-white/5 p-24 backdrop-blur-sm">
    <p class="text-sm text-gray-400 mb-8">
      {{ subtitle }}
    </p>

    <div v-if="isPending" class="h-48 flex items-center">
      <el-skeleton :rows="1" animated />
    </div>

    <div v-else-if="balance" class="flex flex-col gap-4">
      <p class="text-4xl font-bold text-white tracking-tight">
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
</template>

<script setup lang="ts">
import type { Balance } from '../finance.types'
import { formatUah } from '../utils/format-money'

const props = defineProps<{
  balance?: Balance
  isPending?: boolean
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
