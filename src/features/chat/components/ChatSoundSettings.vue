<template>
  <el-popover
    v-model:visible="open"
    trigger="click"
    placement="bottom-end"
    :width="250"
    popper-class="chat-sound-popper"
    :teleported="true"
  >
    <template #reference>
      <button
        type="button"
        class="chat-sound__trigger"
        :class="{ 'is-muted': !settings.enabled }"
        :aria-label="settings.enabled ? 'Звуки чату' : 'Звуки чату вимкнено'"
        :title="settings.enabled ? 'Звуки чату' : 'Звуки чату вимкнено'"
      >
        <PhSpeakerHigh v-if="settings.enabled" :size="16" weight="bold" />
        <PhSpeakerSlash v-else :size="16" weight="bold" />
      </button>
    </template>

    <div class="chat-sound">
      <div class="chat-sound__row is-master">
        <span class="chat-sound__label">Звуки повідомлень</span>
        <el-switch :model-value="settings.enabled" size="small" @change="v => chatStore.setSoundEnabled(!!v)" />
      </div>

      <ul class="chat-sound__list" :class="{ 'is-disabled': !settings.enabled }">
        <li v-for="item in kinds" :key="item.kind" class="chat-sound__row">
          <button
            type="button"
            class="chat-sound__preview"
            :aria-label="`Прослухати: ${item.label}`"
            title="Прослухати"
            @click="chatStore.previewSound(item.kind)"
          >
            <PhPlay :size="11" weight="fill" />
          </button>
          <span class="chat-sound__label">{{ item.label }}</span>
          <el-switch
            :model-value="settings.kinds[item.kind]"
            :disabled="!settings.enabled"
            size="small"
            @change="v => chatStore.setSoundKind(item.kind, !!v)"
          />
        </li>
      </ul>

      <p class="chat-sound__hint">Не звучить у каналі, який ви зараз читаєте.</p>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { PhPlay, PhSpeakerHigh, PhSpeakerSlash } from '@phosphor-icons/vue'
import { useChatStore } from '@/features/chat/chat.store'
import type { TChatSoundKind } from '@/features/chat/chat.d'

const chatStore = useChatStore()
const settings = computed(() => chatStore.soundSettings)
const open = ref(false)

const kinds: { kind: TChatSoundKind; label: string }[] = [
  { kind: 'general', label: 'Загальний' },
  { kind: 'captains', label: 'Капітани' },
  { kind: 'duel', label: 'Дуелі' },
  { kind: 'admin', label: 'Адмін' },
  { kind: 'dm', label: 'Приватні' },
  { kind: 'mention', label: 'Згадки (@ви)' }
]
</script>

<style scoped>
.chat-sound__trigger {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--ds-text-muted);
  transition: background-color var(--ds-duration-fast) ease, color var(--ds-duration-fast) ease;
}

.chat-sound__trigger.is-muted {
  color: var(--ds-text-faint);
}

@media (hover: hover) {
  .chat-sound__trigger:hover {
    color: var(--ds-text-strong);
    background: rgba(255, 255, 255, 0.06);
  }
}

.chat-sound__trigger:focus-visible,
.chat-sound__preview:focus-visible {
  outline: 2px solid var(--ds-primary);
  outline-offset: -2px;
}

.chat-sound__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

.chat-sound__row.is-master {
  padding-bottom: 6px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--ds-border-neutral);
}

.chat-sound__row.is-master .chat-sound__label {
  font-weight: 600;
  color: var(--ds-text-strong);
}

.chat-sound__label {
  flex: 1;
  font-size: 13px;
  color: var(--ds-text-muted);
}

.chat-sound__list {
  margin: 0;
  padding: 0;
  list-style: none;
  transition: opacity var(--ds-duration-fast) ease;
}

.chat-sound__list.is-disabled {
  opacity: 0.5;
}

.chat-sound__preview {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.05);
  transition: background-color var(--ds-duration-fast) ease, color var(--ds-duration-fast) ease;
}

@media (hover: hover) {
  .chat-sound__preview:hover {
    color: var(--ds-primary);
    background: rgba(var(--ds-primary-rgb), 0.12);
  }
}

.chat-sound__hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--ds-text-faint);
}
</style>
