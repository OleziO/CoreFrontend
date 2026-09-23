<template>
  <div class="flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
    <FinanceBlockHeader
      :icon="PhReceipt"
      title="Транзакції"
      :subtitle="!isPending && !isError ? countLabel : undefined"
    >
      <div class="finance-toolbar flex items-center gap-8 flex-nowrap lg:justify-end">
        <el-input
          v-model="search"
          clearable
          placeholder="Пошук"
          class="finance-search flex-1 w-full"
        >
          <template #prefix>
            <PhMagnifyingGlass size="15" />
          </template>
        </el-input>

        <el-tooltip
          :content="showHidden ? 'Сховати приховані' : 'Показати приховані'"
          placement="top"
        >
          <el-button
            class="finance-icon-btn"
            :class="{ 'is-active': showHidden }"
            @click="showHidden = !showHidden"
          >
            <component
              :is="showHidden ? PhEye : PhEyeSlash"
              size="16"
            />
          </el-button>
        </el-tooltip>

        <el-dropdown
          trigger="click"
          placement="bottom-end"
          @command="handleAction"
        >
          <el-button class="finance-actions-btn">
            <PhDotsThreeVertical size="18" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="categories">
                <div class="flex gap-2 items-center p-4">
                  <PhTag size="16" class="mr-8" />
                  Категорія
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="sync">
                <div class="flex gap-2 items-center p-4">
                  <PhArrowsClockwise size="16" class="mr-8" />
                  Синхронізація
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <BankSyncButton
          ref="syncRef"
          hide-trigger
          @synced="$emit('refetch')"
        />
      </div>
    </FinanceBlockHeader>

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
import {
  PhMagnifyingGlass, PhReceipt, PhEye, PhEyeSlash, PhTag, PhArrowsClockwise, PhDotsThreeVertical
} from '@phosphor-icons/vue'
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

function pluralUk (n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return forms[1]
  return forms[2]
}

const countLabel = computed(() => {
  const n = filteredItems.value.length
  return `${n} ${pluralUk(n, ['транзакція', 'транзакції', 'транзакцій'])}`
})

const emit = defineEmits<{
  edit: [item: TFeedItem]
  group: [item: TFeedItem]
  'edit-group': [item: TFeedItem]
  'delete-group': [item: TFeedItem]
  'manage-categories': []
  refetch: []
}>()

const syncRef = ref<InstanceType<typeof BankSyncButton>>()

function handleAction (command: 'categories' | 'sync') {
  if (command === 'categories') emit('manage-categories')
  if (command === 'sync') syncRef.value?.open()
}
</script>

<style scoped>
/* Square icon-only toggle for "show hidden" — replaces the bulky checkbox.
   Height/radius come from the global control tokens (same as the search input);
   the "on" look comes from the global `.el-button.is-active` state. */
.finance-icon-btn {
  width: var(--ds-control-height);
  padding: 0 !important;
}
</style>

<!-- Popper teleports to <body>, so the dropdown menu can't be reached by scoped
     styles — target it via its popper-class in a global block. -->
<style>
.finance-dropdown .el-dropdown-menu {
  padding: 6px;
  min-width: 208px;
}

.finance-dropdown .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
}

.finance-dropdown .el-dropdown-menu__item svg {
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.2s ease;
}

.finance-dropdown .el-dropdown-menu__item:hover {
  background: rgba(46, 229, 255, 0.14);
  color: #fff;
  filter: none;
}

.finance-dropdown .el-dropdown-menu__item:hover svg {
  color: #7dd3fc;
}
</style>
