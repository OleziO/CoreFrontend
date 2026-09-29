<template>
  <div class="leaderboard relative flex w-full flex-col text-white">
    <!-- Золотий відблиск угорі — сторінка про трофеї, тож тон теплий, а не ціановий -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[280px]
             bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(var(--ds-gold-rgb),0.1),transparent_70%)]"
      aria-hidden="true"
    />

    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-16 pb-40 lg:px-24">
      <!-- ─── Head ─────────────────────────────────────────────────────── -->
      <header class="leaderboard-head">
        <div class="flex min-w-0 flex-col gap-6">
          <span class="sys-label sys-label--gold">// {{ isDuelBoard ? 'Рейтинг 1v1' : 'Рейтинг платформи' }}</span>
          <h1 class="leaderboard-head__title">Таблиця лідерів</h1>
          <p class="leaderboard-head__subtitle">
            <template v-if="isDuelBoard">
              Рейтингові дуелі Solo Mid: +25 за перемогу, −25 за поразку. Хто найкращий на міді.
            </template>
            <template v-else>
              Перемоги, п’єдестали, досягнення та турнірні очки — хто задає темп у лізі.
            </template>
          </p>
        </div>

        <div class="leaderboard-head__aside">
          <!-- Перемикач дошки: турнірний рейтинг ↔ 1v1 (`?board=1v1`) -->
          <div class="board-switch" role="tablist" aria-label="Тип рейтингу">
            <button
              v-for="option in boardOptions"
              :key="option.value"
              type="button"
              role="tab"
              class="board-switch__tab"
              :class="{ 'is-active': board === option.value }"
              :aria-selected="board === option.value"
              @click="setBoard(option.value)"
            >
              <component :is="option.icon" :size="14" weight="bold" class="shrink-0" />
              {{ option.label }}
            </button>
          </div>

          <span v-if="!isDuelBoard && generatedAt" class="leaderboard-head__stamp">
            <span class="leaderboard-head__dot" aria-hidden="true" />
            Оновлено о {{ generatedAt }}
          </span>
          <el-button
            class="leaderboard-head__refresh"
            :loading="isDuelBoard ? duelLoading : isLoading"
            :disabled="isDuelBoard ? duelLoading : isLoading"
            aria-label="Оновити таблицю"
            @click="isDuelBoard ? duelRefetch() : refetch()"
          >
            <PhArrowsClockwise v-if="!(isDuelBoard ? duelLoading : isLoading)" :size="16" weight="bold" />
            <span class="ml-6 hidden sm:inline">Оновити</span>
          </el-button>
        </div>
      </header>

      <!-- ─── 1v1 board ────────────────────────────────────────────────── -->
      <template v-if="isDuelBoard">
        <DuelBotsStatusStrip :bots="bots" :is-error="botsError" />

        <section v-if="duelError && !duelData" class="leaderboard-error neon-card hud-corners rounded-2xl">
          <PhWarningOctagon :size="28" weight="duotone" class="text-pink-400" />
          <div class="flex flex-col gap-4">
            <span class="text-base font-semibold text-white">Не вдалося завантажити рейтинг 1v1</span>
            <span class="text-sm text-gray-400">{{ duelErrorMessage }}</span>
          </div>
          <el-button type="primary" class="ml-auto" @click="duelRefetch()">
            Спробувати ще раз
          </el-button>
        </section>

        <span v-else-if="duelPending" class="skeleton-bone block h-[520px] !rounded-2xl" />

        <section
          v-else-if="duelData && !duelData.players.length"
          class="leaderboard-empty neon-card hud-corners rounded-2xl"
        >
          <PhSword :size="40" weight="duotone" class="text-primary" />
          <span class="text-base font-semibold text-white">Таблиця 1v1 ще порожня</span>
          <span class="text-sm text-gray-400">Перші рядки з’являться після перших зіграних дуелей.</span>
          <RouterLink :to="{ name: routeNames.duels }" class="no-underline">
            <el-button type="primary" class="mt-8">Стати в чергу</el-button>
          </RouterLink>
        </section>

        <section
          v-else-if="duelData"
          class="leaderboard-panel neon-card hud-corners rounded-2xl"
          aria-labelledby="duel-table"
        >
          <header class="leaderboard-panel__head">
            <div class="flex min-w-0 flex-col gap-4">
              <h2 id="duel-table" class="sys-label sys-label--muted">// Рейтинг 1v1</h2>
              <p class="leaderboard-panel__subtitle">
                {{ pluralizeDuelPlayers(duelData.players.length) }} із зіграними дуелями
                <template v-if="duelSearch.trim()"> · знайдено {{ duelRows.length }}</template>
              </p>
            </div>
            <div class="leaderboard-toolbar">
              <el-input
                v-model="duelSearch"
                class="leaderboard-toolbar__search"
                placeholder="Пошук по ніку"
                clearable
                aria-label="Пошук гравця"
              >
                <template #prepend>
                  <PhMagnifyingGlass :size="16" />
                </template>
              </el-input>
              <RouterLink :to="{ name: routeNames.duels }" class="no-underline">
                <el-button type="primary">
                  <PhSword :size="16" weight="fill" />
                  <span class="ml-6">Грати 1v1</span>
                </el-button>
              </RouterLink>
            </div>
          </header>

          <DuelLeaderboardTable v-if="duelRows.length" :rows="duelRows" :highlight-id="authStore.user?.id ?? null" />
          <p v-else class="leaderboard-panel__empty">
            Нікого не знайдено за запитом «{{ duelSearch.trim() }}»
          </p>
        </section>
      </template>

      <!-- ─── Error ────────────────────────────────────────────────────── -->
      <section v-else-if="error && !data" class="leaderboard-error neon-card hud-corners rounded-2xl">
        <PhWarningOctagon :size="28" weight="duotone" class="text-pink-400" />
        <div class="flex flex-col gap-4">
          <span class="text-base font-semibold text-white">Не вдалося завантажити таблицю лідерів</span>
          <span class="text-sm text-gray-400">{{ errorMessage }}</span>
        </div>
        <el-button type="primary" class="ml-auto" @click="refetch()">
          Спробувати ще раз
        </el-button>
      </section>

      <!-- ─── Skeleton ─────────────────────────────────────────────────── -->
      <template v-else-if="isPending">
        <div class="grid gap-12 md:grid-cols-3">
          <span
            v-for="n in 3"
            :key="`podium-${n}`"
            class="skeleton-bone block h-[220px] !rounded-2xl"
            :style="{ '--skeleton-delay': `${n * 80}ms` }"
          />
        </div>
        <span class="skeleton-bone block h-[520px] !rounded-2xl" :style="{ '--skeleton-delay': '320ms' }" />
      </template>

      <!-- ─── Board ────────────────────────────────────────────────────── -->
      <template v-else-if="data">
        <!-- Порожня платформа: ще жодного матчу чи трофею -->
        <section v-if="!data.players.length" class="leaderboard-empty neon-card hud-corners rounded-2xl">
          <PhTrophy :size="40" weight="duotone" class="text-gold" />
          <span class="text-base font-semibold text-white">Таблиця ще порожня</span>
          <span class="text-sm text-gray-400">
            Перші рядки з’являться після перших зіграних матчів у турнірах платформи.
          </span>
        </section>

        <template v-else>
          <!-- 01 · П’єдестал -->
          <section class="flex flex-col gap-12" aria-labelledby="leaderboard-podium">
            <h2 id="leaderboard-podium" class="sys-label sys-label--muted">// 01 · Топ-3 за рахунком</h2>
            <LeaderboardPodium :rows="podiumRows" />
          </section>

          <!-- 02 · Таблиця -->
          <section class="leaderboard-panel neon-card hud-corners rounded-2xl" aria-labelledby="leaderboard-table">
            <header class="leaderboard-panel__head">
              <div class="flex min-w-0 flex-col gap-4">
                <h2 id="leaderboard-table" class="sys-label sys-label--muted">// 02 · Повний рейтинг</h2>
                <p class="leaderboard-panel__subtitle">
                  {{ pluralizeLeaderboardPlayers(data.players.length) }} з матчами чи трофеями
                  <template v-if="search.trim()"> · знайдено {{ visibleRows.length }}</template>
                </p>
              </div>

              <div class="leaderboard-toolbar">
                <el-input
                  v-model="search"
                  class="leaderboard-toolbar__search"
                  placeholder="Пошук по ніку"
                  clearable
                  aria-label="Пошук гравця"
                >
                  <template #prepend>
                    <PhMagnifyingGlass :size="16" />
                  </template>
                </el-input>

                <el-select
                  v-model="sortKey"
                  class="leaderboard-toolbar__sort"
                  aria-label="Сортувати за"
                >
                  <template #prefix>
                    <PhSortDescending :size="16" weight="bold" />
                  </template>
                  <el-option
                    v-for="option in leaderboardSortOptions"
                    :key="option.key"
                    :label="option.label"
                    :value="option.key"
                  />
                </el-select>

                <!-- Формула рахунку — ваги приходять із бекенду, тож підказка ніколи не бреше -->
                <el-popover
                  trigger="click"
                  placement="bottom-end"
                  :width="320"
                  popper-class="leaderboard-formula"
                >
                  <template #reference>
                    <el-button class="leaderboard-toolbar__formula" aria-label="Як рахується рахунок">
                      <PhQuestion :size="16" weight="bold" />
                      <span class="ml-6 hidden md:inline">Формула</span>
                    </el-button>
                  </template>
                  <div class="flex w-full flex-col gap-8">
                    <span class="sys-label sys-label--gold">// Як рахується рахунок</span>
                    <ul class="m-0 flex list-none flex-col gap-4 p-0 text-[12px] leading-snug text-white/80">
                      <li v-for="line in formulaLines" :key="line">{{ line }}</li>
                    </ul>
                    <span class="text-[11px] leading-snug text-white/45">
                      MMR показуємо для довідки — до рахунку він не входить.
                    </span>
                  </div>
                </el-popover>
              </div>
            </header>

            <LeaderboardTable
              v-if="visibleRows.length"
              :rows="visibleRows"
              :sort-key="sortKey"
              :highlight-id="authStore.user?.id ?? null"
            />
            <p v-else class="leaderboard-panel__empty">
              Нікого не знайдено за запитом «{{ search.trim() }}»
            </p>
          </section>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhArrowsClockwise,
  PhMagnifyingGlass,
  PhQuestion,
  PhSortDescending,
  PhSword,
  PhTrophy,
  PhWarningOctagon
} from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { useGetLeaderboard } from '@/views/leaderboard/leaderboard.queries'
import { useGetDuelLeaderboard } from '@/views/duels/duels.queries'
import { useDuelBotsStatus } from '@/views/duels/composables/use-duel-bots-status'
import { duelPlayerName, pluralizeDuelPlayers } from '@/views/duels/duels.utils'
import DuelBotsStatusStrip from '@/views/duels/components/DuelBotsStatusStrip.vue'
import DuelLeaderboardTable from '@/views/duels/components/DuelLeaderboardTable.vue'
import type { TDuelLeaderboardRow } from '@/api/types/api.types'
import {
  DEFAULT_LEADERBOARD_SORT,
  describeLeaderboardWeights,
  leaderboardRowMatchesSearch,
  leaderboardSortOptions,
  pluralizeLeaderboardPlayers,
  sortLeaderboardRows
} from '@/views/leaderboard/leaderboard.utils'
import { formatAnalyticsTime } from '@/views/analytics/analytics.utils'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import LeaderboardPodium from './components/LeaderboardPodium.vue'
import LeaderboardTable from './components/LeaderboardTable.vue'

