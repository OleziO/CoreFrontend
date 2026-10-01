<template>
  <div class="flex h-full flex-col gap-12 overflow-hidden">
    <!-- Toolbar: фільтр, пошук, підсумок -->
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-x-16 gap-y-10">
      <div class="flex flex-wrap items-center gap-10">
        <div class="vip-filters" role="group" aria-label="Кого показати">
          <button
            v-for="f in filters"
            :key="f.value"
            type="button"
            class="vip-filter"
            :class="{ 'is-active': activeFilter === f.value }"
            :aria-pressed="activeFilter === f.value"
            @click="activeFilter = f.value"
          >
            <component :is="f.icon" :size="14" weight="bold" class="shrink-0" />
            {{ f.label }}
            <span v-if="f.value === 'vip' && vipCount" class="vip-filter__count">{{ vipCount }}</span>
          </button>
        </div>

        <el-input
          v-model="search"
          class="vip-search"
          placeholder="Пошук по ніку…"
          clearable
        >
          <template #prepend>
            <PhMagnifyingGlass :size="16" />
          </template>
        </el-input>
      </div>

      <span class="sys-label sys-label--muted !text-[9px]" aria-live="polite">
        {{ summaryLabel }}
      </span>
    </div>

    <!-- List -->
    <div
      v-loading="playersStore.loading"
      class="custom-scroll min-h-0 flex-1 overflow-y-auto"
      @scroll.passive="closeMenu"
    >
      <ul v-if="visibleRows.length" class="vip-list">
        <!-- v-memo: при видачі / знятті VIP перемальовується лише зачеплений рядок, а не весь реєстр. -->
        <li
          v-for="(row, index) in visibleRows"
          :key="row.player.id"
          v-memo="[row, index, isBusy(row.player.id), brokenAvatars.has(row.player.id)]"
          class="vip-row hud-panel"
          :class="{ 'is-vip': row.isVip, 'is-expiring': row.isExpiring }"
        >
          <!-- 01 · хто -->
          <div class="vip-row__who">
            <span class="vip-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <RouterLink
              :to="{ name: routeNames.player, params: { id: row.player.id } }"
              class="vip-player no-underline"
            >
              <span class="vip-player__avatar">
                <img
                  v-if="row.player.avatarUrl && !brokenAvatars.has(row.player.id)"
                  class="vip-player__img"
                  :src="row.player.avatarUrl"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  @error="brokenAvatars.add(row.player.id)"
                >
                <PhUser v-else :size="16" weight="bold" />
              </span>
              <span class="flex min-w-0 flex-col gap-3">
                <span class="flex min-w-0 items-center gap-6">
                  <span class="vip-player__name">
                    {{ row.player.discordName || row.player.discordUsername || '—' }}
                  </span>
                  <VipBadge v-if="row.isVip" size="xs" static />
                </span>
                <span v-if="row.player.discordUsername" class="vip-player__meta">
                  @{{ row.player.discordUsername }}
                </span>
              </span>
            </RouterLink>
          </div>

          <!-- 02 · скільки лишилось -->
          <div class="vip-left">
            <template v-if="row.isLifetime">
              <span class="vip-left__value is-lifetime">
                <PhInfinity :size="16" weight="bold" /> Безстроково
              </span>
              <span class="vip-left__sub">видано адміном</span>
            </template>
            <template v-else-if="row.isVip">
              <span class="vip-left__value">{{ row.leftLabel }}</span>
              <span class="vip-left__bar" aria-hidden="true">
                <span class="vip-left__fill" :style="{ transform: `scaleX(${row.monthRatio})` }" />
              </span>
              <span class="vip-left__sub">до {{ row.untilLabel }}</span>
            </template>
            <span v-else class="vip-left__none">Без VIP</span>
          </div>

          <!-- 03 · дії -->
          <div class="vip-row__actions">
            <el-button
              :type="row.isVip ? 'default' : 'primary'"
              :plain="row.isVip"
              :loading="isBusy(row.player.id)"
              :disabled="row.isLifetime"
              class="vip-grant-btn"
              aria-haspopup="menu"
              @click="toggleMenu($event, row.player)"
            >
              <PhCrown v-if="!isBusy(row.player.id)" :size="14" weight="fill" class="mr-6 shrink-0" />
              {{ row.isVip ? 'Продовжити' : 'Видати VIP' }}
              <PhCaretDown :size="12" class="ml-6 shrink-0 opacity-70" />
            </el-button>

            <el-button
              v-if="row.isVip"
              plain
              class="vip-revoke-btn"
              title="Зняти VIP"
              aria-label="Зняти VIP"
              :disabled="isBusy(row.player.id)"
              @click="revoke(row.player)"
            >
              <PhX :size="14" weight="bold" />
            </el-button>
          </div>
        </li>
      </ul>

      <el-empty
        v-else-if="!playersStore.loading"
        :description="activeFilter === 'vip' ? 'Поки що немає жодного VIP' : 'Гравців не знайдено'"
      />

      <div v-if="hiddenCount" class="vip-more">
        <span>Показано {{ visibleRows.length }} з {{ filteredRows.length }}</span>
        <el-button text size="small" @click="limit += PAGE_SIZE">Показати ще</el-button>
      </div>
    </div>

    <!-- Одне спільне меню видачі замість el-dropdown у кожному рядку: сотні popper-ів фризили вкладку. -->
    <el-popover
      :visible="!!menu"
      :virtual-ref="menu?.anchor"
      virtual-triggering
      placement="bottom-end"
      :width="180"
      :show-arrow="false"
      popper-class="vip-grant-menu"
    >
      <ul ref="menuEl" class="vip-grant-menu__list" role="menu">
        <li v-for="option in VIP_ADMIN_GRANT_OPTIONS" :key="option.months" role="none">
          <button type="button" role="menuitem" class="vip-grant-menu__item" @click="pick(option.months)">
            + {{ option.label }}
          </button>
        </li>
        <li role="none" class="vip-grant-menu__divider">
          <button type="button" role="menuitem" class="vip-grant-menu__item" @click="pick('lifetime')">
            <PhInfinity :size="14" weight="bold" /> Назавжди
          </button>
        </li>
      </ul>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import {
  PhCaretDown,
  PhCrown,
  PhInfinity,
  PhMagnifyingGlass,
  PhUser,
  PhUsers,
  PhX
} from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import VipBadge from '@/components/VipBadge.vue'
import { VIP_ADMIN_GRANT_OPTIONS, isVipLifetime } from '@/core/vip.constants'
import { type TVipGrantCommand, useAdminVipActions } from '@/composables/use-admin-vip-actions'

