<template>
  <div class="flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
    <div class="flex items-center justify-between px-20 py-16 border-b border-white/10 shrink-0">
      <h2 class="text-lg font-semibold text-white">
        Транзакції
      </h2>

      <div class="flex items-center gap-8">
        <el-checkbox
          v-model="showHidden"
          label="Приховані"
          size="small"
          class="finance-checkbox shrink-0"
        />
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="Пошук"
          class="finance-search w-160"
        >
          <template #prefix>
            <PhMagnifyingGlass size="14" />
          </template>
        </el-input>
        <el-button
          size="small"
          @click="$emit('manage-categories')"
        >
          Категорія
        </el-button>
        <BankSyncButton @synced="$emit('refetch')" />
      </div>
    </div>

    <div v-if="isPending" class="flex-1 p-20">
      <el-skeleton :rows="6" animated />
    </div>

    <div
      v-else-if="isError"
      class="flex-1 flex flex-col items-center justify-center gap-12 p-20 text-center"
    >
      <p class="text-red-400 text-sm">
        Не вдалося завантажити транзакції
      </p>
      <el-button size="small" @click="$emit('refetch')">
        Спробувати ще раз
      </el-button>
    </div>

    <div
      v-else-if="filteredItems.length"
      class="flex-1 min-h-0 overflow-y-auto p-12 flex flex-col gap-8"
    >
      <TransactionFeedItem
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        @edit="$emit('edit', $event)"
        @group="$emit('group', $event)"
        @edit-group="$emit('edit-group', $event)"
        @delete-group="$emit('delete-group', $event)"
      />
    </div>

    <el-empty
      v-else
      :description="search.trim() ? 'Нічого не знайдено' : 'Транзакцій немає'"
      class="flex-1"
      :image-size="120"
    />
  </div>
</template>

<script setup lang="ts">
import { PhMagnifyingGlass } from '@phosphor-icons/vue'
import type { TFeedItem } from '../finance.types'
import TransactionFeedItem from './TransactionFeedItem.vue'
import BankSyncButton from './BankSyncButton.vue'

const props = defineProps<{
  items: TFeedItem[]
  isPending?: boolean
  isError?: boolean
}>()

const showHidden = defineModel<boolean>('showHidden', { default: false })

const search = ref('')

// Client-side free-text search over title and category; a group matches if it
// or any of its child operations match (by title or category label).
function itemMatches (item: TFeedItem, q: string): boolean {
  return item.title.toLowerCase().includes(q) ||
    !!item.category?.label.toLowerCase().includes(q)
}

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items.filter(item =>
    itemMatches(item, q) || item.children.some(child => itemMatches(child, q))
  )
})

defineEmits<{
  edit: [item: TFeedItem]
  group: [item: TFeedItem]
  'edit-group': [item: TFeedItem]
  'delete-group': [item: TFeedItem]
  'manage-categories': []
  refetch: []
}>()
</script>

<style scoped>
.finance-checkbox :deep(.el-checkbox__label) {
  color: #d1d5db;
}
</style>
