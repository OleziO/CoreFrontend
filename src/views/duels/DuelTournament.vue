<template>
  <div class="dt relative flex w-full flex-col text-white">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[280px]
             bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(var(--ds-gold-rgb),0.08),transparent_70%)]"
      aria-hidden="true"
    />

    <div class="relative mx-auto flex w-full max-w-5xl flex-col gap-20 px-16 pb-40 lg:px-24">
      <RouterLink :to="{ name: routeNames.duels }" class="dt__back no-underline">
        <PhArrowLeft :size="14" weight="bold" />
        Дуелі
      </RouterLink>

      <!-- ─── Head ─────────────────────────────────────────────────────── -->
      <template v-if="tournamentPending && !tournament">
        <span class="skeleton-bone block h-[88px] !rounded-2xl" />
      </template>

      <p v-else-if="tournamentError && !tournament" class="dt__empty text-error">
        Турнір не знайдено або не вдалося завантажити
      </p>

      <template v-else-if="tournament">
        <header class="dt-head">
          <div class="flex min-w-0 flex-col gap-6">
            <span class="sys-label sys-label--gold inline-flex items-center gap-6">
              <PhBroadcast :size="12" weight="bold" aria-hidden="true" />
              // Стрім-турнір 1v1
            </span>
            <h1 class="dt-head__title">{{ tournament.name }}</h1>
            <p class="dt-head__meta">
              <span class="dt-head__status" :class="isActive ? 'is-active' : 'is-ended'">
                {{ isActive ? 'Триває' : 'Завершено' }}
              </span>
              <span>{{ pluralizeDuelPlayers(tournament.participantsCount) }}</span>
              <span v-if="tournament.createdBy">Стрімер: {{ duelPlayerName(tournament.createdBy) }}</span>
              <span v-if="tournament.endedAt">{{ dayjs(tournament.endedAt).format('DD.MM.YYYY HH:mm') }}</span>
              <span v-else>з {{ dayjs(tournament.createdAt).format('DD.MM.YYYY') }}</span>
            </p>
          </div>

          <!-- Стрім турніру + дія гравця: увійти / ввести пароль / шукати суперника -->
          <div v-if="isActive || tournament.streamUrl" class="dt-head__aside">
            <a
              v-if="tournament.streamUrl"
              :href="tournament.streamUrl"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="dt-stream no-underline"
              :class="{ 'is-live': isActive }"
            >
              <span v-if="isActive" class="dt-stream__dot" aria-hidden="true" />
              <PhBroadcast v-else :size="16" weight="bold" aria-hidden="true" />
              {{ isActive ? 'Стрім наживо' : 'Запис стріму' }}
              <PhArrowSquareOut :size="14" class="opacity-60" aria-hidden="true" />
            </a>
            <template v-if="isActive">
              <el-button v-if="!isLoggedIn" type="primary" @click="openLogin">Увійти, щоб грати</el-button>
              <el-button v-else-if="!tournament.joined" type="primary" @click="openJoin">
                <PhKey :size="16" weight="bold" />
                <span class="ml-6">Увійти за паролем</span>
              </el-button>
              <el-button v-else type="primary" :loading="queueing" @click="queueInTournament">
                <PhSword :size="16" weight="fill" />
                <span class="ml-6">Шукати суперника</span>
              </el-button>
            </template>
          </div>
        </header>

        <!-- ─── Керування: організатор і адміни ─────────────────────────── -->
        <section v-if="tournament.canManage" class="dt-panel neon-card hud-corners rounded-2xl">
          <header class="flex flex-wrap items-center justify-between gap-10">
            <h2 class="sys-label sys-label--muted">// Керування</h2>
            <div class="flex flex-wrap gap-8">
              <template v-if="isActive">
                <el-button size="small" @click="openEdit">
                  <PhPencilSimple :size="14" weight="bold" />
                  <span class="ml-6">Редагувати</span>
                </el-button>
                <el-button size="small" type="danger" plain :loading="ending" @click="endTournament">
                  <PhFlagCheckered :size="14" weight="bold" />
                  <span class="ml-6">Завершити турнір</span>
                </el-button>
              </template>
              <el-button v-if="isAdmin" size="small" type="danger" :loading="deleting" @click="deleteTournament">
                <PhTrash :size="14" weight="bold" />
                <span class="ml-6">Видалити</span>
              </el-button>
            </div>
          </header>

          <div v-if="isActive && tournament.password" class="dt-password">
            <span class="dt-password__label">Пароль</span>
            <code class="dt-password__value">{{ passwordShown ? tournament.password : '••••••••' }}</code>
            <el-button
              size="small"
              text
              :title="passwordShown ? 'Сховати' : 'Показати'"
              @click="passwordShown = !passwordShown"
            >
              <PhEyeSlash v-if="passwordShown" :size="16" />
              <PhEye v-else :size="16" />
            </el-button>
            <el-button size="small" text title="Скопіювати" @click="copyPassword">
              <PhCheck v-if="copied" :size="16" class="text-success" />
              <PhCopy v-else :size="16" />
            </el-button>
          </div>
          <p class="dt-panel__hint">
            <template v-if="isActive">
              Учасники входять за паролем і шукають суперника лише між собою. «Завершити» закриє чергу й скасує
              дуелі, що ще не стартували; ігри, які вже йдуть, дограються і зарахуються.
            </template>
            <template v-else>Турнір завершено — таблиця нижче остаточна й лишається публічною.</template>
          </p>
        </section>
      </template>

      <!-- ─── Таблиця турніру ──────────────────────────────────────────── -->
      <section v-if="tournament" class="dt-panel neon-card hud-corners rounded-2xl">
        <header class="flex items-center justify-between gap-10">
          <h2 class="sys-label sys-label--gold">// Таблиця турніру</h2>
          <span class="dt-panel__meta">±{{ DUEL_RATING_DELTA }} за дуель · старт з 0</span>
        </header>
        <template v-if="leaderboardPending && !leaderboard">
          <span v-for="n in 4" :key="n" class="skeleton-bone block h-[44px] !rounded-xl" />
        </template>
        <p v-else-if="leaderboardError && !leaderboard" class="dt__empty text-error">
          Не вдалося завантажити таблицю
        </p>
        <template v-else>
          <p v-if="!rows.length" class="dt__empty">
            Ще ніхто не увійшов у турнір — перші рядки з’являться, щойно учасники введуть пароль.
          </p>
          <DuelLeaderboardTable
            v-if="rows.length || prizes.length"
            :rows="rows"
            :highlight-id="meId"
            :prizes="prizes"
            :prizes-settled="prizesSettled"
          />
        </template>
        <p v-if="prizes.length" class="dt-panel__hint">
          <span class="dt-prizes-status">
            <PhGift :size="12" weight="fill" aria-hidden="true" />Призи — {{ prizesStatus }}.
          </span>
          Приз отримує гравець, що посідає місце після завершення турніру й зіграв хоча б одну дуель.
          <template v-if="hasVipPrize">VIP нараховується автоматично.</template>
          <template v-if="hasCustomPrize">Власні призи видає стрімер.</template>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ElMessageBox } from 'element-plus'