const PODIUM_SIZE = 3

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// ─── Перемикач дошки: `?board=1v1` → дуелі, інакше турнірний рейтинг ───────
const boardOptions: { value: TLeaderboardBoard; label: string; icon: Component }[] = [
  { value: 'tournament', label: 'Турніри', icon: PhTrophy },
  { value: '1v1', label: '1v1', icon: PhSword }
]

const board = computed<TLeaderboardBoard>(() => (route.query.board === '1v1' ? '1v1' : 'tournament'))
const isDuelBoard = computed(() => board.value === '1v1')

function setBoard (next: TLeaderboardBoard) {
  if (next === board.value) return
  const query = { ...route.query }
  if (next === '1v1') query.board = '1v1'
  else delete query.board
  router.replace({ query }).catch(() => { /* тихо */ })
}

const { data, error, isPending, isLoading, refetch } = useGetLeaderboard(() => !isDuelBoard.value)

// ─── 1v1 ──────────────────────────────────────────────────────────────────
const {
  data: duelData,
  error: duelError,
  isPending: duelPending,
  isLoading: duelLoading,
  refetch: duelRefetch
} = useGetDuelLeaderboard(() => isDuelBoard.value)
const { bots, isError: botsError } = useDuelBotsStatus()

const duelSearch = ref('')
const duelErrorMessage = computed(() =>
  duelError.value ? getApiErrorMessage(duelError.value, 'Перевірте з’єднання та спробуйте ще раз') : ''
)
const duelRows = computed<TDuelLeaderboardRow[]>(() => {
  const needle = duelSearch.value.trim().toLowerCase()
  const rows = duelData.value?.players ?? []
  if (!needle) return rows
  return rows.filter((row) =>
    duelPlayerName(row.player).toLowerCase().includes(needle) ||
    (row.player.discordUsername ?? '').toLowerCase().includes(needle)
  )
})

