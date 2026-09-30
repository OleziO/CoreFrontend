<template>
  <el-popover
    v-model:visible="open"
    trigger="click"
    placement="bottom-end"
    :width="400"
    :show-arrow="false"
    :persistent="false"
    popper-class="notif-popover"
    transition="el-zoom-in-top"
  >
    <template #reference>
      <button
        type="button"
        class="notif-bell"
        :class="{ 'is-open': open, 'has-unread': store.unreadCount > 0, 'is-ringing': ringing }"
        :aria-label="bellLabel"
        :aria-expanded="open"
        aria-haspopup="dialog"
      >
        <span class="notif-bell__icon" aria-hidden="true">
          <PhBellRinging v-if="store.unreadCount > 0" :size="20" weight="fill" />
          <PhBell v-else :size="20" weight="bold" />
        </span>
        <Transition name="notif-badge">
          <span v-if="store.unreadCount > 0" class="notif-bell__badge">{{ badgeText }}</span>
        </Transition>
      </button>
    </template>

    <div class="notif-panel" role="dialog" aria-label="Сповіщення">
      <header class="notif-panel__head">
        <div class="flex min-w-0 flex-col gap-2">
          <span class="sys-label sys-label--muted !text-[9px]">// Центр сповіщень</span>
          <span class="notif-panel__title">
            Сповіщення
            <span v-if="pendingCount" class="notif-panel__count" :title="`Очікують відповіді: ${pendingCount}`">
              {{ pendingCount }}
            </span>
          </span>
        </div>
        <span
          class="notif-panel__live"
          :class="store.realtime ? 'is-on' : 'is-off'"
          :title="liveTitle"
          role="status"
        >
          <span class="notif-panel__live-dot" aria-hidden="true" />
          {{ store.realtime ? 'live' : 'polling' }}
        </span>
      </header>

      <!-- Список: спершу те, що чекає на відповідь, далі — за днями -->
      <div v-if="groups.length" class="notif-panel__scroll">
        <section v-for="group in groups" :key="group.key" class="notif-group" :class="`is-${group.key}`">
          <h3 class="notif-group__label">
            <span>// {{ group.label }}</span>
            <span class="notif-group__line" aria-hidden="true" />
          </h3>
          <ul class="notif-group__list">
            <NotificationItem
              v-for="entry in group.entries"
              :key="entry.item.id"
              :item="entry.item"
              :index="entry.index"
              @navigate="open = false"
            />
          </ul>
        </section>
      </div>

      <!-- Завантаження: три «кістки» рядків замість тексту -->
      <div v-else-if="!store.loaded" class="notif-panel__skeleton" aria-busy="true" aria-label="Завантажуємо">
        <div v-for="n in 3" :key="n" class="notif-panel__skeleton-row" :style="{ '--skeleton-delay': `${n * 80}ms` }">
          <span class="skeleton-bone h-[36px] w-[36px] !rounded-full" />
          <span class="flex flex-1 flex-col gap-6">
            <span class="skeleton-bone block h-[12px] w-4/5 !rounded-md" />
            <span class="skeleton-bone block h-[10px] w-2/5 !rounded-md" />
          </span>
        </div>
      </div>

      <div v-else class="notif-panel__empty">
        <span class="notif-panel__empty-glyph" aria-hidden="true">
          <PhBellSlash :size="22" weight="duotone" />
        </span>
        <span class="notif-panel__empty-title">Поки тихо</span>
        <span class="notif-panel__empty-text">Тут з’являться запити в друзі та виклики на дуель.</span>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhBell, PhBellRinging, PhBellSlash } from '@phosphor-icons/vue'
import NotificationItem from '@/components/NotificationItem.vue'
import type { TNotification } from '@/api/types/api.types'

interface INotificationGroup {
  key: 'pending' | 'today' | 'yesterday' | 'earlier'
  label: string
  entries: { item: TNotification; index: number }[]
}

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
const pendingCount = computed(() => store.actionable.length)
const liveTitle = computed(() =>
  (store.realtime ? 'Оновлюються миттєво' : 'Немає живого з’єднання — оновлюємо раз на пів хвилини')
)

/** Групи: відкриті запити зверху (їм потрібна відповідь), решта — сьогодні / вчора / раніше. */
const groups = computed<INotificationGroup[]>(() => {
  const now = dayjs()
  const buckets: Record<INotificationGroup['key'], TNotification[]> = {
    pending: [],
    today: [],
    yesterday: [],
    earlier: []
  }
  for (const item of store.items) {
    if (item.status === 'pending') {
      buckets.pending.push(item)
      continue
    }
    const created = dayjs(item.createdAt)
    if (created.isSame(now, 'day')) buckets.today.push(item)
    else if (created.isSame(now.subtract(1, 'day'), 'day')) buckets.yesterday.push(item)
    else buckets.earlier.push(item)
  }
  const labels: Record<INotificationGroup['key'], string> = {
    pending: 'Очікують відповіді',
    today: 'Сьогодні',
    yesterday: 'Вчора',
    earlier: 'Раніше'
  }
  let index = 0
  return (Object.keys(buckets) as INotificationGroup['key'][])
    .filter((key) => buckets[key].length)
    .map((key) => ({
      key,
      label: labels[key],
      entries: buckets[key].map((item) => ({ item, index: index++ }))
    }))
})

