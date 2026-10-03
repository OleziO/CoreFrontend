<template>
  <div class="duels relative flex w-full flex-col text-white">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[280px]
             bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(var(--ds-primary-rgb),0.1),transparent_70%)]"
      aria-hidden="true"
    />

    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-16 pb-40 lg:px-24">
      <!-- ─── Head ─────────────────────────────────────────────────────── -->
      <header class="duels-head duels-reveal" style="--i: 0">
        <div class="flex min-w-0 flex-col gap-6">
          <span class="sys-label">// Рейтингові дуелі</span>
          <h1 class="duels-head__title">Дуелі</h1>
          <p class="duels-head__subtitle">
            Solo Mid проти суперника свого рівня. Героя роздає ліга — випадково, на кожну дуель.
          </p>
        </div>
        <div class="duels-head__aside">
          <!-- Стан пулу ботів: червона пігулка, коли жоден не онлайн; деталі — у tooltip -->
          <DuelBotsStatusStrip :bots="bots" :is-error="botsError" minimal />
          <el-button title="Як це працює" @click="open('DuelHowItWorksModal')">
            <PhQuestion :size="16" weight="bold" />
            <span class="ml-6">Як це працює</span>
          </el-button>
          <!-- Адмін: усі дуелі ліги зі статусом обробки та видаленням -->
          <el-button
            v-if="isAdmin"
            title="Усі дуелі: статус обробки й видалення"
            @click="open('DuelAdminMatchesModal', { onDeleted: invalidateDuelQueries })"
          >
            <PhListChecks :size="16" weight="bold" />
            <span class="ml-6">Усі дуелі</span>
          </el-button>
          <RouterLink
            :to="{ name: routeNames.leaderboard, query: { board: 'duels' } }"
            class="no-underline"
          >
            <el-button title="Повна таблиця">
              <PhRanking :size="16" weight="bold" />
              <span class="ml-6">Повна таблиця</span>
            </el-button>
          </RouterLink>
        </div>
      </header>

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
        <div class="duels-reveal flex min-w-0 flex-col gap-16" style="--i: 1">
          <!-- Результат або «обробка»: зіграна дуель (PROCESSING) висить тут, поки не прийде результат -->
          <Transition name="duels-banner">
            <DuelResultBanner
              v-if="resultBannerDuel"
              :key="bannerKeyOf(resultBannerDuel)"
              :duel="resultBannerDuel"
              :me-id="meId"
              @dismiss="dismissedBannerKey = bannerKeyOf(resultBannerDuel)"
            />
          </Transition>

          <!-- Черга ↔ активна дуель: одна змінює іншу, не накладаючись -->
          <Transition name="duels-swap" mode="out-in">
            <DuelActiveCard
              v-if="status?.activeDuel"
              key="active"
              :duel="status.activeDuel"
              :me-id="meId"
              :is-admin="authStore.isAdmin.isAdmin"
              :cancelling="cancelling"
              :inviting="inviting"
              :restarting="restarting"
              @cancel="cancel"
              @admin-cancel="adminCancel"
              @invite="requestInvite"
              @restart="requestRestart"
            />

            <DuelQueuePanel
              v-else
              key="queue"
              :status="status"
              :is-logged-in="isLoggedIn"
              :is-pending="isPending"
              :is-error="isError"
              :joining="joining"
              :leaving="leaving"
              :realtime="realtime"
              :bots-offline="botsOffline"
              @join="onJoin"
              @leave="leave"
              @login="openLogin"
            />
          </Transition>

          <!-- Дружні дуелі: виклики друзів поза чергою, ±10, до 3 прийнятих на день -->
          <DuelChallengesPanel
            v-if="status?.challenges"
            :challenges="status.challenges"
            :active-duel="status.activeDuel"
            :is-busy="isChallengeBusy"
            :bots-offline="botsOffline"
            @open="open('DuelChallengeFriendModal')"
            @accept="acceptChallenge"
            @decline="declineChallenge"
            @cancel="cancelChallenge"
          />

          <!-- Турніри за паролем: медіа створюють, гравці входять за паролем і шукають суперника всередині -->
          <DuelTournamentsPanel
            v-if="tournaments.length || canCreateTournament"
            :tournaments="tournaments"
            :is-pending="tournamentsPending"
            :is-logged-in="isLoggedIn"
            :can-create="canCreateTournament"
            :can-queue="canQueueTournament"
            :blocked-reason="tournamentBlockedReason"
            :queued-tournament-id="status?.queue?.tournament?.id ?? null"
            :joining="joining"
            @create="openCreateTournament"
            @login="openLogin"
            @enter="openJoinTournament"
            @queue="onTournamentQueue"
          />
        </div>

        <!-- Права колонка: мої дуелі + топ-10 -->
        <div class="duels-reveal flex min-w-0 flex-col gap-16" style="--i: 2">
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
              <h2 class="sys-label sys-label--gold">// Топ-10 сезону</h2>
              <span v-if="leaderboard" class="duels-panel__meta">
                {{ pluralizeDuelPlayers(leaderboard.players.length) }} у рейтингу
              </span>
            </header>
            <DuelSeasonBanner v-if="season" :season="season" />
            <template v-if="leaderboardPending">
              <span v-for="n in 5" :key="n" class="skeleton-bone block h-[44px] !rounded-xl" />
            </template>
            <p v-else-if="leaderboardError" class="duels-panel__empty text-error">
              Не вдалося завантажити рейтинг
            </p>
            <p v-else-if="!topRows.length" class="duels-panel__empty">
              Таблиця ще порожня — перші рядки з’являться після перших дуелей.
            </p>
            <DuelLeaderboardTable v-else :rows="topRows" :highlight-id="meId" :prizes="season?.prizes" />
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhListChecks, PhQuestion, PhRanking } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { hasPlayerRole } from '@/core/helpers'
import { ERole } from '@/types/general.enums'
import { useDuelBotsStatus } from '@/views/duels/composables/use-duel-bots-status'
import { useDuelChallenges } from '@/views/duels/composables/use-duel-challenges'
import { useDuelSounds } from '@/views/duels/composables/use-duel-sounds'
import { useDuelStatus } from '@/views/duels/composables/use-duel-status'
import {
  useGetDuelCurrentSeason,
  useGetDuelLeaderboard,
  useGetDuelPlayerProfile,
  useGetDuelTournaments
} from '@/views/duels/duels.queries'
import {
  DUEL_HOW_IT_WORKS_STORAGE_KEY,
  DUEL_RESULT_BANNER_TTL_MS,
  duelQueueBlockedLabels,
  formatDuelPercent,
  isDuelProcessing,
  isWithinLast,
  pluralizeDuelPlayers
} from '@/views/duels/duels.utils'
import DuelAcceptOverlay from '@/views/duels/components/DuelAcceptOverlay.vue'
import DuelActiveCard from '@/views/duels/components/DuelActiveCard.vue'
import DuelBotsStatusStrip from '@/views/duels/components/DuelBotsStatusStrip.vue'
import DuelChallengesPanel from '@/views/duels/components/DuelChallengesPanel.vue'
import DuelHistoryList from '@/views/duels/components/DuelHistoryList.vue'
import DuelLeaderboardTable from '@/views/duels/components/DuelLeaderboardTable.vue'
import DuelQueuePanel from '@/views/duels/components/DuelQueuePanel.vue'
import DuelResultBanner from '@/views/duels/components/DuelResultBanner.vue'
import DuelSeasonBanner from '@/views/duels/components/DuelSeasonBanner.vue'
import DuelTournamentsPanel from '@/views/duels/components/DuelTournamentsPanel.vue'
import type { TDuel, TDuelTournament } from '@/api/types/api.types'

