<template>
  <div class="relative">
    <div
      class="flex items-center justify-between gap-16 px-16 py-12 rounded-xl border border-white/5
             bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
      :class="{
        'border-dashed border-white/15': item.virtual,
        'cursor-pointer': isGroup,
        '!bg-transparent !border-transparent hover:!bg-white/[0.03]': nested
      }"
      @click="isGroup && toggleExpanded()"
    >
      <div class="flex items-center gap-12 min-w-0 flex-1">
        <PhCaretRight
          v-if="isGroup"
          size="16"
          class="shrink-0 text-gray-400 transition-transform duration-200"
          :class="{ 'rotate-90': expanded }"
        />

        <div
          class="shrink-0 w-40 h-40 rounded-full overflow-hidden bg-white/10 flex items-center justify-center"
          :class="{ 'w-32 h-32': nested }"
        >
          <el-image
            v-if="resolvedIcon"
            :src="resolvedIcon"
            fit="cover"
            class="w-full h-full"
          />
          <component
            :is="fallbackIcon"
            v-else
            size="20"
            class="text-gray-400"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-8 flex-wrap">
            <RouterLink
              v-if="teamId"
              :to="{ name: teamRouteNames.team, params: { id: teamId } }"
              class="text-white font-medium truncate hover:text-blue-300 transition-colors"
              @click.stop
            >
              {{ item.title }}
            </RouterLink>
            <p
              v-else
              class="text-white font-medium truncate"
            >
              {{ item.title }}
            </p>

            <span
              v-if="item.virtual"
              class="shrink-0 text-[10px] uppercase tracking-wider px-6 py-2 rounded
                     bg-blue-500/20 text-blue-300"
            >
              Прогноз
            </span>

            <span
              v-if="isGroup"
              class="shrink-0 inline-flex items-center gap-4 text-[10px] uppercase tracking-wider
                     px-6 py-2 rounded bg-white/10 text-gray-300"
            >
              {{ countLabel }}
            </span>

            <span
              v-if="item.category"
              class="shrink-0 inline-flex items-center gap-4 text-[11px] px-8 py-2 rounded-full
                     bg-blue-500/15 text-blue-200 border border-blue-400/20"
            >
              <el-image
                v-if="categoryIconUrl"
                :src="categoryIconUrl"
                fit="cover"
                class="w-12 h-12 rounded-full"
              />
              {{ item.category.label }}
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

      <div class="flex items-center gap-16 shrink-0">
        <p
          class="text-base font-semibold tabular-nums"
          :class="signColorClass(item.sign)"
        >
          {{ formatUah(item.amount, item.sign) }}
        </p>

        <div :class="{'invisible': !showMenu}">
          <el-dropdown
            trigger="click"
            @command="handleCommand"
          >
            <el-button
              size="small"
              circle
              @click.stop
            >
              <PhDotsThreeVertical size="18" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">
                  Перейменувати
                </el-dropdown-item>
                <el-dropdown-item command="icon">
                  Змінити іконку
                </el-dropdown-item>
                <el-dropdown-item command="group">
                  Групувати
                </el-dropdown-item>
                <el-dropdown-item command="category" divided>
                  Категорія
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- Inline accordion: nested child operations -->
    <div
      v-if="isGroup && expanded && item.children.length"
      class="mt-4 ml-20 pl-12 border-l border-white/10 flex flex-col gap-4"
    >
      <TransactionFeedItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        nested
        @rename="emit('rename', $event)"
        @icon="emit('icon', $event)"
        @group="emit('group', $event)"
        @assign-category="emit('assign-category', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhCoins, PhGift, PhStack, PhCaretRight, PhDotsThreeVertical } from '@phosphor-icons/vue'
import { teamRouteNames } from '@/views/teams/teams.route'
import type { TFeedItem } from '../finance.types'
import { formatUah, signColorClass } from '../utils/format-money'
import { resolveFinanceAssetUrl } from '../utils/resolve-finance-asset-url'

const props = defineProps<{
  item: TFeedItem
  nested?: boolean
}>()

const emit = defineEmits<{
  rename: [item: TFeedItem]
  icon: [item: TFeedItem]
  group: [item: TFeedItem]
  'assign-category': [item: TFeedItem]
}>()

const expanded = ref(false)

const isGroup = computed(() => props.item.kind === 'GROUP')
const isGiftGroup = computed(() =>
  props.item.groupKind === 'TEAM_GIFT' || props.item.groupKind === 'OTHER_GIFTS'
)

// Team-gift groups carry `team:<teamId>` as their group key — link the row to the team page.
const teamId = computed(() =>
  props.item.groupKey?.startsWith('team:') ? props.item.groupKey.slice('team:'.length) : null
)

const resolvedIcon = computed(() => resolveFinanceAssetUrl(props.item.iconUrl))
const categoryIconUrl = computed(() => resolveFinanceAssetUrl(props.item.category?.icon?.url))

const fallbackIcon = computed(() => (isGiftGroup.value ? PhGift : isGroup.value ? PhStack : PhCoins))

// Only plain operations (including group children) can be renamed / re-iconed / grouped.
const showMenu = computed(() => props.item.kind === 'OPERATION' && !props.item.virtual)

const formattedTime = computed(() =>
  props.item.time ? dayjs(props.item.time).format('DD.MM.YYYY HH:mm') : ''
)

function pluralUk (n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return forms[1]
  return forms[2]
}

const countLabel = computed(() => {
  const n = props.item.count
  const word = isGiftGroup.value
    ? pluralUk(n, ['подарунок', 'подарунки', 'подарунків'])
    : pluralUk(n, ['операція', 'операції', 'операцій'])
  return `${n} ${word}`
})

function toggleExpanded () {
  expanded.value = !expanded.value
}

function handleCommand (command: string) {
  if (command === 'rename') emit('rename', props.item)
  if (command === 'icon') emit('icon', props.item)
  if (command === 'group') emit('group', props.item)
  if (command === 'category') emit('assign-category', props.item)
}
</script>
