<template>
  <div class="h-full text-white w-full overflow-hidden flex flex-col finance-monitor-root">
    <div class="w-[90%] max-w-[1400px] mx-auto flex flex-col h-full py-20 gap-20">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-16 shrink-0">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">
            Finance Monitor
          </h1>
          <p class="text-sm text-gray-400 mt-4">
            Фінансовий аудит та прогнозування
          </p>
        </div>

        <el-checkbox
          v-model="includeForecast"
          label="Включити прогнозовані значення"
          class="finance-checkbox"
        />
      </div>

      <BalanceCard
        :balance="balanceQuery.data.value"
        :is-pending="balanceQuery.isPending.value"
      />

      <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-20">
        <TransactionFeed
          :items="operationsQuery.data.value?.items || []"
          :is-pending="operationsQuery.isPending.value"
          @rename="handleRename"
          @icon="handleIcon"
          @group="handleGroup"
          @create-category="handleCreateCategory"
          @refetch="refetchAll"
        />

        <ForecastCalculator
          :config="forecastQuery.data.value?.config"
          :result="forecastQuery.data.value?.result"
          :is-saving="forecastQuery.isSaving.value"
          @save="handleSaveForecast"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAppModals } from '@/composables/use-app-modals'
import { useFinanceAssets } from '@/composables/query/use-finance-assets'
import { useFinanceBalance } from '@/composables/query/use-finance-balance'
import { useFinanceForecast } from '@/composables/query/use-finance-forecast'
import { useFinanceOperations } from '@/composables/query/use-finance-operations'
import { queryCache } from '@/core/query-cache-client'
import BalanceCard from './components/BalanceCard.vue'
import TransactionFeed from './components/TransactionFeed.vue'
import ForecastCalculator from './components/ForecastCalculator.vue'
import type { FeedItem, ForecastConfig } from './finance.types'
import { financeService } from './finance.service'

const includeForecast = ref(false)

const balanceQuery = useFinanceBalance(includeForecast)
const operationsQuery = useFinanceOperations(computed(() => ({
  includeForecast: includeForecast.value
})))
const forecastQuery = useFinanceForecast()
const assetsQuery = useFinanceAssets()

const { open, close } = useAppModals()

const selectedOperationIds = ref<string[]>([])

function refetchAll () {
  queryCache.invalidateQueries({ key: ['finance'] })
}

function invalidateOperations () {
  queryCache.invalidateQueries({ key: ['finance', 'operations'] })
  queryCache.invalidateQueries({ key: ['finance', 'balance'] })
}

function handleRename (item: FeedItem) {
  const operationId = item.kind === 'OPERATION' ? item.id : item.operationIds[0]
  if (!operationId) return

  open('RenameOperationModal' as any, {
    operationId,
    initialLabel: item.title,
    onSubmit: async (label: string) => {
      await financeService.renameOperation(operationId, label)
      ElMessage.success('Операцію перейменовано')
      invalidateOperations()
      close('RenameOperationModal' as any)
    }
  })
}

function handleIcon (item: FeedItem) {
  const operationId = item.kind === 'OPERATION' ? item.id : item.operationIds[0]
  if (!operationId) return

  open('SelectIconModal' as any, {
    assets: assetsQuery.data.value || [],
    isPending: assetsQuery.isPending.value,
    onSubmit: async (iconAssetId: string) => {
      await financeService.setOperationIcon(operationId, iconAssetId)
      ElMessage.success('Іконку оновлено')
      invalidateOperations()
      close('SelectIconModal' as any)
    }
  })
}

function handleGroup (item: FeedItem) {
  selectedOperationIds.value = item.operationIds.length
    ? item.operationIds
    : [item.id]

  open('GroupOperationsModal' as any, {
    operationIds: selectedOperationIds.value,
    assets: assetsQuery.data.value || [],
    onSubmit: async (payload: { title: string; iconAssetId?: string }) => {
      await financeService.groupOperations({
        operationIds: selectedOperationIds.value,
        title: payload.title,
        iconAssetId: payload.iconAssetId
      })
      ElMessage.success('Групу створено')
      invalidateOperations()
      close('GroupOperationsModal' as any)
    }
  })
}

function handleCreateCategory () {
  open('CreateCustomCategoryModal' as any, {
    assets: assetsQuery.data.value || [],
    onSubmit: async (payload: { label: string; iconAssetId?: string | null }) => {
      await financeService.createCustomCategory(payload)
      ElMessage.success('Категорію створено')
      close('CreateCustomCategoryModal' as any)
    }
  })
}

async function handleSaveForecast (config: ForecastConfig) {
  await forecastQuery.saveForecast(config)
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.finance-monitor-root {
  overflow: hidden !important;
}

.finance-checkbox :deep(.el-checkbox__label) {
  color: #d1d5db;
}
</style>
