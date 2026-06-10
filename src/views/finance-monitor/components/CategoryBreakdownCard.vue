<template>
  <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
    <FinanceBlockHeader
      :icon="PhChartPieSlice"
      title="Розподіл по категоріях"
      subtitle="за поточний період"
    />

    <div class="p-20">
      <div
        v-if="isPending"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-12"
      >
        <div v-for="i in 4" :key="i" class="h-56 rounded-xl bg-white/5 animate-pulse" />
      </div>

      <p v-else-if="!rows.length" class="text-sm text-gray-500 py-12 text-center">
        Немає даних для розподілу
      </p>

      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-12"
      >
        <div
          v-for="row in rows"
          :key="row.key"
          class="rounded-xl border border-white/8 bg-white/[0.02] p-12"
        >
          <p class="text-sm text-gray-300 font-medium truncate mb-8">
            {{ row.label }}
          </p>
          <div class="flex flex-col gap-2 text-xs">
            <div v-if="row.income" class="flex items-center gap-4 justify-between">
              <span class="text-gray-500">Дохід</span>
              <span class="text-green-400 tabular-nums">{{ formatUah(row.income, 'POSITIVE') }}</span>
            </div>
            <div v-if="row.expense" class="flex items-center gap-4 justify-between">
              <span class="text-gray-500">Витрата</span>
              <span class="text-red-400 tabular-nums">{{ formatUah(row.expense, 'NEGATIVE') }}</span>
            </div>
            <div class="flex items-center gap-4 justify-between pt-4 mt-2 border-t border-white/8">
              <span class="text-gray-400">Разом</span>
              <span class="tabular-nums font-semibold" :class="row.net >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ formatUah(row.net, row.net >= 0 ? 'POSITIVE' : 'NEGATIVE') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhChartPieSlice } from '@phosphor-icons/vue'
import type { TFeedItem } from '../finance.types'
import { formatUah } from '../utils/format-money'

const props = defineProps<{
  items: TFeedItem[]
  isPending?: boolean
}>()

const NO_CATEGORY_KEY = '__none__'

type TBreakdownRow = { key: string; label: string; income: number; expense: number }

/**
 * Per-category income/expense computed client-side over the loaded feed.
 * Groups contribute via their child operations (not the aggregate) to avoid double counting;
 * forecast/virtual rows are excluded.
 */
const rows = computed(() => {
  const map = new Map<string, TBreakdownRow>()

  const add = (op: TFeedItem) => {
    if (op.virtual || op.kind === 'FORECAST' || op.isHidden) return
    const key = op.category?.id ?? NO_CATEGORY_KEY
    const label = op.category?.label ?? 'Без категорії'
    const entry = map.get(key) ?? { key, label, income: 0, expense: 0 }
    if (op.amount >= 0) entry.income += op.amount
    else entry.expense += -op.amount
    map.set(key, entry)
  }

  props.items.forEach(item => {
    if (item.kind === 'GROUP') item.children.forEach(add)
    else add(item)
  })

  return [...map.values()]
    .map(r => ({ ...r, net: r.income - r.expense }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
})
</script>