type TFilter = 'vip' | 'all'

interface IVipRow {
  player: TPlayer
  isVip: boolean
  isLifetime: boolean
  isExpiring: boolean
  daysLeft: number
  leftLabel: string
  untilLabel: string
  monthRatio: number
  /** Нік + username у нижньому регістрі — щоб не рахувати на кожне натискання. */
  searchKey: string
  /** 0 — VIP зі строком, 1 — безстроковий, 2 — без VIP. */
  rank: number
}

const DAY_MS = 86_400_000
/** Скільки рядків малювати за раз — реєстр може бути великим. */
const PAGE_SIZE = 50
/** «Спливає скоро» — підсвічуємо, щоб адмін бачив, кому продовжити. */
const EXPIRING_DAYS = 7

const playersStore = usePlayersStore()
const { isBusy, grant, revoke } = useAdminVipActions()

const filters: { value: TFilter; label: string; icon: Component }[] = [
  { value: 'vip', label: 'VIP', icon: PhCrown },
  { value: 'all', label: 'Усі гравці', icon: PhUsers }
]
const activeFilter = ref<TFilter>('vip')
const search = ref('')
const debouncedSearch = refDebounced(search, 200)
const limit = ref(PAGE_SIZE)
const brokenAvatars = reactive(new Set<string>())

const dateFormat = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
const plural = new Intl.PluralRules('uk-UA')
/** Один колатор на всі порівняння: `localeCompare(…, 'uk')` створює новий на кожен виклик. */
const collator = new Intl.Collator('uk')
const DAY_FORMS: Record<string, string> = { one: 'день', few: 'дні', many: 'днів', other: 'дня' }