import { useQueryCache } from '@pinia/colada'
import {
  PhArrowLeft,
  PhArrowSquareOut,
  PhBroadcast,
  PhCheck,
  PhCopy,
  PhEye,
  PhEyeSlash,
  PhFlagCheckered,
  PhGift,
  PhKey,
  PhPencilSimple,
  PhSword,
  PhTrash
} from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import {
  DUEL_TOURNAMENTS_QUERY_KEY,
  useGetDuelTournament,
  useGetDuelTournamentLeaderboard
} from '@/views/duels/duels.queries'
import { duelsService } from '@/views/duels/duels.service'
import { DUEL_RATING_DELTA, duelPlayerName, pluralizeDuelPlayers } from '@/views/duels/duels.utils'
import DuelLeaderboardTable from '@/views/duels/components/DuelLeaderboardTable.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const queryCache = useQueryCache()
const { open } = useAppModals()

const tournamentId = computed(() => String(route.params.id ?? ''))
const meId = computed(() => authStore.user?.id ?? null)
const isLoggedIn = computed(() => !!authStore.token)

const {
  data: tournament,
  isPending: tournamentPending,
  error: tournamentError
} = useGetDuelTournament(() => tournamentId.value, () => meId.value)
const {
  data: leaderboard,
  isPending: leaderboardPending,
  error: leaderboardError
} = useGetDuelTournamentLeaderboard(() => tournamentId.value)