const TOP_SIZE = 10

const authStore = useAuthStore()
const { open } = useAppModals()
const route = useRoute()

const meId = computed(() => authStore.user?.id ?? null)
const isAdmin = computed(() => authStore.isAdmin.isAdmin)

const {
  status,
  isPending,
  isError,
  isLoggedIn,
  realtime,
  joining,
  leaving,
  accepting,
  cancelling,
  inviting,
  restarting,
  join,
  leave,
  accept,
  cancel,
  requestInvite,
  requestRestart,
  adminCancel,
  invalidateDuelQueries
} = useDuelStatus()

const { bots, isError: botsError, isOffline: botsOffline } = useDuelBotsStatus()

/** Виклики друзів: відповідь бекенду — той самий статус, тож панель оновлюється без перезапиту. */
const {
  isBusy: isChallengeBusy,
  accept: acceptChallenge,
  decline: declineChallenge,
  cancel: cancelChallenge
} = useDuelChallenges()

// Клік «Стати в чергу» — жест користувача: розблоковуємо звук, щоб «Матч знайдено» точно пролунав.
const { unlock: unlockSounds } = useDuelSounds()
function onJoin () {
  unlockSounds()
  return join()
}

// «Як це працює» відкривається саме при вході на сторінку, поки гравець не натисне «Зрозуміло».
// Далі — лише кнопкою в шапці. Прапорець живе в localStorage і ставиться в самій модалці.
const howItWorksConfirmed = useLocalStorage<boolean>(DUEL_HOW_IT_WORKS_STORAGE_KEY, false)
onMounted(() => {
  if (!howItWorksConfirmed.value) open('DuelHowItWorksModal')
})