const search = ref('')
const sortKey = ref<TLeaderboardSortKey>(DEFAULT_LEADERBOARD_SORT)

const generatedAt = computed(() => formatAnalyticsTime(data.value?.generatedAt))
const errorMessage = computed(() =>
  error.value ? getApiErrorMessage(error.value, 'Перевірте з’єднання та спробуйте ще раз') : ''
)

/** П’єдестал завжди за загальним рахунком — сортування таблиці його не чіпає. */
const podiumRows = computed<TLeaderboardRow[]>(() =>
  (data.value?.players ?? []).filter((row) => row.position <= PODIUM_SIZE)
)

const visibleRows = computed<TLeaderboardRow[]>(() => {
  const rows = (data.value?.players ?? []).filter((row) => leaderboardRowMatchesSearch(row, search.value))
  return sortLeaderboardRows(rows, sortKey.value)
})

const formulaLines = computed(() => (data.value ? describeLeaderboardWeights(data.value.weights) : []))
</script>

<style scoped>
.leaderboard-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-top: 28px;
}

.leaderboard-head__title {
  font-family: var(--ds-font-display);
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
  text-shadow: var(--ds-neon-text-subtle);
}

@media (min-width: 768px) {
  .leaderboard-head__title {
    font-size: 34px;
  }
}

