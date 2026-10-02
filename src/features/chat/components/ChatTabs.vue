<template>
  <div class="chat-tabs">
    <div ref="scrollerRef" class="chat-tabs__scroller" role="tablist" aria-label="Канали чату" @wheel="onWheel">
      <div
        v-for="tab in chatStore.tabs"
        :key="tab"
        :ref="el => setTabRef(tab, el)"
        class="chat-tab"
        :class="{ 'is-active': chatStore.currentTab === tab, 'is-direct': isDirect(tab) }"
        role="tab"
        :aria-selected="chatStore.currentTab === tab"
        :tabindex="chatStore.currentTab === tab ? 0 : -1"
        @click="chatStore.selectTab(tab)"
        @keydown.enter.prevent="chatStore.selectTab(tab)"
        @keydown.space.prevent="chatStore.selectTab(tab)"
        @auxclick.middle.prevent="isDirect(tab) && chatStore.closeDirect(tab)"
      >
        <template v-if="isDirect(tab)">
          <ChatAvatar :player="peerOf(tab)" :size="18" :online="chatStore.isOnline(peerOf(tab)?.id)" />
          <span class="chat-tab__label is-name">{{ playerName(peerOf(tab)) }}</span>
        </template>
        <template v-else>
          <component :is="fixedTabs[tab as TFixedTab].icon" :size="15" weight="duotone" class="shrink-0" />
          <span class="chat-tab__label">{{ fixedTabs[tab as TFixedTab].label }}</span>
        </template>

        <span v-if="badgeOf(tab).count" class="chat-tab__badge">{{ formatCount(badgeOf(tab).count) }}</span>
        <span v-else-if="badgeOf(tab).dot" class="chat-tab__dot" aria-label="нові повідомлення" />

        <button
          v-if="isDirect(tab)"
          type="button"
          class="chat-tab__close"
          :aria-label="`Закрити чат з ${playerName(peerOf(tab))}`"
          @click.stop="chatStore.closeDirect(tab)"
        >
          <PhX :size="11" weight="bold" />
        </button>
      </div>
    </div>

    <el-popover
      v-if="chatStore.isLoggedIn"
      v-model:visible="searchOpen"
      trigger="click"
      placement="bottom-end"
      :width="280"
      popper-class="chat-search-popper"
      :teleported="true"
    >
      <template #reference>
        <button type="button" class="chat-tabs__add" aria-label="Новий приватний чат" title="Написати гравцю">
          <PhPlus :size="15" weight="bold" />
        </button>
      </template>
      <ChatPlayerSearch v-if="searchOpen" @select="onPickPlayer" />
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { PhCrown, PhGlobeHemisphereEast, PhPlus, PhShieldCheck, PhSword, PhX } from '@phosphor-icons/vue'
import type { TChatPlayer } from '@/api/types/api.types'
import { useChatStore } from '@/features/chat/chat.store'
import { playerName } from '@/features/chat/chat.utils'
import type { TChatTabId } from '@/features/chat/chat.d'
import ChatPlayerSearch from '@/features/chat/components/ChatPlayerSearch.vue'
import ChatAvatar from '@/features/chat/components/ChatAvatar.vue'

type TFixedTab = 'general' | 'captains' | 'duel' | 'admin'

const chatStore = useChatStore()

const fixedTabs: Record<TFixedTab, { label: string; icon: Component }> = {
  general: { label: 'Загальний', icon: PhGlobeHemisphereEast },
  captains: { label: 'Капітани', icon: PhCrown },
  duel: { label: 'Дуелі', icon: PhSword },
  admin: { label: 'Адмін', icon: PhShieldCheck }
}

const searchOpen = ref(false)
const scrollerRef = ref<HTMLElement | null>(null)
const tabRefs = new Map<string, HTMLElement>()

function setTabRef (tab: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) tabRefs.set(tab, el)
  else tabRefs.delete(tab)
}

function isDirect (tab: TChatTabId): boolean {
  return tab.startsWith('dm:')
}

function peerOf (tab: TChatTabId): TChatPlayer | undefined {
  return chatStore.directTabOf(tab)?.peer
}

function badgeOf (tab: TChatTabId) {
  return chatStore.badgeOf(tab)
}

function formatCount (n: number): string {
  return n > 99 ? '99+' : String(n)
}

/** Колесо миші гортає рядок вкладок горизонтально — смуги прокрутки немає. */
function onWheel (event: WheelEvent) {
  const el = scrollerRef.value
  if (!el || el.scrollWidth <= el.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
  el.scrollLeft += event.deltaY
  event.preventDefault()
}

function onPickPlayer (player: TChatPlayer) {
  searchOpen.value = false
  chatStore.openDirect(player)
}

// Активна вкладка завжди видима — навіть коли приватних чатів більше, ніж влазить у ширину.
watch(
  () => chatStore.currentTab,
  async (tab) => {
    await nextTick()
    tabRefs.get(tab)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  },
  { immediate: true }
)
</script>

<style scoped>
.chat-tabs {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  border-bottom: 1px solid var(--ds-border-neutral);
}

.chat-tabs__scroller {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: 2px;
  padding: 6px 6px 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.chat-tabs__scroller::-webkit-scrollbar {
  display: none;
}

.chat-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  max-width: 180px;
  height: 34px;
  padding: 0 10px;
  border-radius: 8px 8px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-text-muted);
  cursor: pointer;
  user-select: none;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.chat-tab.is-direct {
  padding-right: 4px;
}

@media (hover: hover) {
  .chat-tab:hover {
    color: var(--ds-text-strong);
    background: rgba(255, 255, 255, 0.04);
  }
}

.chat-tab:focus-visible {
  outline: 2px solid var(--ds-primary);
  outline-offset: -2px;
}

.chat-tab.is-active {
  color: var(--ds-text-strong);
  background: rgba(var(--ds-primary-rgb), 0.08);
}

.chat-tab.is-active::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.6);
}

.chat-tab__label {
  white-space: nowrap;
}

.chat-tab__label.is-name {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 96px;
}

.chat-tab__badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  color: #fff;
  background: var(--ds-pink);
}

.chat-tab__dot {
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: var(--ds-pink);
}

.chat-tab__close {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  color: var(--ds-text-faint);
  transition: background-color var(--ds-duration-fast) ease, color var(--ds-duration-fast) ease;
}

@media (hover: hover) {
  .chat-tab__close:hover {
    color: var(--ds-text-strong);
    background: rgba(255, 255, 255, 0.08);
  }
}

.chat-tabs__add {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  color: var(--ds-text-muted);
  border-left: 1px solid var(--ds-border-neutral);
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

@media (hover: hover) {
  .chat-tabs__add:hover {
    color: var(--ds-primary);
    background: rgba(var(--ds-primary-rgb), 0.06);
  }
}

.chat-tabs__add:focus-visible {
  outline: 2px solid var(--ds-primary);
  outline-offset: -2px;
}
</style>
