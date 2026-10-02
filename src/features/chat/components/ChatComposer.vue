<template>
  <div v-if="!chatStore.isLoggedIn" class="chat-composer__notice">
    <PhSignIn :size="16" class="shrink-0" />
    <span>Увійдіть, щоб писати в чат</span>
    <el-button
      size="small"
      type="primary"
      class="ml-auto"
      :loading="authStore.loginLoading"
      @click="authStore.startDiscordLogin()"
    >
      Увійти
    </el-button>
  </div>

  <div v-else-if="!canWrite" class="chat-composer__notice">
    <PhLockSimple :size="16" class="shrink-0" />
    <span>Ви можете лише читати чат. Питання — у вкладці «Адмін».</span>
  </div>

  <form v-else class="chat-composer" @submit.prevent="submit">
    <ul v-if="mentions.isOpen.value" class="chat-composer__mentions" role="listbox" aria-label="Згадати гравця">
      <li
        v-for="(item, i) in mentions.suggestions.value"
        :key="item.type === 'command' ? `cmd:${item.name}` : item.player.id"
        class="chat-composer__mention"
        :class="{ 'is-highlighted': i === mentions.highlighted.value }"
        role="option"
        :aria-selected="i === mentions.highlighted.value"
        @mouseenter="mentions.highlighted.value = i"
        @mousedown.prevent="applyMention(item)"
      >
        <template v-if="item.type === 'command'">
          <span class="chat-composer__command-icon"><PhUsersThree :size="13" weight="bold" /></span>
          <span class="chat-composer__command">
            <span class="chat-composer__command-name">@{{ item.name }}</span>
            <span class="chat-composer__command-desc">{{ item.description }}</span>
          </span>
        </template>
        <template v-else>
          <ChatAvatar :player="item.player" :size="20" />
          <span class="truncate">{{ playerName(item.player) }}</span>
        </template>
      </li>
    </ul>

    <div class="chat-composer__field">
      <textarea
        ref="textareaRef"
        v-model="text"
        class="chat-composer__input"
        rows="1"
        :maxlength="CHAT_MESSAGE_MAX_LENGTH"
        :placeholder="placeholder"
        aria-label="Повідомлення"
        enterkeyhint="send"
        @input="onInput"
        @click="onCaretMove"
        @keyup.left.right="onCaretMove"
        @keydown="onKeydown"
        @blur="mentions.dismiss()"
      />
      <span
        v-if="text.length >= CHAT_COUNTER_FROM"
        class="chat-composer__counter"
        :class="{ 'is-limit': text.length >= CHAT_MESSAGE_MAX_LENGTH }"
      >
        {{ CHAT_MESSAGE_MAX_LENGTH - text.length }}
      </span>
      <button
        type="submit"
        class="chat-composer__send"
        :disabled="!canSend"
        aria-label="Надіслати"
        title="Надіслати (Enter)"
      >
        <PhPaperPlaneRight :size="18" weight="fill" />
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { PhLockSimple, PhPaperPlaneRight, PhSignIn, PhUsersThree } from '@phosphor-icons/vue'
import type { TChatMentionSuggestion } from '@/features/chat/chat.d'
import { useChatStore } from '@/features/chat/chat.store'
import { useChatMentions } from '@/features/chat/composables/use-chat-mentions'
import {
  CHAT_COUNTER_FROM,
  CHAT_MESSAGE_MAX_LENGTH,
  adminThreadKey,
  channelKindOf,
  isPublicChannel,
  playerName
} from '@/features/chat/chat.utils'
import ChatAvatar from '@/features/chat/components/ChatAvatar.vue'

const props = defineProps<{
  channelKey: string
}>()

const MAX_INPUT_HEIGHT = 120

const chatStore = useChatStore()
const authStore = useAuthStore()

const text = ref(chatStore.draftOf(props.channelKey))
const sending = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const kind = computed(() => channelKindOf(props.channelKey))
const channelKeyRef = computed(() => props.channelKey)
const mentionsEnabled = computed(() => isPublicChannel(kind.value))
const mentions = useChatMentions(channelKeyRef, mentionsEnabled)

/** Режим «лише читання» не забирає звернення до адміністрації. */
const canWrite = computed(() => {
  if (!chatStore.isLoggedIn) return false
  if (!chatStore.access.readOnly) return true
  return !!chatStore.selfId && props.channelKey === adminThreadKey(chatStore.selfId)
})
const canSend = computed(() => !sending.value && !!text.value.trim() && text.value.length <= CHAT_MESSAGE_MAX_LENGTH)

