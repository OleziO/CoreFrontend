<template>
  <Transition name="chat-panel">
    <section
      v-if="chatStore.isOpen"
      id="site-chat-panel"
      class="chat-panel"
      :class="{ 'is-mobile': isMobile, 'is-interacting': interacting }"
      :style="panelStyle"
      role="dialog"
      aria-modal="false"
      aria-label="Чат"
      @keydown.esc="chatStore.close()"
    >
      <header
        class="chat-panel__header"
        :title="isMobile ? undefined : 'Перетягніть, щоб перемістити · подвійний клік — на місце'"
        @pointerdown="startDrag"
        @dblclick="resetGeometry"
      >
        <PhChatsCircle :size="18" weight="duotone" class="shrink-0 text-primary" />
        <h2 class="chat-panel__title">Чат</h2>
        <span
          class="chat-panel__status"
          :class="chatStore.connected ? 'is-online' : 'is-offline'"
          :title="chatStore.connected ? 'Підключено' : 'Підключення…'"
        />
        <span v-if="!chatStore.connected" class="chat-panel__status-label">підключення…</span>
        <PhDotsSixVertical v-if="!isMobile" :size="16" class="chat-panel__grip" aria-hidden="true" />
        <button type="button" class="chat-panel__icon-btn ml-auto" aria-label="Закрити чат" @click="chatStore.close()">
          <PhX :size="16" weight="bold" />
        </button>
      </header>

      <ChatTabs />

      <div class="chat-panel__body">
        <ChatAdminThreads v-if="showThreadList" />
        <ChatChannelView
          v-else-if="chatStore.activeChannelKey"
          :key="chatStore.activeChannelKey"
          :channel-key="chatStore.activeChannelKey"
        />
      </div>

      <template v-if="!isMobile">
        <span
          v-for="dir in resizeDirections"
          :key="dir"
          class="chat-panel__resize"
          :class="`is-${dir}`"
          aria-hidden="true"
          @pointerdown="startResize($event, dir)"
        />
      </template>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { PhChatsCircle, PhDotsSixVertical, PhX } from '@phosphor-icons/vue'
import { useChatStore } from '@/features/chat/chat.store'
import { useChatPanel, type TResizeDirection } from '@/features/chat/composables/use-chat-panel'
import ChatTabs from '@/features/chat/components/ChatTabs.vue'
import ChatAdminThreads from '@/features/chat/components/ChatAdminThreads.vue'
import ChatChannelView from '@/features/chat/components/ChatChannelView.vue'

const chatStore = useChatStore()
const { isMobile, panelStyle, interacting, startDrag, startResize, resetGeometry } = useChatPanel()

const resizeDirections: TResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

/** Адмін у вкладці «Адмін» без вибраного треду бачить список звернень. */
const showThreadList = computed(() => chatStore.currentTab === 'admin' && chatStore.isAdmin && !chatStore.selectedAdminThread)
</script>

<style scoped>
.chat-panel {
  position: fixed;
  z-index: 60;
  display: flex;
  flex-direction: column;
  /* Без overflow: hidden — інакше заокруглені кути обрізають ручки зміни розміру. */
  border-radius: 12px;
  border: 1px solid var(--ds-border-strong);
  background:
    radial-gradient(ellipse 260px 120px at 0% 0%, rgba(var(--ds-primary-rgb), 0.07), transparent 70%),
    rgba(13, 15, 28, 0.97);
  box-shadow: var(--ds-elevation-4), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transform-origin: bottom right;
}

.chat-panel.is-interacting {
  user-select: none;
}

/* Телефон: повноекранний лист поверх сторінки, з урахуванням вирізу й домашньої смуги. */
.chat-panel.is-mobile {
  inset: 0;
  border-radius: 0;
  border: none;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  transform-origin: bottom center;
}

.chat-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  flex-shrink: 0;
  padding: 0 8px 0 14px;
  border-bottom: 1px solid var(--ds-border-neutral);
  cursor: grab;
  touch-action: none;
}

.chat-panel.is-interacting .chat-panel__header {
  cursor: grabbing;
}

.chat-panel.is-mobile .chat-panel__header {
  cursor: default;
  touch-action: auto;
}

.chat-panel__title {
  margin: 0;
  font-family: var(--ds-font-display);
  font-size: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ds-text-strong);
}

.chat-panel__status {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
}

.chat-panel__status.is-online {
  background: var(--ds-success);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

.chat-panel__status.is-offline {
  background: var(--ds-warning);
}

.chat-panel__status-label {
  font-size: 11px;
  color: var(--ds-text-faint);
}

.chat-panel__grip {
  color: var(--ds-text-faint);
}

.chat-panel__icon-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--ds-text-muted);
  transition: background-color var(--ds-duration-fast) ease, color var(--ds-duration-fast) ease;
}

@media (hover: hover) {
  .chat-panel__icon-btn:hover {
    color: var(--ds-text-strong);
    background: rgba(255, 255, 255, 0.06);
  }
}

.chat-panel__icon-btn:focus-visible {
  outline: 2px solid var(--ds-primary);
  outline-offset: -2px;
}

.chat-panel__body {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 0 12px 12px;
}

.chat-panel.is-mobile .chat-panel__body {
  border-radius: 0;
}

/* Невидимі ручки зміни розміру по краях і в кутах. */
.chat-panel__resize {
  position: absolute;
  z-index: 2;
  touch-action: none;
}

.chat-panel__resize.is-n,
.chat-panel__resize.is-s {
  left: 12px;
  right: 12px;
  height: 6px;
  cursor: ns-resize;
}

.chat-panel__resize.is-e,
.chat-panel__resize.is-w {
  top: 12px;
  bottom: 12px;
  width: 6px;
  cursor: ew-resize;
}

.chat-panel__resize.is-n { top: -3px; }
.chat-panel__resize.is-s { bottom: -3px; }
.chat-panel__resize.is-e { right: -3px; }
.chat-panel__resize.is-w { left: -3px; }

.chat-panel__resize.is-ne,
.chat-panel__resize.is-nw,
.chat-panel__resize.is-se,
.chat-panel__resize.is-sw {
  width: 14px;
  height: 14px;
}

.chat-panel__resize.is-nw { top: -3px; left: -3px; cursor: nwse-resize; }
.chat-panel__resize.is-se { bottom: -3px; right: -3px; cursor: nwse-resize; }
.chat-panel__resize.is-ne { top: -3px; right: -3px; cursor: nesw-resize; }
.chat-panel__resize.is-sw { bottom: -3px; left: -3px; cursor: nesw-resize; }

.chat-panel-enter-active {
  transition: opacity 180ms ease, transform 220ms var(--ds-ease-out);
}

.chat-panel-leave-active {
  transition: opacity 140ms ease, transform 160ms ease;
}

.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .chat-panel-enter-active,
  .chat-panel-leave-active {
    transition: opacity 120ms ease;
  }

  .chat-panel-enter-from,
  .chat-panel-leave-to {
    transform: none;
  }
}
</style>
