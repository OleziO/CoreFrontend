<template>
  <div class="min-h-full text-white w-full flex flex-col">
    <div class="w-[90%] max-w-[1400px] mx-auto flex flex-col py-20 gap-20">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-16 shrink-0">
        <div>
          <h1 class="text-4xl font-semibold tracking-tight">
            Finance Monitor
          </h1>
          <p class="text-sm text-gray-400 mt-4">
            Фінансовий аудит та прогнозування
          </p>
        </div>

        <div class="flex items-center gap-16">
          <el-checkbox
            v-model="includeForecast"
            label="Включити прогнозовані значення"
            class="finance-checkbox"
          />
          <el-checkbox
            v-model="showHidden"
            label="Показати приховані"
            class="finance-checkbox"
          />
        </div>
      </div>

      <BalanceCard
        :balance="balanceQuery.data.value"
        :is-pending="balanceQuery.isPending.value"
        :is-error="balanceHasError"
      />

      <CategoryBreakdownCard
        :items="operationsQuery.data.value?.items || []"
        :is-pending="operationsQuery.isPending.value"
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 auto-rows-[78vh]">
        <TransactionFeed
          :items="operationsQuery.data.value?.items || []"
          :is-pending="operationsQuery.isPending.value"
          :is-error="operationsHasError"
          @rename="handleRename"
          @icon="handleIcon"
          @group="handleGroup"
          @assign-category="handleAssignCategory"
          @toggle-hidden="handleToggleHidden"
          @manage-categories="handleManageCategories"
          @refetch="refetchAll"
        />

        <ForecastCalculator
          :config="forecastQuery.data.value?.config"
          :result="forecastQuery.data.value?.result"
          :is-pending="forecastQuery.isPending.value"
          :is-error="forecastHasError"
          :is-saving="forecastQuery.isSaving.value"
          @save="handleSaveForecast"
        />
      </div>
    </div>

    <CategoryManagerDrawer
      v-model="categoryDrawerVisible"
      :categories="categoriesQuery.data.value || []"
      :assets="assetsQuery.data.value || []"
      :on-create="createCategory"
      :on-update="updateCategory"
      :on-delete="deleteCategory"
    />
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAppModals } from '@/composables/use-app-modals'
import { useFinanceAssets } from '@/composables/query/use-finance-assets'
import { useFinanceBalance } from '@/composables/query/use-finance-balance'
import { useFinanceCategories } from '@/composables/query/use-finance-categories'
import { useFinanceForecast } from '@/composables/query/use-finance-forecast'
import { useFinanceOperations } from '@/composables/query/use-finance-operations'
import { queryCache } from '@/core/query-cache-client'
import BalanceCard from './components/BalanceCard.vue'
import TransactionFeed from './components/TransactionFeed.vue'
import ForecastCalculator from './components/ForecastCalculator.vue'
import CategoryManagerDrawer from './components/CategoryManagerDrawer.vue'
import CategoryBreakdownCard from './components/CategoryBreakdownCard.vue'
import type {
  TCreateCustomCategoryPayload,
  TFeedItem,
  TForecastConfig,
  TUpdateCustomCategoryPayload,
  TUpdateOperationPayload
} from './finance.types'
import { financeService } from './finance.service'
import { findAssetIdByResolvedUrl } from './utils/resolve-finance-asset-url'

const includeForecast = ref(false)
const showHidden = ref(false)

const balanceQuery = useFinanceBalance(includeForecast)
const operationsQuery = useFinanceOperations(computed(() => ({
  includeForecast: includeForecast.value,
  showHidden: showHidden.value
})))
const forecastQuery = useFinanceForecast()
const assetsQuery = useFinanceAssets()
const categoriesQuery = useFinanceCategories()

const categoryDrawerVisible = ref(false)

const balanceHasError = computed(() => !!balanceQuery.error.value)
const operationsHasError = computed(() => !!operationsQuery.error.value)
const forecastHasError = computed(() => !!forecastQuery.error.value)

const { open, close } = useAppModals()

const selectedOperationIds = ref<string[]>([])

function refetchAll () {
  queryCache.invalidateQueries({ key: ['finance'] })
}