const placeholder = computed(() => {
  switch (kind.value) {
    case 'dm': return 'Приватне повідомлення…'
    case 'admin': return chatStore.isAdmin && props.channelKey !== adminThreadKey(chatStore.selfId ?? '') ? 'Відповідь гравцю…' : 'Повідомлення адміністрації…'
    default: return 'Повідомлення… (@ — згадати гравця)'
  }
})

watch(text, (value) => {
  chatStore.saveDraft(props.channelKey, value)
  nextTick(autosize)
})

function autosize () {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`
}

function onInput () {
  const el = textareaRef.value
  if (el) mentions.onInput(el.value, el.selectionStart ?? el.value.length)
  if (text.value.trim()) chatStore.notifyTyping(props.channelKey)
}

function onCaretMove () {
  const el = textareaRef.value
  if (el) mentions.onInput(el.value, el.selectionStart ?? el.value.length)
}

function applyMention (item: TChatMentionSuggestion) {
  const el = textareaRef.value
  const caret = el?.selectionStart ?? text.value.length
  const next = mentions.pick(item, text.value, caret)
  text.value = next.text
  nextTick(() => {
    el?.focus()
    el?.setSelectionRange(next.caret, next.caret)
  })
}

function onKeydown (event: KeyboardEvent) {
  if (mentions.onKeydown(event, applyMention)) {
    // Esc закриває лише підказки, а не весь чат.
    event.stopPropagation()
    return
  }
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    submit()
  }
}

async function submit () {
  if (!canSend.value) return
  const body = text.value.trim()
  sending.value = true
  const ok = await chatStore.send(props.channelKey, body, mentions.mentionIds(body))
  sending.value = false
  if (ok) {
    text.value = ''
    mentions.reset()
  }
  nextTick(() => textareaRef.value?.focus())
}

onMounted(() => {
  autosize()
  // На телефоні клавіатура не вискакує сама — фокус лише там, де є миша.
  if (window.matchMedia('(hover: hover)').matches) textareaRef.value?.focus()
})
</script>

<style scoped>
.chat-composer {
  position: relative;
  flex-shrink: 0;
  padding: 6px 10px 10px;
}

.chat-composer__field {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 6px 6px 6px 12px;
  border-radius: 10px;
  border: 1px solid var(--ds-border-neutral);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color var(--ds-duration-fast) ease, box-shadow var(--ds-duration-fast) ease;
}

.chat-composer__field:focus-within {
  border-color: var(--ds-border-strong);
  box-shadow: var(--ds-glow-primary-soft);
}

.chat-composer__input {
  flex: 1;
  min-width: 0;
  max-height: 120px;
  padding: 5px 0;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  /* 16px на телефонах — iOS не зумить сторінку при фокусі. */
  font-size: 16px;
  line-height: 1.4;
  color: var(--ds-text-strong);
}

@screen md {
  .chat-composer__input {
    font-size: 13px;
  }
}

.chat-composer__input::placeholder {
  color: var(--ds-text-faint);
}

.chat-composer__counter {
  flex-shrink: 0;
  padding-bottom: 8px;
  font-size: 10px;
  color: var(--ds-text-faint);
}

.chat-composer__counter.is-limit {
  color: var(--ds-error);
}

.chat-composer__send {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  color: var(--ds-primary-contrast);
  background: var(--ds-primary);
  transition: opacity var(--ds-duration-fast) ease, transform var(--ds-duration-press) var(--ds-ease-out);
}

.chat-composer__send:active:not(:disabled) {
  transform: scale(0.94);
}

.chat-composer__send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.chat-composer__send:focus-visible {
  outline: 2px solid var(--ds-primary);
  outline-offset: 2px;
}

.chat-composer__mentions {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: calc(100% - 2px);
  z-index: 3;
  max-height: 200px;
  margin: 0;
  padding: 4px;
  overflow-y: auto;
  list-style: none;
  border-radius: 10px;
  border: 1px solid var(--ds-border-strong);
  background: var(--ds-elevated-surface);
  box-shadow: var(--ds-elevation-3);
}

.chat-composer__mention {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--ds-text);
  cursor: pointer;
}

.chat-composer__mention.is-highlighted {
  background: rgba(var(--ds-primary-rgb), 0.12);
  color: var(--ds-text-strong);
}

.chat-composer__command-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  color: var(--ds-gold);
  background: rgba(var(--ds-gold-rgb), 0.16);
}

.chat-composer__command {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.chat-composer__command-name {
  font-weight: 600;
  color: var(--ds-text-strong);
}

.chat-composer__command-desc {
  font-size: 11px;
  color: var(--ds-text-muted);
}

.chat-composer__notice {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin: 6px 10px 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 12px;
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--ds-border-neutral);
}
</style>
