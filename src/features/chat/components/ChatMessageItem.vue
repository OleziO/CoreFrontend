<template>
  <article
    class="chat-msg"
    :class="{ 'is-grouped': grouped, 'is-mention': mentionsMe }"
    :aria-label="`${authorName}, ${formatMessageFull(message.createdAt)}`"
  >
    <RouterLink
      v-if="!grouped"
      :to="{ name: routeNames.player, params: { id: message.author.id } }"
      class="chat-msg__avatar no-underline"
      :title="`Профіль ${authorName}`"
    >
      <ChatAvatar :player="message.author" :size="32" />
    </RouterLink>
    <time
      v-else
      class="chat-msg__gutter-time"
      :datetime="message.createdAt"
      :title="formatMessageFull(message.createdAt)"
    >
      {{ formatMessageTime(message.createdAt) }}
    </time>

    <div class="chat-msg__main">
      <div v-if="!grouped" class="chat-msg__meta">
        <button
          v-if="canMessageAuthor"
          type="button"
          class="chat-msg__author is-action"
          :title="`Написати ${authorName} приватно`"
          @click="chatStore.openDirect(message.author)"
        >
          {{ authorName }}
        </button>
        <span v-else class="chat-msg__author" :class="{ 'is-self': isMine }">{{ authorName }}</span>
        <span v-if="message.author.isAdmin" class="chat-msg__role">Адмін</span>
        <time class="chat-msg__time" :datetime="message.createdAt" :title="formatMessageFull(message.createdAt)">
          {{ formatMessageTime(message.createdAt) }}
        </time>
      </div>
      <ChatMessageBody
        :body="message.body"
        :mentions="message.mentions"
        :online-mention-ids="isPublicChannel(message.channelKind) ? message.onlineMentionIds ?? [] : null"
      />
    </div>

    <el-popconfirm
      v-if="canDelete"
      title="Видалити повідомлення для всіх?"
      confirm-button-text="Видалити"
      cancel-button-text="Скасувати"
      confirm-button-type="danger"
      :width="220"
      @confirm="chatStore.removeMessage(message.id)"
    >
      <template #reference>
        <button type="button" class="chat-msg__delete" aria-label="Видалити повідомлення" title="Видалити">
          <PhTrash :size="14" />
        </button>
      </template>
    </el-popconfirm>
  </article>
</template>

<script setup lang="ts">
import { PhTrash } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import type { TChatMessage } from '@/api/types/api.types'
import { useChatStore } from '@/features/chat/chat.store'
import {
  formatMessageFull,
  formatMessageTime,
  isPublicChannel,
  mentionsPlayer,
  playerName
} from '@/features/chat/chat.utils'
import ChatMessageBody from '@/features/chat/components/ChatMessageBody.vue'
import ChatAvatar from '@/features/chat/components/ChatAvatar.vue'

const props = defineProps<{
  message: TChatMessage
  /** Продовження серії того ж автора — без аватара й імені. */
  grouped: boolean
}>()

const chatStore = useChatStore()

const authorName = computed(() => playerName(props.message.author))
const isMine = computed(() => props.message.author.id === chatStore.selfId)
const mentionsMe = computed(() => mentionsPlayer(props.message, chatStore.selfId))
/** Клік по імені відкриває приватний чат — лише в публічних каналах і не з собою. */
const canMessageAuthor = computed(() =>
  chatStore.isLoggedIn && !isMine.value && isPublicChannel(props.message.channelKind)
)
const canDelete = computed(() => chatStore.isAdmin && isPublicChannel(props.message.channelKind))
</script>

<style scoped>
.chat-msg {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 6px 14px 2px;
}

.chat-msg.is-grouped {
  padding-top: 1px;
}

.chat-msg.is-mention {
  background: linear-gradient(90deg, rgba(var(--ds-gold-rgb), 0.1), transparent 70%);
  box-shadow: inset 2px 0 0 var(--ds-gold);
}

@media (hover: hover) {
  .chat-msg:hover {
    background-color: rgba(255, 255, 255, 0.025);
  }
}

.chat-msg__avatar {
  flex-shrink: 0;
  height: 32px;
  border-radius: 9999px;
}

.chat-msg__avatar:focus-visible {
  outline: 2px solid var(--ds-primary);
  outline-offset: 2px;
}

.chat-msg__gutter-time {
  flex-shrink: 0;
  width: 32px;
  padding-top: 3px;
  font-size: 9px;
  text-align: center;
  color: var(--ds-text-faint);
  opacity: 0;
  transition: opacity var(--ds-duration-fast) ease;
}

.chat-msg:hover .chat-msg__gutter-time {
  opacity: 1;
}

.chat-msg__main {
  min-width: 0;
  flex: 1;
}

.chat-msg__meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.chat-msg__author {
  overflow: hidden;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--ds-text-strong);
}

.chat-msg__author.is-self {
  color: var(--ds-primary);
}

.chat-msg__author.is-action {
  cursor: pointer;
}

@media (hover: hover) {
  .chat-msg__author.is-action:hover {
    color: var(--ds-primary);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
}

.chat-msg__author.is-action:focus-visible {
  outline: 2px solid var(--ds-primary);
  outline-offset: 1px;
  border-radius: 3px;
}

.chat-msg__role {
  flex-shrink: 0;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  line-height: 15px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fecaca;
  background: rgba(185, 28, 28, 0.35);
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.chat-msg__time {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--ds-text-faint);
}

.chat-msg__delete {
  position: absolute;
  top: 4px;
  right: 8px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: var(--ds-text-faint);
  background: var(--ds-elevated-surface);
  border: 1px solid var(--ds-border-neutral);
  opacity: 0;
  transition: opacity var(--ds-duration-fast) ease, color var(--ds-duration-fast) ease;
}

.chat-msg:hover .chat-msg__delete,
.chat-msg__delete:focus-visible {
  opacity: 1;
}

/* Тач-пристрої без hover: кнопка видна завжди, але приглушена. */
@media (hover: none) {
  .chat-msg__delete {
    opacity: 0.7;
  }
}

@media (hover: hover) {
  .chat-msg__delete:hover {
    color: var(--ds-error);
  }
}
</style>
