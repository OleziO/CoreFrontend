<template>
  <div class="flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
    <div class="flex items-center justify-between px-20 py-16 border-b border-white/10 shrink-0">
      <h2 class="text-lg font-semibold text-white">
        Транзакції
      </h2>

      <div class="flex items-center gap-8">
        <el-button
          size="small"
          @click="$emit('create-category')"
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
      v-else-if="items.length"
      class="flex-1 min-h-0 overflow-y-auto p-12 flex flex-col gap-8"
    >
      <TransactionFeedItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        @rename="$emit('rename', $event)"
        @icon="$emit('icon', $event)"
        @group="$emit('group', $event)"
      />
    </div>

    <el-empty
      v-else
      description="Транзакцій немає"
      class="flex-1"
      :image-size="120"
    />
  </div>
</template>

<script setup lang="ts">
import type { FeedItem } from '../finance.types'
import TransactionFeedItem from './TransactionFeedItem.vue'
import BankSyncButton from './BankSyncButton.vue'

defineProps<{
  items: FeedItem[]
  isPending?: boolean
}>()

defineEmits<{
  rename: [item: FeedItem]
  icon: [item: FeedItem]
  group: [item: FeedItem]
  'create-category': []
  refetch: []
}>()
</script>
