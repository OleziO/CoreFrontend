<template>
  <div
    class="flex items-center justify-between gap-16 px-16 py-12 rounded-xl border border-white/5
           bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
    :class="{ 'border-dashed border-white/15': item.virtual }"
  >
    <div class="flex items-center gap-12 min-w-0 flex-1">
      <div
        class="shrink-0 w-40 h-40 rounded-full overflow-hidden bg-white/10 flex items-center justify-center"
      >
        <el-image
          v-if="item.iconUrl"
          :src="item.iconUrl"
          fit="cover"
          class="w-full h-full"
        />
        <PhCoins
          v-else
          size="20"
          class="text-gray-400"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-8">
          <p class="text-white font-medium truncate">
            {{ item.title }}
          </p>
          <span
            v-if="item.virtual"
            class="shrink-0 text-[10px] uppercase tracking-wider px-6 py-2 rounded
                   bg-blue-500/20 text-blue-300"
          >
            Прогноз
          </span>
        </div>
        <p
          v-if="item.time"
          class="text-xs text-gray-500 mt-2"
        >
          {{ formattedTime }}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-8 shrink-0">
      <p
        class="text-base font-semibold tabular-nums"
        :class="signColorClass(item.sign)"
      >
        {{ formatUah(item.amount, item.sign) }}
      </p>

      <el-dropdown
        v-if="!item.virtual && item.kind !== 'FORECAST'"
        trigger="click"
        @command="handleCommand"
      >
        <el-button
          text
          class="!p-4 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <PhDotsThreeVertical size="18" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-if="item.kind === 'OPERATION'"
              command="rename"
            >
              Перейменувати
            </el-dropdown-item>
            <el-dropdown-item
              v-if="item.kind === 'OPERATION'"
              command="icon"
            >
              Змінити іконку
            </el-dropdown-item>
            <el-dropdown-item command="group">
              Групувати
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhCoins, PhDotsThreeVertical } from '@phosphor-icons/vue'
import type { FeedItem } from '../finance.types'
import { formatUah, signColorClass } from '../utils/format-money'

const props = defineProps<{
  item: FeedItem
}>()

const emit = defineEmits<{
  rename: [item: FeedItem]
  icon: [item: FeedItem]
  group: [item: FeedItem]
}>()

const formattedTime = computed(() =>
  props.item.time ? dayjs(props.item.time).format('DD.MM.YYYY HH:mm') : ''
)

function handleCommand (command: string) {
  if (command === 'rename') emit('rename', props.item)
  if (command === 'icon') emit('icon', props.item)
  if (command === 'group') emit('group', props.item)
}
</script>
