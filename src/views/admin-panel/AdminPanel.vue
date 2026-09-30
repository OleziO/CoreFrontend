<template>
  <div class="admin-panel relative flex h-full w-full flex-col overflow-hidden text-white">
    <!-- Атмосферний відблиск у стилі списків турнірів / гравців -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[260px]
             bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(46,229,255,0.1),transparent_70%)]"
      aria-hidden="true"
    />

    <!-- `relative` без z-index: контент малюється над відблиском у порядку DOM, але
         не створює stacking context — інакше fixed-оверлей drawer'а опинявся б
         під sticky-футером (z-50). -->
    <div class="relative mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-16 lg:px-24">
      <!-- ─── Head ─────────────────────────────────────────────────────── -->
      <header class="admin-head">
        <div class="flex min-w-0 flex-col gap-6">
          <span class="sys-label">// Панель керування</span>
          <h1 class="admin-head__title">Адмінка</h1>
        </div>

        <!-- Хто працює в панелі — плашка оператора -->
        <div v-if="authStore.user" class="admin-head__operator">
          <span class="admin-head__operator-avatar">
            <el-image class="size-full" :src="authStore.user.avatarUrl ?? ''" fit="cover" />
          </span>
          <span class="flex min-w-0 flex-col gap-3">
            <span class="admin-head__operator-label">Оператор</span>
            <span class="admin-head__operator-name">{{ authStore.user.discordName }}</span>
          </span>
        </div>
      </header>

      <!-- ─── Tabs rail ───────────────────────────────────────────────── -->
      <nav class="admin-tabs no-scrollbar" aria-label="Розділи адмінки">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.value"
          type="button"
          class="admin-tab"
          :class="{ 'is-active': activeTab === tab.value }"
          :aria-current="activeTab === tab.value ? 'page' : undefined"
          @click="activeTab = tab.value"
        >
          <span class="admin-tab__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <component :is="tab.icon" :size="16" weight="bold" class="shrink-0" />
          <span>{{ tab.label }}</span>
          <span
            v-if="counts[tab.value]"
            class="admin-tab__count"
            :aria-label="`${counts[tab.value]} в черзі`"
          >
            {{ counts[tab.value] }}
          </span>
        </button>
      </nav>

      <!-- ─── Content ─────────────────────────────────────────────────── -->
      <section class="min-h-0 flex-1 py-16">
        <transition name="admin-tab" mode="out-in">
          <component :is="tabsObject[activeTab].component" :key="activeTab" />
        </transition>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createHashedObject } from '@/core/helpers'
import { PhCalendarCheck, PhArrowsClockwise, PhSword } from '@phosphor-icons/vue'
import VerificationTab from './components/tabs/VerificationTab.vue'
import MmrRequestsTab from './components/tabs/MmrRequestsTab.vue'
import DuelsTab from './components/tabs/DuelsTab.vue'
// Tabs hidden for now — out of scope (verification feature only) / broken.
// Restore the imports + entries below to re-enable.
// import { PhTrophy, PhClipboardText, PhBug } from '@phosphor-icons/vue'
// import TournamentsDetails from './components/TournamentsDetails.vue'
// import RequestsDetails from './components/RequestsDetails.vue'
// import BugsTab from './components/tabs/BugsTab.vue'

type TAdminTabType = 'tournaments' | 'requests' | 'verification' | 'bugs' | 'mmr-requests' | 'duels'

const tabs: {
  value: TAdminTabType
  label: string
  icon: Component
  component: Component
}[] = [
  // Hidden for now — out of scope (verification feature only) / broken:
  // { value: 'tournaments', label: 'Турніри', icon: PhTrophy, component: TournamentsDetails },
  // { value: 'requests', label: 'Запити', icon: PhClipboardText, component: RequestsDetails },
  {
    value: 'verification',
    label: 'Верифікація',
    icon: PhCalendarCheck,
    component: VerificationTab
  },
  {
    value: 'mmr-requests',
    label: 'Запити MMR',
    icon: PhArrowsClockwise,
    component: MmrRequestsTab
  },
  {
    value: 'duels',
    label: 'Дуелі',
    icon: PhSword,
    component: DuelsTab
  }
  // { value: 'bugs', label: 'Баги', icon: PhBug, component: BugsTab }
]