function invalidateOperations () {
  queryCache.invalidateQueries({ key: ['finance', 'operations'] })
  queryCache.invalidateQueries({ key: ['finance', 'balance'] })
}

function invalidateCategories () {
  queryCache.invalidateQueries({ key: ['finance', 'categories'] })
  // Matchers/assignments change per-row categories — refresh the feed too.
  queryCache.invalidateQueries({ key: ['finance', 'operations'] })
}

/**
 * Build a full `UpdateOperationDto` for the unified `PATCH /operations/{id}`.
 * The endpoint is a full replace, so we carry the item's current values and let the
 * caller override just the field being edited. The icon id is recovered from the
 * resolved `iconUrl` (the feed never returns `iconAssetId`) to avoid wiping it.
 */
function buildOperationPayload (
  item: TFeedItem,
  overrides: Partial<TUpdateOperationPayload>
): TUpdateOperationPayload {
  return {
    title: item.title,
    iconAssetId: findAssetIdByResolvedUrl(assetsQuery.data.value || [], item.iconUrl),
    categoryId: item.category?.id ?? null,
    comment: null,
    isHidden: item.isHidden,
    ...overrides
  }
}

function handleRename (item: TFeedItem) {
  const operationId = item.kind === 'OPERATION' ? item.id : item.operationIds[0]
  if (!operationId) return

  open('RenameOperationModal' as any, {
    operationId,
    initialLabel: item.title,
    onSubmit: async (label: string) => {
      await financeService.updateOperation(operationId, buildOperationPayload(item, { title: label }))
      ElMessage.success('Операцію перейменовано')
      invalidateOperations()
      close('RenameOperationModal' as any)
    }
  })
}

function handleIcon (item: TFeedItem) {
  const operationId = item.kind === 'OPERATION' ? item.id : item.operationIds[0]
  if (!operationId) return

  open('SelectIconModal' as any, {
    assets: assetsQuery.data.value || [],
    isPending: assetsQuery.isPending.value,
    onSubmit: async (iconAssetId: string) => {
      await financeService.updateOperation(operationId, buildOperationPayload(item, { iconAssetId }))
      ElMessage.success('Іконку оновлено')
      invalidateOperations()
      close('SelectIconModal' as any)
    }
  })
}

async function handleToggleHidden (item: TFeedItem) {
  const operationId = item.kind === 'OPERATION' ? item.id : item.operationIds[0]
  if (!operationId) return

  await financeService.updateOperation(operationId, buildOperationPayload(item, { isHidden: !item.isHidden }))
  ElMessage.success(item.isHidden ? 'Операцію показано' : 'Операцію приховано')
  invalidateOperations()
}

function handleGroup (item: TFeedItem) {
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

function handleManageCategories () {
  categoryDrawerVisible.value = true
}

async function createCategory (payload: TCreateCustomCategoryPayload) {
  await financeService.createCustomCategory(payload)
  ElMessage.success('Категорію створено')
  invalidateCategories()
}

async function updateCategory (id: string, payload: TUpdateCustomCategoryPayload) {
  await financeService.updateCustomCategory(id, payload)
  ElMessage.success('Категорію оновлено')
  invalidateCategories()
}

async function deleteCategory (id: string) {
  await financeService.deleteCustomCategory(id)
  ElMessage.success('Категорію видалено')
  invalidateCategories()
}

function handleAssignCategory (item: TFeedItem) {
  const operationId = item.kind === 'OPERATION' ? item.id : item.operationIds[0]
  if (!operationId) return

  open('AssignCategoryModal' as any, {
    categories: categoriesQuery.data.value || [],
    currentCategoryId: item.category?.id ?? null,
    onSubmit: async (categoryId: string | null) => {
      await financeService.updateOperation(operationId, buildOperationPayload(item, { categoryId }))
      ElMessage.success('Категорію оновлено')
      invalidateOperations()
      close('AssignCategoryModal' as any)
    }
  })
}

async function handleSaveForecast (config: TForecastConfig) {
  await forecastQuery.saveForecast(config)
}
</script>

<style scoped>
.finance-checkbox :deep(.el-checkbox__label) {
  color: #d1d5db;
}
</style>
