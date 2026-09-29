<template>
  <div class="duels relative flex w-full flex-col text-white">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[280px]
             bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(var(--ds-primary-rgb),0.1),transparent_70%)]"
      aria-hidden="true"
    />

    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-16 pb-40 lg:px-24">
      <!-- ─── Head ─────────────────────────────────────────────────────── -->
      <header class="duels-head">
        <div class="flex min-w-0 flex-col gap-6">
          <span class="sys-label">// Рейтингові дуелі</span>
          <h1 class="duels-head__title">1v1 Ліга</h1>
          <p class="duels-head__subtitle">
            Solo Mid, бот-хост ліги, підбір за рейтингом. +25 за перемогу, −25 за поразку.
          </p>
        </div>
        <RouterLink
          :to="{ name: routeNames.leaderboard, query: { board: '1v1' } }"
          class="no-underline"
        >
          <el-button>
            <PhRanking :size="16" weight="bold" />
            <span class="ml-6">Повна таблиця</span>
          </el-button>
        </RouterLink>
      </header>

      <!-- Стан пулу ботів: червоний і без черги, коли жоден не онлайн -->
      <DuelBotsStatusStrip :bots="bots" :is-error="botsError" />

      <!-- Знайдено пару — увесь екран стає зеленою кнопкою «Прийняти» -->
      <DuelAcceptOverlay
        :duel="status?.activeDuel ?? null"
        :me-id="meId"
        :accepting="accepting"
        @accept="accept"
      />

      <!-- ─── Main grid ────────────────────────────────────────────────── -->
      <div class="grid gap-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <!-- Ліва колонка: результат → активна дуель / черга -->
        <div class="flex min-w-0 flex-col gap-16">
          <DuelResultBanner
            v-if="resultBannerDuel"
            :duel="resultBannerDuel"
            :me-id="meId"
            @dismiss="dismissedDuelId = resultBannerDuel.id"
          />

          <DuelActiveCard
            v-if="status?.activeDuel"
            :duel="status.activeDuel"
            :me-id="meId"
            :is-admin="authStore.isAdmin.isAdmin"
            :cancelling="cancelling"
            @cancel="cancel"
            @admin-cancel="adminCancel"
          />

          <DuelQueuePanel
            v-else
            :status="status"
            :is-logged-in="isLoggedIn"
            :is-pending="isPending"
            :is-error="isError"
            :joining="joining"
            :leaving="leaving"
            :bots-offline="botsOffline"
            @join="join"
            @leave="leave"
            @login="openLogin"
          />

          <!-- Як це працює -->
          <section class="duels-how neon-card hud-corners rounded-2xl">
            <h2 class="sys-label sys-label--muted">// Як це працює</h2>
            <ol class="duels-how__list">
              <li>Станьте в чергу — потрібен прив’язаний Steam-акаунт.</li>
              <li>Знайдемо суперника з рейтингом ±50 (вікно росте, поки ви чекаєте).</li>
              <li>Прийміть матч за 30 секунд. Хто не прийме — −{{ DUEL_CANCEL_PENALTY }} і пауза.</li>
              <li>Бот створить закрите лобі 1v1 Mid і надішле інвайт у Dota 2.</li>
              <li>Зайдіть у лобі за 5 хвилин і станьте на сторону — гра стартує сама.</li>
              <li>Результат зчитується з Dota автоматично: +25 переможцю, −25 переможеному.</li>
              <li>Скасувати матч можна до старту гри — це коштує −{{ DUEL_CANCEL_PENALTY }}.</li>
            </ol>
          </section>
        </div>

        <!-- Права колонка: мої дуелі + топ-10 -->
        <div class="flex min-w-0 flex-col gap-16">
          <section v-if="isLoggedIn" class="duels-panel neon-card hud-corners rounded-2xl">
            <header class="flex items-center justify-between gap-10">
              <h2 class="sys-label sys-label--muted">// Мої дуелі</h2>
              <span v-if="myRating" class="duels-panel__meta">
                {{ myRating.wins }}W · {{ myRating.losses }}L
                <template v-if="myRating.winrate != null"> · {{ formatDuelPercent(myRating.winrate) }}</template>
              </span>
            </header>
            <template v-if="profilePending">
              <span v-for="n in 3" :key="n" class="skeleton-bone block h-[44px] !rounded-xl" />
            </template>
            <DuelHistoryList
              v-else
              :duels="myDuels"
              :player-id="meId"
              empty-text="Ще жодної дуелі — станьте в чергу"
            />
          </section>

          <section class="duels-panel neon-card hud-corners rounded-2xl">
            <header class="flex items-center justify-between gap-10">
              <h2 class="sys-label sys-label--gold">// Топ-10</h2>
              <span v-if="leaderboard" class="duels-panel__meta">
                {{ pluralizeDuelPlayers(leaderboard.players.length) }} у рейтингу
              </span>
            </header>
            <template v-if="leaderboardPending">
              <span v-for="n in 5" :key="n" class="skeleton-bone block h-[44px] !rounded-xl" />
            </template>
            <p v-else-if="leaderboardError" class="duels-panel__empty text-error">
              Не вдалося завантажити рейтинг
            </p>
            <p v-else-if="!topRows.length" class="duels-panel__empty">
              Таблиця ще порожня — перші рядки з’являться після перших дуелей.
            </p>
            <DuelLeaderboardTable v-else :rows="topRows" :highlight-id="meId" />
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhRanking } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { useDuelBotsStatus } from '@/views/duels/composables/use-duel-bots-status'
import { useDuelStatus } from '@/views/duels/composables/use-duel-status'
import { useGetDuelLeaderboard, useGetDuelPlayerProfile } from '@/views/duels/duels.queries'
import {
  DUEL_CANCEL_PENALTY,
  DUEL_RESULT_BANNER_TTL_MS,
  formatDuelPercent,
  isWithinLast,
  pluralizeDuelPlayers
} from '@/views/duels/duels.utils'
import DuelAcceptOverlay from '@/views/duels/components/DuelAcceptOverlay.vue'
import DuelActiveCard from '@/views/duels/components/DuelActiveCard.vue'
import DuelBotsStatusStrip from '@/views/duels/components/DuelBotsStatusStrip.vue'
import DuelHistoryList from '@/views/duels/components/DuelHistoryList.vue'
import DuelLeaderboardTable from '@/views/duels/components/DuelLeaderboardTable.vue'
import DuelQueuePanel from '@/views/duels/components/DuelQueuePanel.vue'
import DuelResultBanner from '@/views/duels/components/DuelResultBanner.vue'
import type { TDuel } from '@/api/types/api.types'