const tabsObject = createHashedObject(tabs, 'value')
const activeTab = ref<TAdminTabType>('verification')

const authStore = useAuthStore()
const mmrStore = useMmrRequestsStore()

/** Лічильники черги на вкладках — лише реальні дані зі стору. */
const counts = computed<Partial<Record<TAdminTabType, number | null>>>(() => ({
  'mmr-requests': mmrStore.pendingCount
}))

onMounted(() => {
  document.body.style.overflow = 'hidden'
  // Бейдж черги MMR має бути видно ще до відкриття вкладки.
  mmrStore.fetchPendingCount().catch(() => { /* тихо — вкладка покаже тост сама */ })
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.admin-panel {
  overflow: hidden !important;
}

/* ─── Head ───────────────────────────────────────────────────────────────── */
.admin-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  padding: 28px 0 16px;
}

.admin-head__title {
  margin: 0;
  font-family: var(--ds-font-display);
  font-size: 30px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: var(--ds-neon-text-subtle);
}

@media (min-width: 1280px) {
  .admin-head__title {
    font-size: 36px;
  }
}

.admin-head__operator {
  display: none;
}

@media (min-width: 768px) {
  .admin-head__operator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px 6px 6px;
    border-radius: 10px;
    border: 1px solid rgba(var(--ds-primary-rgb), 0.14);
    background:
      repeating-linear-gradient(-45deg, rgba(var(--ds-primary-rgb), 0.04) 0 1px, transparent 1px 10px),
      rgba(7, 8, 15, 0.45);
  }
}

.admin-head__operator-avatar {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.4), var(--ds-glow-primary-soft);
}

.admin-head__operator-label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.admin-head__operator-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.1;
  color: rgba(255, 255, 255, 0.9);
}

/* ─── Tabs rail ──────────────────────────────────────────────────────────── */
.admin-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  overflow-x: auto;
  border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.14);
}

.admin-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px 8px 0 0;
  background: transparent;
  font-family: var(--ds-font-display);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--ds-text-faint);
  cursor: pointer;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

/* Neon underline: cyan → pink, grows from the centre on activation. */
.admin-tab::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--ds-primary), var(--ds-pink));
  box-shadow: var(--ds-glow-primary);
  transform: scaleX(0);
  opacity: 0;
  transition: transform var(--ds-duration-base) var(--ds-ease-out), opacity var(--ds-duration-base) ease;
}

.admin-tab.is-active {
  color: #fff;
  text-shadow: var(--ds-neon-text-subtle);
}

.admin-tab.is-active::after {
  transform: scaleX(1);
  opacity: 1;
}

.admin-tab:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
  outline-offset: -2px;
}

.admin-tab__index {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-fast) ease;
}

.admin-tab.is-active .admin-tab__index {
  color: var(--ds-primary);
}

.admin-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--ds-pink-rgb), 0.4);
  background: rgba(var(--ds-pink-rgb), 0.14);
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  color: var(--ds-pink);
  text-shadow: none;
}

@media (hover: hover) and (pointer: fine) {
  .admin-tab:not(.is-active):hover {
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.04);
  }
}

/* ─── Tab switch ─────────────────────────────────────────────────────────── */
.admin-tab-enter-active {
  transition: opacity 150ms var(--ds-ease-out), transform 150ms var(--ds-ease-out);
}

.admin-tab-leave-active {
  transition: opacity 100ms ease;
}

.admin-tab-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.admin-tab-leave-to {
  opacity: 0;
}
</style>
