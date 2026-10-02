<template>
  <p class="chat-body">
    <template v-for="(segment, i) in segments" :key="i">
      <a
        v-if="segment.type === 'link'"
        :href="segment.href"
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        class="chat-body__link"
      >{{ segment.text }}</a>
      <RouterLink
        v-else-if="segment.type === 'mention'"
        :to="{ name: routeNames.player, params: { id: segment.playerId } }"
        class="chat-body__mention no-underline"
        :class="{ 'is-me': segment.playerId === chatStore.selfId }"
      >
        <span>{{ segment.text }}</span>
      </RouterLink>
      <span
        v-else-if="segment.type === 'command'"
        class="chat-body__mention is-command"
        :class="{ 'is-me': onlineTaggedMe }"
        :title="onlineTitle"
      >{{ segment.text }}</span>
      <template v-else>{{ segment.text }}</template>
    </template>
  </p>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import type { TChatPlayer } from '@/api/types/api.types'
import { useChatStore } from '@/features/chat/chat.store'
import { parseMessageBody } from '@/features/chat/chat.utils'

const props = defineProps<{
  body: string
  mentions: TChatPlayer[]
  /** Кого тегнув `@online`; `null` — канал без команд (приватний), `@online` там звичайний текст. */
  onlineMentionIds?: string[] | null
}>()

const chatStore = useChatStore()

/** Текст рендериться інтерполяцією (екранується Vue) — HTML з повідомлення ніколи не виконується. */
const segments = computed(() => parseMessageBody(props.body, props.mentions, !!props.onlineMentionIds))

const onlineTaggedMe = computed(() => !!chatStore.selfId && !!props.onlineMentionIds?.includes(chatStore.selfId))
const onlineTitle = computed(() =>
  `@online — тег усіх, хто був на сайті в момент надсилання (${props.onlineMentionIds?.length ?? 0})`
)
</script>

<style scoped>
.chat-body {
  margin: 1px 0 0;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--ds-text);
}

.chat-body__link {
  color: var(--ds-primary);
  text-decoration: underline;
  text-decoration-color: rgba(var(--ds-primary-rgb), 0.4);
  text-underline-offset: 2px;
}

@media (hover: hover) {
  .chat-body__link:hover {
    text-decoration-color: var(--ds-primary);
  }
}

.chat-body__mention {
  padding: 0 3px;
  border-radius: 4px;
  font-weight: 600;
  color: var(--ds-primary);
  background: rgba(var(--ds-primary-rgb), 0.12);
}

.chat-body__mention.is-command {
  cursor: help;
}

.chat-body__mention.is-me {
  color: var(--ds-gold);
  background: rgba(var(--ds-gold-rgb), 0.16);
}
</style>
