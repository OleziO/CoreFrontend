<template>
  <div class="chat-list-wrap">
    <div ref="scrollRef" class="chat-list" @scroll.passive="onScroll">
      <div v-if="state?.loading && state.messages.length" class="chat-list__older">Завантаження…</div>
      <div v-else-if="state?.loaded && !state.hasMore && state.messages.length" class="chat-list__older">
        Початок розмови
      </div>

      <div v-if="!state?.loaded" class="chat-list__state">Завантаження повідомлень…</div>
      <div v-else-if="!state.messages.length" class="chat-list__state">
        <PhChatsCircle :size="30" weight="duotone" class="text-primary/60" />
        {{ emptyText }}
      </div>

      <template v-for="row in rows" :key="row.message.id">
        <div v-if="row.daySeparator" class="chat-list__day">
          <span>{{ row.daySeparator }}</span>
        </div>
        <ChatMessageItem :message="row.message" :grouped="row.grouped" />
      </template>
    </div>

    <Transition name="chat-jump">
      <button v-if="showJump" type="button" class="chat-list__jump" @click="scrollToBottom(true)">
        <PhArrowDown :size="13" weight="bold" />
        {{ pendingNew ? `Нові повідомлення (${pendingNew})` : 'До останніх' }}
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { PhArrowDown, PhChatsCircle } from '@phosphor-icons/vue'
import type { TChatMessage } from '@/api/types/api.types'
import { useChatStore } from '@/features/chat/chat.store'
import { CHAT_GROUP_GAP_MS, channelKindOf, formatDayLabel, isSameDay } from '@/features/chat/chat.utils'
import ChatMessageItem from '@/features/chat/components/ChatMessageItem.vue'

const props = defineProps<{
  channelKey: string
}>()

/** Відстань до низу, у межах якої вважаємо, що користувач «внизу» стрічки. */
const BOTTOM_THRESHOLD = 48
/** Наближення до верху, з якого підвантажуємо старіші повідомлення. */
const TOP_THRESHOLD = 80

const chatStore = useChatStore()
const scrollRef = ref<HTMLElement | null>(null)
const isAtBottom = ref(true)
const pendingNew = ref(0)

const state = computed(() => chatStore.channels[props.channelKey])

const emptyText = computed(() => {
  switch (channelKindOf(props.channelKey)) {
    case 'dm': return 'Напишіть перше повідомлення'
    case 'admin': return 'Опишіть питання — адміністрація відповість тут'
    default: return 'Тут поки тихо — почніть розмову'
  }
})

interface IRow {
  message: TChatMessage
  grouped: boolean
  daySeparator: string | null
}

/** Роздільники днів і склеювання сусідніх повідомлень одного автора. */
const rows = computed<IRow[]>(() => {
  const messages = state.value?.messages ?? []
  return messages.map((message, i) => {
    const prev = messages[i - 1]
    const newDay = !prev || !isSameDay(prev.createdAt, message.createdAt)
    const grouped = !!prev && !newDay && prev.author.id === message.author.id &&
      new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() < CHAT_GROUP_GAP_MS
    return { message, grouped, daySeparator: newDay ? formatDayLabel(message.createdAt) : null }
  })
})

const showJump = computed(() => !isAtBottom.value && (state.value?.messages.length ?? 0) > 0)

function measureBottom (): boolean {
  const el = scrollRef.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD
}

function scrollToBottom (smooth = false) {
  const el = scrollRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  pendingNew.value = 0
}

async function loadOlderKeepingPosition () {
  const el = scrollRef.value
  if (!el) return
  const prevHeight = el.scrollHeight
  const prevTop = el.scrollTop
  await chatStore.loadOlder(props.channelKey)
  await nextTick()
  el.scrollTop = el.scrollHeight - prevHeight + prevTop
}

function onScroll () {
  const atBottom = measureBottom()
  if (atBottom !== isAtBottom.value) {
    isAtBottom.value = atBottom
    chatStore.setAtBottom(props.channelKey, atBottom)
  }
  if (atBottom) pendingNew.value = 0
  const el = scrollRef.value
  if (el && el.scrollTop < TOP_THRESHOLD && state.value?.hasMore && !state.value.loading) {
    loadOlderKeepingPosition()
  }
}

// Перше завантаження — одразу до низу.
watch(
  () => state.value?.loaded,
  async (loaded) => {
    if (!loaded) return
    await nextTick()
    scrollToBottom()
  },
  { immediate: true }
)

// Нове повідомлення в кінці: тримаємось низу, якщо там були (або якщо пишемо самі), інакше рахуємо.
watch(
  () => state.value?.messages.at(-1)?.id,
  async (lastId, prevId) => {
    if (!lastId || lastId === prevId || !state.value?.loaded) return
    const last = state.value.messages.at(-1)
    const wasAtBottom = isAtBottom.value
    await nextTick()
    if (wasAtBottom || last?.author.id === chatStore.selfId) scrollToBottom()
    else pendingNew.value++
  }
)

onMounted(() => chatStore.setAtBottom(props.channelKey, true))
</script>

<style scoped>
.chat-list-wrap {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.chat-list {
  flex: 1;
  min-height: 0;
  padding: 8px 0 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.chat-list__older {
  padding: 4px 0 8px;
  font-size: 11px;
  text-align: center;
  color: var(--ds-text-faint);
}

.chat-list__state {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  font-size: 13px;
  text-align: center;
  color: var(--ds-text-faint);
}

.chat-list__day {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 14px 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.chat-list__day::before,
.chat-list__day::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ds-border-neutral);
}

.chat-list__jump {
  position: absolute;
  left: 50%;
  bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-primary-contrast);
  background: var(--ds-primary);
  box-shadow: var(--ds-elevation-2), var(--ds-glow-primary-soft);
  transform: translateX(-50%);
}

.chat-jump-enter-active,
.chat-jump-leave-active {
  transition: opacity 150ms ease, transform 180ms var(--ds-ease-out);
}

.chat-jump-enter-from,
.chat-jump-leave-to {
  opacity: 0;
  transform: translate(-50%, 6px);
}
</style>