function formatDaysLeft (days: number): string {
  if (days <= 0) return 'Менше доби'
  return `${days} ${DAY_FORMS[plural.select(days)] ?? 'днів'}`
}

function toRow (player: TPlayer): IVipRow {
  const isVip = !!player.isVip
  const until = player.vipUntil ? new Date(player.vipUntil) : null
  const isLifetime = isVip && isVipLifetime(player.vipUntil)
  const daysLeft = isVip && until && !isLifetime
    ? Math.ceil((until.getTime() - Date.now()) / DAY_MS)
    : 0
  return {
    player,
    isVip,
    isLifetime,
    isExpiring: isVip && !isLifetime && daysLeft < EXPIRING_DAYS,
    daysLeft,
    leftLabel: formatDaysLeft(daysLeft),
    untilLabel: until ? dateFormat.format(until) : '—',
    monthRatio: Math.max(0.04, Math.min(1, daysLeft / 30)),
    searchKey: `${player.discordName ?? ''}\n${player.discordUsername ?? ''}`.toLowerCase(),
    rank: !isVip ? 2 : isLifetime ? 1 : 0
  }
}

/**
 * Рядок кешується за об'єктом гравця: patchPlayerInList замінює лише змінений запис,
 * тож решта рядків зберігає ідентичність і v-memo їх не перемальовує.
 */
const rowCache = new WeakMap<TPlayer, IVipRow>()
function rowFor (player: TPlayer): IVipRow {
  const raw = toRaw(player)
  let row = rowCache.get(raw)
  if (!row) {
    row = toRow(player)
    rowCache.set(raw, row)
  }
  return row
}

const allRows = computed(() => playersStore.players.map(rowFor))

const stats = computed(() => {
  let vip = 0
  let lifetime = 0
  let expiring = 0
  for (const r of allRows.value) {
    if (r.isVip) vip += 1
    if (r.isLifetime) lifetime += 1
    if (r.isExpiring) expiring += 1
  }
  return { vip, lifetime, expiring }
})
const vipCount = computed(() => stats.value.vip)

// VIP, що спливає найшвидше, — згори; безстрокові — після них; без VIP — в кінці.
// Сортуємо окремо від пошуку, щоб набір тексту не пересортовував увесь реєстр.
const sortedRows = computed(() => {
  const rows = activeFilter.value === 'vip' ? allRows.value.filter(r => r.isVip) : allRows.value.slice()
  return rows.sort((a, b) => a.rank - b.rank || a.daysLeft - b.daysLeft ||
    collator.compare(a.player.discordName ?? '', b.player.discordName ?? ''))
})

const filteredRows = computed(() => {
  const q = debouncedSearch.value.trim().toLowerCase()
  return q ? sortedRows.value.filter(r => r.searchKey.includes(q)) : sortedRows.value
})

const visibleRows = computed(() => filteredRows.value.slice(0, limit.value))
const hiddenCount = computed(() => filteredRows.value.length - visibleRows.value.length)

watch([activeFilter, debouncedSearch], () => {
  limit.value = PAGE_SIZE
})

const summaryLabel = computed(() =>
  `VIP: ${stats.value.vip} · безстрокових: ${stats.value.lifetime} · ` +
  `спливає за ${EXPIRING_DAYS} днів: ${stats.value.expiring}`)

// ─── Спільне меню видачі ──────────────────────────────────────────────────────
const menu = shallowRef<{ anchor: HTMLElement; player: TPlayer } | null>(null)
const menuEl = ref<HTMLElement | null>(null)

function closeMenu () {
  menu.value = null
}

function toggleMenu (event: MouseEvent, player: TPlayer) {
  const anchor = event.currentTarget as HTMLElement
  menu.value = menu.value?.anchor === anchor ? null : { anchor, player }
}

function pick (command: TVipGrantCommand) {
  const player = menu.value?.player
  closeMenu()
  if (player) grant(player, command)
}

onClickOutside(menuEl, (event) => {
  if (menu.value && !menu.value.anchor.contains(event.target as Node)) closeMenu()
})
onKeyStroke('Escape', () => {
  if (menu.value) closeMenu()
})