const isActive = computed(() => tournament.value?.status === 'ACTIVE')
const isAdmin = computed(() => authStore.isAdmin.isAdmin)
const rows = computed(() => leaderboard.value?.players ?? [])

// ─── Призи ───────────────────────────────────────────────────────────────────
const prizes = computed(() => tournament.value?.prizes ?? [])
const prizesSettled = computed(() => !!tournament.value?.prizesAwardedAt)
const hasVipPrize = computed(() => prizes.value.some(p => p.kind === 'vip'))
const hasCustomPrize = computed(() => prizes.value.some(p => p.kind === 'custom'))

const prizesStatus = computed(() => {
  if (prizesSettled.value) return 'розіграно'
  if (!isActive.value) return 'дограються останні ігри — потім видамо'
  return 'після завершення турніру'
})

/** Список, сам турнір і таблиця — усе під `['duels', 'tournaments']`. */
function refreshTournament () {
  queryCache.invalidateQueries({ key: [...DUEL_TOURNAMENTS_QUERY_KEY] }).catch(() => { /* тихо */ })
}

// ─── Гравець ─────────────────────────────────────────────────────────────────
function openLogin () {
  open('LoginModal', { redirectTo: route.fullPath })
}

function openJoin () {
  if (!tournament.value) return
  open('DuelTournamentJoinModal', { tournament: tournament.value, onJoined: refreshTournament })
}

/** Черга живе на сторінці дуелей (прийняття матчу, лобі) — стаємо в чергу турніру й переходимо туди. */
const queueing = ref(false)
async function queueInTournament () {
  if (!tournament.value || queueing.value) return
  queueing.value = true
  try {
    await duelsService.joinQueue(tournament.value.id)
    await router.push({ name: routeNames.duels })
  } catch {
    // тост уже показав duelsService
  } finally {
    queueing.value = false
  }
}

