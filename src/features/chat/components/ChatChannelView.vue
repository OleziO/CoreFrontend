<template>
  <div class="chat-view">
    <!-- Контекст каналу: з ким розмова або хто бачить повідомлення -->
    <div v-if="kind === 'dm' && peer" class="chat-view__context">
      <RouterLink :to="{ name: routeNames.player, params: { id: peer.id } }" class="chat-view__peer no-underline">
        <ChatAvatar :player="peer" :size="22" />
        <span class="chat-view__peer-name">{{ playerName(peer) }}</span>
      </RouterLink>
      <span class="chat-view__presence" :class="{ 'is-online': chatStore.isOnline(peer.id) }">
        {{ chatStore.isOnline(peer.id) ? 'онлайн' : 'не в мережі' }}
      </span>
    </div>

    <div v-else-if="kind === 'admin' && chatStore.isAdmin && isForeignThread" class="chat-view__context">
      <button type="button" class="chat-view__back" @click="chatStore.openAdminThread(null)">
        <PhArrowLeft :size="14" weight="bold" />
        Звернення
      </button>
      <RouterLink
        v-if="threadOwner"
        :to="{ name: routeNames.player, params: { id: threadOwner.id } }"
        class="chat-view__peer no-underline"
      >
        <ChatAvatar :player="threadOwner" :size="22" />
        <span class="chat-view__peer-name">{{ playerName(threadOwner) }}</span>
      </RouterLink>
      <span v-if="threadOwner" class="chat-view__presence" :class="{ 'is-online': chatStore.isOnline(threadOwner.id) }">
        {{ chatStore.isOnline(threadOwner.id) ? 'онлайн' : 'не в мережі' }}
      </span>
    </div>

    <p v-else-if="hint" class="chat-view__hint">
      <component :is="hint.icon" :size="14" weight="duotone" class="shrink-0" />
      {{ hint.text }}
    </p>

    <ChatMessageList :channel-key="channelKey" />

    <div class="chat-view__typing" aria-live="polite">
      <template v-if="typingLabel">
        <span class="chat-view__typing-dots" aria-hidden="true"><i /><i /><i /></span>
        {{ typingLabel }}
      </template>
    </div>

    <ChatComposer :channel-key="channelKey" />
  </div>
</template>

<script setup lang="ts">
import { PhArrowLeft, PhCrown, PhDiamond, PhLockSimple, PhShieldCheck } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import type { TChatPlayer } from '@/api/types/api.types'
import { useChatStore } from '@/features/chat/chat.store'
import { channelKindOf, playerName } from '@/features/chat/chat.utils'
import ChatMessageList from '@/features/chat/components/ChatMessageList.vue'
import ChatComposer from '@/features/chat/components/ChatComposer.vue'
import ChatAvatar from '@/features/chat/components/ChatAvatar.vue'

const props = defineProps<{
  channelKey: string
}>()

const chatStore = useChatStore()

const kind = computed(() => channelKindOf(props.channelKey))
const peer = computed(() => chatStore.directTabOf(props.channelKey)?.peer ?? null)
const ownerId = computed(() => (kind.value === 'admin' ? props.channelKey.split(':')[1] : null))
const isForeignThread = computed(() => !!ownerId.value && ownerId.value !== chatStore.selfId)

const threadOwner = computed<TChatPlayer | null>(() => {
  if (kind.value !== 'admin') return null
  const fromList = chatStore.adminThreads.find(t => t.channelKey === props.channelKey)?.owner
  if (fromList) return fromList
  return chatStore.channels[props.channelKey]?.messages.find(m => m.threadOwner)?.threadOwner ?? null
})

const hint = computed(() => {
  if (kind.value === 'captains') return { icon: PhCrown, text: 'Канал капітанів команд — бачать лише капітани та адміни' }
  if (kind.value === 'vip') return { icon: PhDiamond, text: 'Закритий канал VIP-гравців — бачать лише VIP та адміни' }
  if (kind.value === 'admin') return { icon: PhShieldCheck, text: 'Приватний канал з адміністрацією — бачите лише ви та адміни' }
  if (kind.value === 'dm') return { icon: PhLockSimple, text: 'Приватні повідомлення' }
  return null
})

const typingLabel = computed(() => {
  const event = chatStore.typing[props.channelKey]
  if (!event || event.playerId === chatStore.selfId) return ''
  if (kind.value === 'admin' && event.isAdmin && !chatStore.isAdmin) return 'Адміністрація пише…'
  if (kind.value === 'dm' && peer.value) return `${playerName(peer.value)} пише…`
  if (kind.value === 'admin' && threadOwner.value && event.playerId === threadOwner.value.id) {
    return `${playerName(threadOwner.value)} пише…`
  }
  return 'Пише…'
})
</script>

<style scoped>
.chat-view {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.chat-view__context {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-height: 38px;
  padding: 6px 14px;
  border-bottom: 1px solid var(--ds-border-neutral);
}

.chat-view__peer {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--ds-text-strong);
}

.chat-view__peer-name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@media (hover: hover) {
  .chat-view__peer:hover .chat-view__peer-name {
    color: var(--ds-primary);
  }
}

.chat-view__presence {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--ds-text-faint);
}

.chat-view__presence.is-online {
  color: var(--ds-success);
}

.chat-view__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-primary);
  transition: background-color var(--ds-duration-fast) ease;
}

@media (hover: hover) {
  .chat-view__back:hover {
    background: rgba(var(--ds-primary-rgb), 0.08);
  }
}

.chat-view__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin: 0;
  padding: 7px 14px;
  font-size: 11px;
  color: var(--ds-text-faint);
  border-bottom: 1px solid var(--ds-border-neutral);
}

.chat-view__typing {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 18px;
  padding: 0 14px;
  font-size: 11px;
  color: var(--ds-text-faint);
}

.chat-view__typing-dots {
  display: inline-flex;
  gap: 2px;
}

.chat-view__typing-dots i {
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: currentColor;
  animation: chat-typing 1s ease-in-out infinite;
}

.chat-view__typing-dots i:nth-child(2) { animation-delay: 0.15s; }
.chat-view__typing-dots i:nth-child(3) { animation-delay: 0.3s; }

@keyframes chat-typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-2px); }
}

@media (prefers-reduced-motion: reduce) {
  .chat-view__typing-dots i {
    animation: none;
  }
}
</style>