// Відкрили панель — даємо мить побачити, що саме нове (світні риски), і лише тоді гасимо їх.
const { start: scheduleMarkRead, stop: cancelMarkRead } = useTimeoutFn(() => store.markAllRead(), 900, {
  immediate: false
})
watch(open, (visible) => {
  if (visible) scheduleMarkRead()
  else {
    cancelMarkRead()
    store.markAllRead()
  }
})

// Прийшло нове — дзвіночок «дзеленькає» один раз (лише коли лічильник зріс, не на кожне оновлення).
const ringing = ref(false)
const { start: stopRinging } = useTimeoutFn(() => {
  ringing.value = false
}, 700, { immediate: false })
watch(() => store.unreadCount, (count, previous) => {
  if (count > (previous ?? 0)) {
    ringing.value = true
    stopRinging()
  }
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
  -webkit-tap-highlight-color: transparent;
  transition:
    color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.notif-bell:active {
  transform: scale(0.94);
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

.notif-bell__icon {
  display: inline-flex;
  transform-origin: 50% 0;
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

.notif-badge-enter-active {
  transition: transform 220ms var(--ds-ease-out), opacity 150ms ease;
}

.notif-badge-leave-active {
  transition: transform 150ms var(--ds-ease-in-out), opacity 120ms ease;
}

.notif-badge-enter-from,
.notif-badge-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

@media (prefers-reduced-motion: no-preference) {
  .notif-bell.is-ringing .notif-bell__icon {
    animation: notif-ring 700ms var(--ds-ease-in-out);
  }

  @keyframes notif-ring {
    0%,
    100% {
      transform: rotate(0);
    }

    15% {
      transform: rotate(14deg);
    }

    35% {
      transform: rotate(-12deg);
    }

    55% {
      transform: rotate(8deg);
    }

    75% {
      transform: rotate(-4deg);
    }
  }
}
</style>

<!-- Not scoped: el-popover is teleported to <body>. -->
<style lang="scss">
.el-popover.el-popper.notif-popover {
  --notif-surface: 16, 19, 36;

  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.22);
  border-radius: 16px;
  background: rgba(var(--notif-surface), 0.86);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);
  box-shadow: var(--ds-elevation-4), 0 0 24px rgba(var(--ds-primary-rgb), 0.08);
  max-width: calc(100vw - 24px);

  .notif-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    max-height: min(72vh, 600px);
  }

  // Ціанова волосинка зверху — той самий знак, що й у карток
  .notif-panel::before {
    content: '';
    position: absolute;
    inset: 0 16px auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(var(--ds-primary-rgb), 0.7), transparent);
    pointer-events: none;
  }

  .notif-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px 12px;
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.1);
  }

  .notif-panel__title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--ds-font-display);
    font-size: 16px;
    color: var(--ds-text-strong);
  }

  .notif-panel__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 9999px;
    background: rgb(var(--ds-pink-rgb));
    color: #fff;
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 700;
    box-shadow: 0 0 10px rgba(var(--ds-pink-rgb), 0.55);
  }

  .notif-panel__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--ds-font-mono);
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }

  .notif-panel__live-dot {
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: currentcolor;
    box-shadow: 0 0 6px currentcolor;
  }

  .notif-panel__live.is-on {
    color: rgb(34, 197, 94);
  }

  .notif-panel__scroll {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 8px 10px;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(var(--ds-primary-rgb), 0.3) transparent;
  }

  // Підпис групи липне до верху під час прокрутки — завжди видно, який це день
  .notif-group__label {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 8px 6px 6px;
    background: linear-gradient(180deg, rgba(var(--notif-surface), 0.98) 70%, rgba(var(--notif-surface), 0));
    font-family: var(--ds-font-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }

  .notif-group.is-pending .notif-group__label {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }

  .notif-group__line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), transparent);
  }

  .notif-group.is-pending .notif-group__line {
    background: linear-gradient(90deg, rgba(var(--ds-primary-rgb), 0.35), transparent);
  }

  .notif-group__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .notif-panel__skeleton {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
  }

  .notif-panel__skeleton-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
  }

  .notif-panel__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 32px 20px 30px;
    text-align: center;
  }

  .notif-panel__empty-glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: 6px;
    border-radius: 9999px;
    border: 1px dashed rgba(var(--ds-primary-rgb), 0.35);
    background: rgba(var(--ds-primary-rgb), 0.05);
    color: var(--ds-primary);
  }

  .notif-panel__empty-title {
    font-family: var(--ds-font-display);
    font-size: 14px;
    letter-spacing: 0.04em;
    color: var(--ds-text-strong);
  }

  .notif-panel__empty-text {
    max-width: 260px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--ds-text-faint);
  }
}
</style>