// ─── Керування ───────────────────────────────────────────────────────────────
const deleting = ref(false)
/** Лише адмін: турнір і його таблиця зникають; ігри, що вже йдуть, дограються без зміни рейтингу. */
async function deleteTournament () {
  if (!tournament.value || deleting.value) return
  try {
    await ElMessageBox.confirm(
      `Турнір «${tournament.value.name}» і його таблицю буде видалено назавжди. Черга закриється, дуелі, що ще ` +
        'не стартували, скасуються; ігри, які вже йдуть, дограються без зміни рейтингу. ' +
        'Нерозіграні призи не видаються. Скасувати це не можна.',
      'Видалити турнір?',
      { confirmButtonText: 'Видалити', cancelButtonText: 'Ні', type: 'error', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return
  }
  deleting.value = true
  try {
    await duelsService.deleteTournament(tournament.value.id)
    queryCache.invalidateQueries({ key: [...DUEL_TOURNAMENTS_QUERY_KEY] }).catch(() => { /* тихо */ })
    await router.push({ name: routeNames.duels })
  } catch {
    // тост уже показав duelsService
  } finally {
    deleting.value = false
  }
}

const passwordShown = ref(false)
const { copy, copied } = useClipboard({ legacy: true })
function copyPassword () {
  if (tournament.value?.password) copy(tournament.value.password)
}

function openEdit () {
  if (!tournament.value) return
  open('DuelTournamentFormModal', { tournament: tournament.value, onSaved: refreshTournament })
}

const ending = ref(false)
async function endTournament () {
  if (!tournament.value || ending.value) return
  try {
    await ElMessageBox.confirm(
      'Черга турніру закриється, а дуелі, що ще не стартували, буде скасовано без зміни рейтингу. ' +
        'Ігри, які вже йдуть, дограються й зарахуються. Таблиця лишиться публічною. Скасувати це не можна.',
      'Завершити турнір?',
      { confirmButtonText: 'Завершити', cancelButtonText: 'Ні', type: 'warning' }
    )
  } catch {
    return
  }
  ending.value = true
  try {
    await duelsService.endTournament(tournament.value.id)
    refreshTournament()
  } catch {
    // тост уже показав duelsService
  } finally {
    ending.value = false
  }
}
</script>

<style scoped>
.dt__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding-top: 24px;
  font-size: 13px;
  color: var(--ds-text-muted);
  transition: color var(--ds-duration-base) ease;
}

.dt__back:hover {
  color: var(--ds-text-strong);
}

.dt__empty {
  padding: 16px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.dt-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.dt-head__title {
  font-family: var(--ds-font-display);
  font-size: 26px;
  line-height: 1.15;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
  text-shadow: var(--ds-neon-text-subtle);
  overflow-wrap: anywhere;
}

@media (min-width: 768px) {
  .dt-head__title {
    font-size: 32px;
  }
}

.dt-head__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  font-size: 13px;
  color: var(--ds-text-muted);
}

.dt-head__status {
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dt-head__status.is-active {
  color: rgb(34, 197, 94);
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
}

.dt-head__status.is-ended {
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.dt-head__aside {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Кнопка стріму: червоний «ефір», поки турнір триває; після — нейтральне посилання на запис. */
.dt-stream {
  --stream-rgb: 255, 255, 255;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 32px;
  padding: 0 15px;
  border: 1px solid rgba(var(--stream-rgb), 0.25);
  border-radius: var(--el-border-radius-base, 4px);
  background: rgba(var(--stream-rgb), 0.06);
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
  transition:
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.dt-stream.is-live {
  --stream-rgb: 239, 68, 68;
}

.dt-stream:active {
  transform: scale(0.97);
}

.dt-stream:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .dt-stream:hover {
    border-color: rgba(var(--stream-rgb), 0.6);
    background: rgba(var(--stream-rgb), 0.14);
  }
}

.dt-stream__dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: rgb(239, 68, 68);
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
}

@media (prefers-reduced-motion: no-preference) {
  .dt-stream__dot {
    animation: dt-stream-pulse 1.6s ease-out infinite;
  }

  @keyframes dt-stream-pulse {
    to {
      box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
    }
  }
}

@media (max-width: 767px) {
  .dt-head__aside,
  .dt-head__aside :deep(.el-button),
  .dt-stream {
    width: 100%;
  }

  .dt-head__aside :deep(.el-button) {
    margin-left: 0;
  }
}

.dt-panel {
  --hud-corner-inset: 8px;

  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  overflow: hidden;
}

.dt-panel__meta {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-faint);
}

.dt-panel__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}

.dt-prizes-status {
  font-weight: 600;
  color: var(--ds-gold);
  white-space: nowrap;
}

.dt-prizes-status > svg {
  display: inline-block;
  margin-right: 3px;
  vertical-align: -2px;
}

.dt-password {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(var(--ds-gold-rgb), 0.3);
  background: rgba(var(--ds-gold-rgb), 0.06);
}

.dt-password__label {
  font-size: 12px;
  color: var(--ds-text-muted);
}

.dt-password__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--ds-font-mono);
  font-size: 15px;
  letter-spacing: 0.06em;
  color: var(--ds-text-strong);
}
</style>