onMounted(() => {
  if (!playersStore.players.length) playersStore.getPlayers()
})
</script>

<style scoped lang="scss">
// VIP registry for admins: one HUD row per player — identity, time left (a
// month-scaled bar, gold; red when it runs out within a week), grant / revoke.
.vip-filters {
  @apply inline-flex items-center gap-4 rounded-xl p-4;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.14);
  background: rgba(0, 0, 0, 0.3);
}

.vip-filter {
  @apply inline-flex h-32 cursor-pointer items-center gap-6 rounded-lg border-0 bg-transparent px-12;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;

  &:hover {
    color: #fff;
  }

  &.is-active {
    color: rgb(255, 222, 140);
    background: linear-gradient(110deg, rgba(255, 206, 84, 0.16), rgba(255, 94, 170, 0.1));
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 206, 84, 0.7);
    outline-offset: 2px;
  }
}

.vip-filter__count {
  @apply inline-flex min-w-[18px] items-center justify-center rounded-full px-5;
  height: 18px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  background: rgba(255, 206, 84, 0.2);
  color: rgb(255, 222, 140);
}

.vip-search {
  width: 280px;
}

.vip-list {
  @apply m-0 flex list-none flex-col gap-8 p-0;
}

.vip-row {
  @apply grid items-center gap-16 rounded-xl px-16 py-12;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: border-color var(--ds-duration-base) ease;

  &.is-vip {
    border-color: rgba(255, 206, 84, 0.22);
  }

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
}

.vip-row__who {
  @apply flex min-w-0 items-center gap-12;
}

.vip-row__index {
  width: 22px;
  flex-shrink: 0;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

.vip-player {
  @apply flex min-w-0 items-center gap-10;
  color: inherit;

  &:hover .vip-player__name {
    color: var(--ds-primary);
  }
}

.vip-player__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vip-player__avatar {
  display: inline-flex;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
}

.vip-player__name {
  @apply truncate text-sm font-semibold text-white;
  transition: color var(--ds-duration-fast) ease;
}

.vip-player__meta {
  @apply truncate font-mono text-[11px];
  color: rgba(255, 255, 255, 0.42);
}

// Time left
.vip-left {
  @apply flex min-w-0 flex-col gap-5;
}

.vip-left__value {
  @apply inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 15px;
  font-weight: 700;
  color: rgb(255, 222, 140);

  &.is-lifetime {
    color: rgb(255, 214, 102);
    text-shadow: 0 0 10px rgba(255, 206, 84, 0.4);
  }
}

.vip-left__bar {
  @apply block h-4 w-full max-w-[220px] overflow-hidden rounded-full;
  background: rgba(255, 255, 255, 0.08);
}

.vip-left__fill {
  @apply block h-full w-full rounded-full;
  transform-origin: left;
  background: linear-gradient(90deg, rgb(255, 200, 70), rgb(255, 110, 170));
}

.vip-left__sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.42);
}

.vip-left__none {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}

.vip-row.is-expiring {
  border-color: rgba(239, 68, 68, 0.35);

  .vip-left__value {
    color: rgb(252, 129, 129);
  }

  .vip-left__fill {
    background: rgb(239, 68, 68);
  }
}

.vip-row__actions {
  @apply flex items-center justify-end gap-8;

  :deep(.el-button) {
    margin: 0;
  }
}

.vip-grant-btn {
  min-width: 150px;
}

.vip-revoke-btn {
  @apply px-10;
}

.vip-more {
  @apply flex items-center justify-center gap-8 py-12 text-xs;
  color: rgba(255, 255, 255, 0.42);
}
</style>

<style lang="scss">
// Popper телепортується в body — scoped-стилі до нього не дістають.
.vip-grant-menu.el-popover.el-popper {
  padding: 4px;
}

.vip-grant-menu__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.vip-grant-menu__divider {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.vip-grant-menu__item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 6px;
  padding: 7px 12px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 14px;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    background: var(--el-dropdown-menuItem-hover-fill, var(--el-fill-color-light));
    color: var(--el-dropdown-menuItem-hover-color, var(--el-color-primary));
  }
}
</style>
