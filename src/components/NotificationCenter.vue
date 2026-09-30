<template>
  <el-popover
    v-model:visible="open"
    trigger="click"
    placement="bottom-end"
    :width="380"
    :show-arrow="false"
    popper-class="notif-popover"
    transition="el-zoom-in-top"
  >
    <template #reference>
      <button
        type="button"
        class="notif-bell"
        :class="{ 'is-open': open, 'has-unread': store.unreadCount > 0 }"
        :aria-label="bellLabel"
        :aria-expanded="open"
        aria-haspopup="dialog"
      >
        <PhBellRinging v-if="store.unreadCount > 0" :size="20" weight="fill" />
        <PhBell v-else :size="20" weight="bold" />
        <span v-if="store.unreadCount > 0" class="notif-bell__badge">{{ badgeText }}</span>
      </button>
    </template>

    <div class="notif-panel" role="dialog" aria-label="Сповіщення">
      <header class="notif-panel__head">
        <div class="flex min-w-0 flex-col gap-2">
          <span class="sys-label sys-label--muted !text-[9px]">// Центр сповіщень</span>
          <span class="notif-panel__title">Сповіщення</span>
        </div>
        <span
          class="notif-panel__live"
          :class="store.realtime ? 'is-on' : 'is-off'"
          :title="store.realtime ? 'Оновлюються миттєво' : 'Немає живого з’єднання — оновлюємо раз на пів хвилини'"
        >
          <span class="notif-panel__live-dot" aria-hidden="true" />
          {{ store.realtime ? 'live' : 'polling' }}
        </span>
      </header>

      <ul v-if="store.items.length" class="notif-panel__list">
        <NotificationItem
          v-for="item in store.items"
          :key="item.id"
          :item="item"
          @navigate="open = false"
        />
      </ul>
      <p v-else-if="!store.loaded" class="notif-panel__empty">Завантажуємо…</p>
      <p v-else class="notif-panel__empty">
        Поки тихо. Тут з’являться запити в друзі та виклики на дуель.
      </p>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { PhBell, PhBellRinging } from '@phosphor-icons/vue'
import NotificationItem from '@/components/NotificationItem.vue'

/**
 * Дзвіночок у хедері: лічильник непрочитаних + список останніх сповіщень із діями.
 * Стор тримає сокет `/notifications` відкритим на весь сеанс; відкриття панелі
 * позначає все прочитаним (кнопки в actionable-рядках лишаються, поки запит відкритий).
 */
const store = useNotificationsStore()
store.start()

const open = ref(false)

const badgeText = computed(() => (store.unreadCount > 9 ? '9+' : String(store.unreadCount)))
const bellLabel = computed(() =>
  (store.unreadCount ? `Сповіщення: ${store.unreadCount} непрочитаних` : 'Сповіщення')
)

watch(open, (visible) => {
  if (visible) store.markAllRead()
})
</script>

<style scoped>
.notif-bell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--ds-control-radius);
  border: 1px solid rgba(var(--ds-primary-rgb), 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: var(--ds-text-muted);
  cursor: pointer;
  transition:
    color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease;
}

.notif-bell:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
  outline-offset: 2px;
}

.notif-bell.is-open,
.notif-bell.has-unread {
  color: var(--ds-primary);
  border-color: rgba(var(--ds-primary-rgb), 0.45);
}

.notif-bell.has-unread {
  box-shadow: var(--ds-glow-primary-soft);
}

@media (hover: hover) and (pointer: fine) {
  .notif-bell:hover {
    color: var(--ds-primary);
    background: rgba(var(--ds-primary-rgb), 0.08);
  }
}

.notif-bell__badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9999px;
  background: rgb(var(--ds-pink-rgb));
  color: #fff;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 0 10px rgba(var(--ds-pink-rgb), 0.7);
}
</style>

<!-- Not scoped: el-popover is teleported to <body>. -->
<style lang="scss">
.el-popover.el-popper.notif-popover {
  padding: 0;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.22);
  border-radius: 16px;
  background: rgba(16, 19, 36, 0.86);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);
  box-shadow: var(--ds-elevation-4);
  max-width: calc(100vw - 24px);

  .notif-panel {
    display: flex;
    flex-direction: column;
    max-height: min(70vh, 560px);
  }

  .notif-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .notif-panel__title {
    font-family: var(--ds-font-display);
    font-size: 16px;
    color: var(--ds-text-strong);
  }

  .notif-panel__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--ds-font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }

  .notif-panel__live-dot {
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: currentColor;
  }

  .notif-panel__live.is-on {
    color: rgb(34, 197, 94);
  }

  .notif-panel__list {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 8px;
    list-style: none;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .notif-panel__empty {
    padding: 28px 16px;
    text-align: center;
    font-size: 13px;
    color: var(--ds-text-faint);
  }
}
</style>
