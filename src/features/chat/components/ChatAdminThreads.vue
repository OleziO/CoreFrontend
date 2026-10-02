<template>
  <div class="chat-threads">
    <p class="chat-threads__hint">
      <PhShieldCheck :size="14" weight="duotone" class="shrink-0" />
      Звернення гравців до адміністрації — бачать усі адміни
    </p>

    <div v-if="chatStore.adminThreadsLoading && !chatStore.adminThreadsLoaded" class="chat-threads__state">
      Завантаження…
    </div>
    <div v-else-if="!chatStore.adminThreads.length" class="chat-threads__state">
      <PhChatsCircle :size="28" weight="duotone" class="text-primary/60" />
      Звернень поки немає
    </div>

    <ul v-else class="chat-threads__list">
      <li v-for="thread in chatStore.adminThreads" :key="thread.channelKey">
        <button type="button" class="chat-thread" @click="chatStore.openAdminThread(thread.channelKey)">
          <ChatAvatar :player="thread.owner" :size="36" :online="chatStore.isOnline(thread.owner.id)" />
          <span class="chat-thread__main">
            <span class="chat-thread__top">
              <span class="chat-thread__name">{{ playerName(thread.owner) }}</span>
              <time class="chat-thread__time" :datetime="thread.lastMessage.createdAt">
                {{ formatWhen(thread.lastMessage.createdAt) }}
              </time>
            </span>
            <span class="chat-thread__preview">
              <template v-if="thread.lastMessage.author.id !== thread.owner.id">
                <span class="text-primary">{{ replyAuthor(thread.lastMessage.author) }}:</span>
              </template>
              {{ thread.lastMessage.body }}
            </span>
          </span>
          <span v-if="thread.unread" class="chat-thread__badge">{{ thread.unread > 99 ? '99+' : thread.unread }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { PhChatsCircle, PhShieldCheck } from '@phosphor-icons/vue'
import type { TChatPlayer } from '@/api/types/api.types'
import { useChatStore } from '@/features/chat/chat.store'
import { formatDayLabel, formatMessageTime, isSameDay, playerName } from '@/features/chat/chat.utils'
import ChatAvatar from '@/features/chat/components/ChatAvatar.vue'

const chatStore = useChatStore()

function replyAuthor (author: TChatPlayer): string {
  return author.id === chatStore.selfId ? 'Ви' : playerName(author)
}

function formatWhen (iso: string): string {
  return isSameDay(iso, new Date().toISOString()) ? formatMessageTime(iso) : formatDayLabel(iso)
}
</script>

<style scoped>
.chat-threads {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.chat-threads__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 8px 14px;
  font-size: 11px;
  color: var(--ds-text-faint);
  border-bottom: 1px solid var(--ds-border-neutral);
}

.chat-threads__state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.chat-threads__list {
  flex: 1;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  list-style: none;
}

.chat-thread {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px;
  border-radius: 10px;
  text-align: left;
  transition: background-color var(--ds-duration-fast) ease;
}

@media (hover: hover) {
  .chat-thread:hover {
    background: rgba(255, 255, 255, 0.04);
  }
}

.chat-thread:focus-visible {
  outline: 2px solid var(--ds-primary);
  outline-offset: -2px;
}

.chat-thread__main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.chat-thread__top {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.chat-thread__name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--ds-text-strong);
}

.chat-thread__time {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--ds-text-faint);
}

.chat-thread__preview {
  overflow: hidden;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--ds-text-muted);
}

.chat-thread__badge {
  flex-shrink: 0;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  color: #fff;
  background: var(--ds-pink);
}
</style>