const TOP_SIZE = 10

const authStore = useAuthStore()
const { open } = useAppModals()
const route = useRoute()

const meId = computed(() => authStore.user?.id ?? null)

const {
  status,
  isPending,
  isError,
  isLoggedIn,
  joining,
  leaving,
  accepting,
  cancelling,
  join,
  leave,
  accept,
  cancel,
  adminCancel,
  invalidateDuelQueries
} = useDuelStatus()

const { bots, isError: botsError, isOffline: botsOffline } = useDuelBotsStatus()

const { data: leaderboard, isPending: leaderboardPending, error: leaderboardError } = useGetDuelLeaderboard()
const topRows = computed(() => (leaderboard.value?.players ?? []).slice(0, TOP_SIZE))

const profile = useGetDuelPlayerProfile(() => meId.value)
const profilePending = computed(() => !!meId.value && profile.isPending.value)
const myDuels = computed<TDuel[]>(() => profile.data.value?.recent ?? [])
const myRating = computed(() => status.value?.rating ?? profile.data.value?.rating ?? null)

// ─── Банер результату: остання завершена дуель, не старша за 10 хв і не закрита ──
const now = useNow({ interval: 5000 })
const dismissedDuelId = ref<string | null>(null)
const resultBannerDuel = computed<TDuel | null>(() => {
  const duel = status.value?.lastFinishedDuel
  if (!duel || duel.id === dismissedDuelId.value) return null
  return isWithinLast(duel.finishedAt, DUEL_RESULT_BANNER_TTL_MS, now.value) ? duel : null
})

// Дуель завершилась (активна зникла) → історія, рейтинг і топ застаріли.
watch(
  () => status.value?.activeDuel?.id ?? null,
  (current, previous) => {
    if (previous && !current) invalidateDuelQueries()
  }
)

function openLogin () {
  open('LoginModal', { redirectTo: route.fullPath })
}
</script>

<style scoped>
.duels-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-top: 28px;
}

.duels-head__title {
  font-family: var(--ds-font-display);
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
  text-shadow: var(--ds-neon-text-subtle);
}

@media (min-width: 768px) {
  .duels-head__title {
    font-size: 34px;
  }
}

.duels-head__subtitle {
  font-size: 14px;
  color: var(--ds-text-muted);
}

.duels-panel,
.duels-how {
  --hud-corner-inset: 8px;

  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  overflow: hidden;
}

.duels-panel__meta {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.duels-panel__empty {
  padding: 16px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.duels-how__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-text-muted);
}

.duels-how__list li::marker {
  font-family: var(--ds-font-mono);
  color: var(--ds-primary);
}
</style>