const { data: leaderboard, isPending: leaderboardPending, error: leaderboardError } = useGetDuelLeaderboard()
const topRows = computed(() => (leaderboard.value?.players ?? []).slice(0, TOP_SIZE))
/** Поточний сезон: межі, призи місць (у таблиці — біля власників місць зараз). */
const { data: season, refetch: refetchSeason } = useGetDuelCurrentSeason()

const profile = useGetDuelPlayerProfile(() => meId.value)
const profilePending = computed(() => !!meId.value && profile.isPending.value)
const myDuels = computed<TDuel[]>(() => profile.data.value?.recent ?? [])
const myRating = computed(() => status.value?.rating ?? profile.data.value?.rating ?? null)

// ─── Банер результату: остання зіграна дуель — «обробка», поки триває, або результат не старший за 10 хв ──
// Ключ закриття включає стан: закритий банер «обробки» знову з’явиться вже з результатом.
const now = useNow({ interval: 5000 })
const dismissedBannerKey = ref<string | null>(null)
const bannerKeyOf = (duel: TDuel) => `${duel.id}:${duel.state}`
const resultBannerDuel = computed<TDuel | null>(() => {
  const duel = status.value?.lastFinishedDuel
  if (!duel || bannerKeyOf(duel) === dismissedBannerKey.value) return null
  if (isDuelProcessing(duel)) return duel
  return isWithinLast(duel.finishedAt, DUEL_RESULT_BANNER_TTL_MS, now.value) ? duel : null
})

// Дуель завершилась (активна зникла) або результат «обробки» прийшов → історія, рейтинг і топ застаріли.
watch(
  () => status.value?.activeDuel?.id ?? null,
  (current, previous) => {
    if (previous && !current) invalidateDuelQueries()
  }
)
// Кінець сезону: поки підбиваються підсумки — банер «Підбиваємо підсумки»; після — новий сезон, порожня таблиця й історія.
watch(
  () => status.value?.queueBlockedReason === 'season_closing',
  (closing, wasClosing) => {
    if (closing) refetchSeason().catch(() => { /* тихо */ })
    else if (wasClosing) invalidateDuelQueries()
  }
)
watch(
  () => status.value?.lastFinishedDuel?.state ?? null,
  (current, previous) => {
    if (previous === 'PROCESSING' && current && current !== 'PROCESSING') invalidateDuelQueries()
  }
)

function openLogin () {
  open('LoginModal', { redirectTo: route.fullPath })
}

// ─── Турніри за паролем ──────────────────────────────────────────────────────
const router = useRouter()
const {
  data: tournaments,
  isPending: tournamentsPending,
  refetch: refetchTournaments
} = useGetDuelTournaments(() => meId.value)

