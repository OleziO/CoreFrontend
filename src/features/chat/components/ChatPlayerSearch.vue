<template>
  <div class="chat-search">
    <el-input
      ref="inputRef"
      v-model="query"
      size="small"
      placeholder="Пошук гравця…"
      clearable
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="pickHighlighted"
    >
      <template #prefix>
        <PhMagnifyingGlass :size="14" />
      </template>
    </el-input>

    <p v-if="results.length && !query.trim()" class="chat-search__caption">Друзі та гравці онлайн</p>
    <ul v-if="results.length" class="chat-search__list" role="listbox" aria-label="Гравці">
      <li
        v-for="(player, i) in results"
        :key="player.id"
        class="chat-search__item"
        :class="{ 'is-highlighted': i === highlighted }"
        role="option"
        :aria-selected="i === highlighted"
        @mouseenter="highlighted = i"
        @click="emit('select', player)"
      >
        <ChatAvatar :player="player" :size="24" />
        <span class="chat-search__name">{{ playerName(player) }}</span>
        <span
          v-if="player.discordUsername && player.discordUsername !== player.discordName"
          class="chat-search__handle"
        >
          @{{ player.discordUsername }}
        </span>
      </li>
    </ul>
    <p v-else class="chat-search__empty">
      {{ loading ? 'Шукаємо…' : query.trim() ? 'Нікого не знайдено' : 'Ні друзів, ні гравців онлайн — почніть вводити імʼя' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { PhMagnifyingGlass } from '@phosphor-icons/vue'
import type { TChatPlayer } from '@/api/types/api.types'
import { chatService } from '@/features/chat/chat.service'
import { playerName } from '@/features/chat/chat.utils'
import ChatAvatar from '@/features/chat/components/ChatAvatar.vue'

const emit = defineEmits<{
  select: [player: TChatPlayer]
}>()

const query = ref('')
const results = ref<TChatPlayer[]>([])
const loading = ref(false)
const highlighted = ref(0)
const inputRef = ref<{ focus: () => void } | null>(null)
let requestId = 0

const runSearch = useDebounceFn(async (q: string) => {
  const id = ++requestId
  loading.value = true
  try {
    const found = await chatService.searchPlayers(q)
    if (id === requestId) {
      results.value = found
      highlighted.value = 0
    }
  } catch {
    if (id === requestId) results.value = []
  } finally {
    if (id === requestId) loading.value = false
  }
}, 250)

watch(query, (q) => { runSearch(q.trim()) }, { immediate: true })

function move (step: number) {
  if (!results.value.length) return
  highlighted.value = (highlighted.value + step + results.value.length) % results.value.length
}

function pickHighlighted () {
  const player = results.value[highlighted.value]
  if (player) emit('select', player)
}

onMounted(() => nextTick(() => inputRef.value?.focus()))
</script>

<style scoped>
.chat-search__caption {
  margin: 8px 2px 0;
  font-size: 11px;
  color: var(--ds-text-faint);
}

.chat-search__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 260px;
  margin: 8px 0 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.chat-search__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
}

.chat-search__item.is-highlighted {
  background: rgba(var(--ds-primary-rgb), 0.1);
  box-shadow: inset 2px 0 0 rgba(var(--ds-primary-rgb), 0.8);
}

.chat-search__item > :first-child {
  flex-shrink: 0;
}

.chat-search__name {
  min-width: 0;
  flex: 0 1 auto;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--ds-text-strong);
}

.chat-search__handle {
  min-width: 0;
  flex: 1 1 0;
  overflow: hidden;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--ds-text-faint);
}

.chat-search__empty {
  margin: 10px 4px 2px;
  font-size: 12px;
  color: var(--ds-text-faint);
}
</style>
