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
    >
      <ul v-if="visibleRows.length" class="vip-list">
        <li
          v-for="(row, index) in visibleRows"
          :key="row.player.id"
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
                <el-image
                  v-if="row.player.avatarUrl"
                  class="vip-player__img"
                  :src="row.player.avatarUrl"
                  fit="cover"
                >
                  <template #error>
                    <PhUser :size="16" weight="bold" />
                  </template>
                </el-image>
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
            <el-dropdown
              trigger="click"
              :disabled="row.isLifetime || isBusy(row.player.id)"
              @command="(cmd: TGrantCommand) => grant(row.player, cmd)"
            >
              <el-button
                :type="row.isVip ? 'default' : 'primary'"
                :plain="row.isVip"
                :loading="isBusy(row.player.id)"
                :disabled="row.isLifetime"
                class="vip-grant-btn"
              >
                <PhCrown v-if="!isBusy(row.player.id)" :size="14" weight="fill" class="mr-6 shrink-0" />
                {{ row.isVip ? 'Продовжити' : 'Видати VIP' }}
                <PhCaretDown :size="12" class="ml-6 shrink-0 opacity-70" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="option in VIP_ADMIN_GRANT_OPTIONS"
                    :key="option.months"
                    :command="option.months"
                  >
                    + {{ option.label }}
                  </el-dropdown-item>
                  <el-dropdown-item command="lifetime" divided>
                    <PhInfinity :size="14" weight="bold" class="mr-6" /> Назавжди
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <el-tooltip v-if="row.isVip" content="Зняти VIP" placement="top" :show-after="200">
              <el-button
                plain
                class="vip-revoke-btn"
                aria-label="Зняти VIP"
                :disabled="isBusy(row.player.id)"
                @click="revoke(row.player)"
              >
                <PhX :size="14" weight="bold" />
              </el-button>
            </el-tooltip>
          </div>
        </li>
      </ul>

      <el-empty
        v-else-if="!playersStore.loading"
        :description="activeFilter === 'vip' ? 'Поки що немає жодного VIP' : 'Гравців не знайдено'"
      />

      <p v-if="hiddenCount" class="vip-more">
        Показано {{ visibleRows.length }} з {{ filteredRows.length }} — уточніть пошук
      </p>
    </div>
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
import { ElMessageBox } from 'element-plus'
import { routeNames } from '@/router/route-names'
import VipBadge from '@/components/VipBadge.vue'
import { VIP_ADMIN_GRANT_OPTIONS, isVipLifetime } from '@/core/vip.constants'
import { useVipStore } from '@/store/modules/vip'

type TFilter = 'vip' | 'all'
type TGrantCommand = number | 'lifetime'

interface IVipRow {
  player: TPlayer
  isVip: boolean
  isLifetime: boolean
  isExpiring: boolean
  daysLeft: number
  leftLabel: string
  untilLabel: string
  monthRatio: number
}

const DAY_MS = 86_400_000
/** Скільки рядків малювати за раз — реєстр може бути великим. */
const MAX_ROWS = 150
/** «Спливає скоро» — підсвічуємо, щоб адмін бачив, кому продовжити. */
const EXPIRING_DAYS = 7

const playersStore = usePlayersStore()
const vipStore = useVipStore()

const filters: { value: TFilter; label: string; icon: Component }[] = [
  { value: 'vip', label: 'VIP', icon: PhCrown },
  { value: 'all', label: 'Усі гравці', icon: PhUsers }
]
const activeFilter = ref<TFilter>('vip')
const search = ref('')

const dateFormat = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
const plural = new Intl.PluralRules('uk-UA')
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
    monthRatio: Math.max(0.04, Math.min(1, daysLeft / 30))
  }
}

const allRows = computed(() => playersStore.players.map(toRow))
const vipCount = computed(() => allRows.value.filter(r => r.isVip).length)

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  const rows = allRows.value.filter((r) => {
    if (activeFilter.value === 'vip' && !r.isVip) return false
    if (!q) return true
    return [r.player.discordName, r.player.discordUsername]
      .some(v => v?.toLowerCase().includes(q))
  })
  // VIP, що спливає найшвидше, — згори; безстрокові — після них; без VIP — в кінці.
  const rank = (r: IVipRow) => (!r.isVip ? 2 : r.isLifetime ? 1 : 0)
  return rows.sort((a, b) => rank(a) - rank(b) || a.daysLeft - b.daysLeft ||
    (a.player.discordName ?? '').localeCompare(b.player.discordName ?? '', 'uk'))
})

const visibleRows = computed(() => filteredRows.value.slice(0, MAX_ROWS))
const hiddenCount = computed(() => filteredRows.value.length - visibleRows.value.length)

const summaryLabel = computed(() => {
  const lifetime = allRows.value.filter(r => r.isLifetime).length
  const expiring = allRows.value.filter(r => r.isExpiring).length
  return `VIP: ${vipCount.value} · безстрокових: ${lifetime} · спливає за ${EXPIRING_DAYS} днів: ${expiring}`
})

function isBusy (playerId: string) {
  return vipStore.adminBusyId === playerId
}

async function grant (player: TPlayer, command: TGrantCommand) {
  const name = player.discordName ?? 'гравцю'
  if (command === 'lifetime') {
    try {
      await ElMessageBox.confirm(
        `Видати ${name} безстроковий VIP? Він ніколи не спливає, автопродовження вимкнеться.`,
        'Безстроковий VIP',
        { confirmButtonText: 'Видати назавжди', cancelButtonText: 'Скасувати', type: 'warning' }
      )
    } catch {
      return
    }
    await vipStore.grantByAdmin(player.id, { lifetime: true })
    return
  }
  await vipStore.grantByAdmin(player.id, { months: command })
}

async function revoke (player: TPlayer) {
  try {
    await ElMessageBox.confirm(
      `Зняти VIP у ${player.discordName ?? 'гравця'}? Статус зникне одразу, автопродовження вимкнеться.`,
      'Зняти VIP',
      { confirmButtonText: 'Зняти', cancelButtonText: 'Скасувати', type: 'warning' }
    )
  } catch {
    return
  }
  await vipStore.revokeByAdmin(player.id)
}

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

  &:hover .vip-player__img {
  display: block;
  width: 100%;
  height: 100%;
}

.vip-player__name {
    color: var(--ds-primary);
  }
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
  @apply py-12 text-center text-xs;
  color: rgba(255, 255, 255, 0.42);
}
</style>