.leaderboard-head__subtitle {
  font-size: 14px;
  color: var(--ds-text-muted);
}

.leaderboard-head__aside {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

/* ─── Перемикач дошки ────────────────────────────────────────────────────── */
.board-switch {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.18);
  background: rgba(7, 8, 15, 0.55);
}

.board-switch__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
  cursor: pointer;
  transition: background-color var(--ds-duration-fast) ease, color var(--ds-duration-fast) ease;
}

.board-switch__tab:hover {
  color: var(--ds-text-strong);
}

.board-switch__tab.is-active {
  background: rgba(var(--ds-primary-rgb), 0.16);
  color: var(--ds-primary);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.4);
}

.leaderboard-head__stamp {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.leaderboard-head__dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--ds-gold);
  box-shadow: 0 0 8px rgba(var(--ds-gold-rgb), 0.9);
}

.leaderboard-error,
.leaderboard-empty {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}

.leaderboard-empty {
  flex-direction: column;
  gap: 8px;
  padding: 48px 24px;
  text-align: center;
}

/* ─── Панель таблиці ─────────────────────────────────────────────────────── */
.leaderboard-panel {
  --hud-corner-inset: 8px;

  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  overflow: hidden;
}

@media (min-width: 768px) {
  .leaderboard-panel {
    padding: 24px;
  }
}

.leaderboard-panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 16px;
}

.leaderboard-panel__subtitle {
  font-size: 13px;
  line-height: 1.45;
  color: var(--ds-text-muted);
}

.leaderboard-panel__empty {
  padding: 32px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.leaderboard-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

@media (min-width: 768px) {
  .leaderboard-toolbar {
    width: auto;
  }
}

.leaderboard-toolbar__search {
  flex: 1 1 200px;
  min-width: 0;
}

@media (min-width: 768px) {
  .leaderboard-toolbar__search {
    flex: 0 0 260px;
  }
}

.leaderboard-toolbar__sort {
  flex: 1 1 150px;
}

@media (min-width: 768px) {
  .leaderboard-toolbar__sort {
    flex: 0 0 180px;
  }
}

.leaderboard-toolbar__formula {
  flex-shrink: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .leaderboard-panel {
    animation: leaderboard-panel-in 640ms var(--ds-ease-out) both;
    animation-delay: 240ms;
  }

  @keyframes leaderboard-panel-in {
    from {
      opacity: 0;
      transform: translateY(14px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