/** Створювати стрім-турніри можуть стрімери (роль «Медіа») та адміни; керувати конкретним — організатор і адміни (`canManage`). */
const canCreateTournament = computed(() =>
  isAdmin.value || hasPlayerRole(authStore.user?.roles, ERole.MEDIA)
)

/**
 * «Вже в черзі» не блокує: з черги ліги можна перейти в чергу турніру (бекенд переносить запис).
 * Кінець сезону теж: закривається лише черга ліги, турніри грають далі.
 */
const TOURNAMENT_QUEUE_OPEN_REASONS = ['already_queued', 'season_closing'] as const
const isTournamentQueueOpenReason = (reason: string | null | undefined) =>
  TOURNAMENT_QUEUE_OPEN_REASONS.some(r => r === reason)
const canQueueTournament = computed(() =>
  !!status.value && (status.value.canQueue || isTournamentQueueOpenReason(status.value.queueBlockedReason))
)
const tournamentBlockedReason = computed(() => {
  const reason = status.value?.queueBlockedReason
  if (!reason || isTournamentQueueOpenReason(reason)) return ''
  return duelQueueBlockedLabels[reason]
})

function openCreateTournament () {
  open('DuelTournamentFormModal', {
    // Пароль організатор бачить на сторінці турніру — ведемо туди одразу.
    onSaved: (t: TDuelTournament) => router.push({ name: routeNames.duelTournament, params: { id: t.id } })
  })
}

function openJoinTournament (tournament: TDuelTournament) {
  open('DuelTournamentJoinModal', {
    tournament,
    onJoined: () => { refetchTournaments().catch(() => { /* тихо */ }) }
  })
}

function onTournamentQueue (tournament: TDuelTournament) {
  unlockSounds()
  return join(tournament.id)
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
  max-width: 560px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ds-text-muted);
}

.duels-head__aside {
  display: flex;
  align-items: center;
  gap: 8px;
}

/*
 * Телефон: пігулка ботів і обидві кнопки — в один рядок на всю ширину. Сітка, а не flex:
 * колонки не можуть вилізти за контейнер, тож горизонтального скролу не буде.
 */
@media (max-width: 767px) {
  .duels-head__aside {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
    width: 100%;
    gap: 8px;
  }

  .duels-head__aside > * {
    min-width: 0;
  }

  .duels-head__aside > a {
    display: flex;
  }

  .duels-head__aside :deep(.el-button) {
    width: 100%;
    min-width: 0;
    padding-left: 10px;
    padding-right: 10px;
    font-size: 13px;
  }
}

@media (max-width: 420px) {
  /* Зовсім вузько: підписи кнопок ховаємо, лишаються іконки з tooltip; пігулка забирає решту */
  .duels-head__aside {
    grid-template-columns: minmax(0, 1fr) auto auto;
  }

  .duels-head__aside :deep(.el-button .ml-6) {
    display: none;
  }

  .duels-head__aside :deep(.el-button) {
    width: auto;
    padding-left: 12px;
    padding-right: 12px;
  }
}

.duels-panel {
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

/* ─── Переходи між блоками ───────────────────────────────────────────────── */
.duels-banner-enter-active {
  transition: opacity 320ms ease, transform 420ms var(--ds-ease-out);
}

.duels-banner-leave-active {
  transition: opacity var(--ds-duration-base) ease, transform var(--ds-duration-base) var(--ds-ease-in-out);
}

.duels-banner-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.duels-banner-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.duels-swap-enter-active {
  transition: opacity 260ms ease, transform 360ms var(--ds-ease-out);
}

.duels-swap-leave-active {
  transition: opacity 180ms ease, transform 180ms var(--ds-ease-in-out);
}

.duels-swap-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}

.duels-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.99);
}

/* ─── Поява сторінки: шапка → ліва колонка → права ───────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  .duels-reveal {
    animation: duels-reveal 520ms var(--ds-ease-out) both;
    animation-delay: calc(var(--i, 0) * 90ms);
  }

  @keyframes duels-reveal {
    from {
      opacity: 0;
      transform: translateY(12px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
