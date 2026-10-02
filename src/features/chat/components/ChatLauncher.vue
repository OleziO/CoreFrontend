<template>
  <button
    v-show="!(chatStore.isOpen && isMobile)"
    type="button"
    class="chat-launcher"
    :class="{ 'is-open': chatStore.isOpen }"
    :aria-label="label"
    :aria-expanded="chatStore.isOpen"
    aria-controls="site-chat-panel"
    @click="chatStore.toggle()"
  >
    <Transition name="chat-launcher-icon" mode="out-in">
      <PhX v-if="chatStore.isOpen" key="close" :size="24" weight="bold" />
      <PhChatsCircle v-else key="open" :size="28" weight="duotone" />
    </Transition>

    <span v-if="!chatStore.isOpen && badge.count" class="chat-launcher__badge" aria-hidden="true">
      {{ badge.count > 99 ? '99+' : badge.count }}
    </span>
    <span v-else-if="!chatStore.isOpen && badge.dot" class="chat-launcher__dot" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { PhChatsCircle, PhX } from '@phosphor-icons/vue'
import { useChatStore } from '@/features/chat/chat.store'

const chatStore = useChatStore()
const { width } = useWindowSize()

const isMobile = computed(() => width.value < 768)
const badge = computed(() => chatStore.totalBadge)
const label = computed(() => {
  if (chatStore.isOpen) return 'Закрити чат'
  return badge.value.count ? `Відкрити чат, непрочитаних: ${badge.value.count}` : 'Відкрити чат'
})
</script>

<style scoped>
.chat-launcher {
  position: fixed;
  right: 16px;
  /* Над таббаром (64px, < lg) або над смугою футера (56px, lg+). */
  bottom: calc(64px + 16px + env(safe-area-inset-bottom));
  z-index: 60;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 9999px;
  color: var(--ds-primary-contrast);
  background: linear-gradient(145deg, var(--ds-primary) 0%, #7cf0ff 100%);
  box-shadow: var(--ds-elevation-3), var(--ds-glow-primary-soft);
  transition:
    transform var(--ds-duration-press) var(--ds-ease-out),
    box-shadow var(--ds-duration-base) ease,
    background var(--ds-duration-base) ease;
}

@screen lg {
  .chat-launcher {
    right: 24px;
    bottom: calc(56px + 16px);
  }
}

@media (hover: hover) {
  .chat-launcher:hover {
    box-shadow: var(--ds-elevation-3), var(--ds-glow-primary);
  }
}

.chat-launcher:active {
  transform: scale(0.94);
}

.chat-launcher:focus-visible {
  outline: 2px solid var(--ds-primary);
  outline-offset: 3px;
}

.chat-launcher.is-open {
  color: var(--ds-text-strong);
  background: var(--ds-elevated-surface);
  border: 1px solid var(--ds-border-strong);
}

.chat-launcher__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 22px;
  color: #fff;
  background: var(--ds-pink);
  box-shadow: 0 0 0 2px var(--ds-background), var(--ds-glow-pink);
}

.chat-launcher__dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  background: var(--ds-pink);
  box-shadow: 0 0 0 2px var(--ds-background);
}

.chat-launcher-icon-enter-active,
.chat-launcher-icon-leave-active {
  transition: opacity 120ms ease, transform 160ms var(--ds-ease-out);
}

.chat-launcher-icon-enter-from,
.chat-launcher-icon-leave-to {
  opacity: 0;
  transform: rotate(-45deg) scale(0.7);
}

@media (prefers-reduced-motion: reduce) {
  .chat-launcher,
  .chat-launcher-icon-enter-active,
  .chat-launcher-icon-leave-active {
    transition: none;
  }
}
</style>
