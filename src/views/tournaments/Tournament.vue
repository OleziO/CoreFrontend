<template>
  <div v-loading.fullscreen="tournamentStore.loading" class="h-full w-full overflow-y-auto custom-scroll">
    <div class="relative w-full min-h-[550px] lg:min-h-[600px] flex items-end shrink-0">
      <AppBackButton class="top-24 left-20 lg:left-40" />

      <!-- Банер розчиняється маскою, а не заливкою: крізь нижній край проступає
           текстура й атмосфера сторінки, тож шва між героєм і фоном немає -->
      <div
        class="absolute inset-0 z-0 select-none
         [mask-image:linear-gradient(to_bottom,#000_45%,transparent_100%)]
         [-webkit-mask-image:linear-gradient(to_bottom,#000_45%,transparent_100%)]"
      >
        <TournamentBannerImage
          :url="tournament?.headerBannerUrl"
          variant="hero"
          :lazy="false"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-background
           via-background/70 to-transparent pointer-events-none"
        />
        <div
          class="absolute inset-0 bg-gradient-to-r from-background/80
           via-transparent to-transparent pointer-events-none"
        />
        <!-- Акцентні відблиски в стилі головної (cyan/gold) -->
        <div
          class="absolute inset-0 pointer-events-none
           bg-[radial-gradient(ellipse_55%_50%_at_12%_88%,rgba(46,229,255,0.12),transparent_70%)]"
        />
        <div
          class="absolute inset-0 pointer-events-none
           bg-[radial-gradient(ellipse_45%_40%_at_92%_18%,rgba(232,185,49,0.08),transparent_70%)]"
        />
      </div>

      <div class="relative z-10 pt-24 w-full max-w-7xl mx-auto px-10 sm:px-15 lg:px-20 xl:px-40 pb-14 lg:pb-16">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-14 xl:gap-16 items-end lg:items-center">
          <TournamentHeroSection
            :tournament="tournament"
            class="lg:col-span-7"
          />

          <div class="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <TournamentJoinPanel
              :tournament="tournament"
              :token="authStore.token"
              :captain-join-context-ok="captainJoinContextOk"
              :show-join-primary="showJoinPrimary"
              :is-my-team-in-this-tournament="isMyTeamInThisTournament"
              :join-loading="joinLoading"
              :leave-tournament-loading="leaveTournamentLoading"
              :join-secondary-hint="joinSecondaryHint"
              :inactive-tournament-banner="inactiveTournamentBanner"
              :muted-qualifications-hint-for-logged-user="mutedQualificationsHintForLoggedUser"
              :api-base-url="apiBaseUrl"
              :entry-fee="entryFee"
              :payment-required="paymentRequired"
              :my-team-payment-status="myTeamPaymentStatus"
              :my-team-amount-paid="myTeamPaymentSummary?.amountPaid ?? 0"
              :payment-intent-loading="paymentIntentLoading"
              :payment-polling="paymentPolling"
              :payment-reference="paymentIntent?.reference ?? null"
              :payment-page-url="paymentIntent?.pageUrl ?? null"
              @join="registerOnTeamTournament"
              @leave="handleLeaveTournament"
              @pay="startPayment"
              @recheck="recheckPayment"
            />
          </div>
        </div>
      </div>
    </div>

    <SponsorShowcase :sponsors="sponsors" />

    <div class="w-full max-w-7xl mx-auto px-10 sm:px-15 lg:px-20 xl:px-40 py-10 pb-20">
      <div
        class="sticky top-0 z-30 flex items-center gap-12 overflow-x-auto no-scrollbar relative
               border-b border-white/[0.08] bg-dark-navy/90 backdrop-blur-md"
      >
        <el-tabs v-model="activeTab" class="tournament-detail-tabs w-full" tab-position="top" stretch>
          <el-tab-pane v-for="tab in tabs" :key="tab.value" :name="tab.value">
            <template #label>
              <div class="tab-label">
                <span>{{ tab.label }}</span>
                <span v-if="tab.value === 'teams'" class="tab-count">
                  {{ tournament?.teams?.length || 0 }}
                </span>
              </div>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="min-h-[400px]">
        <div v-if="activeTab === 'teams'">
          <TournamentParcitipantsTab :tournament="tournament" />
        </div>

        <div v-if="activeTab === 'qualification'">
          <TournamentQualificationTab
            :tournament-id="tournamentId"
            :tournament="tournament"
            @patch-tournament="patchTournament"
          />
        </div>

        <div
          v-if="activeTab === 'bracket'"
          class="mt-20"
        >
          <TournamentBracket
            :playoff-loading="playoffLoading"
            :playoff-embed-url="playoffEmbedUrl"
            :is-playoff-phase="isPlayoffPhase"
            :can-submit-playoff-match="canSubmitPlayoffMatch"
            :can-manage-players="canManagePlayers"
            :is-localhost="isLocalhost"
            @open-playoff-submit="openPlayoffSubmit"
            @open-tech-loss-playoff="openTechLossPlayoff"
            @open-test-match-modal="openTestMatchModal"
          />
        </div>

        <div
          v-if="activeTab === 'admin'"
        >
          <TournamentAdminTab
            :tournament="tournament"
            @refresh="reloadTournament"
            @playoff-updated="(r: TPlayoff) => { playoff = r; playoffFetched = true }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TournamentBannerImage from '@/components/tournaments/TournamentBannerImage.vue'
import TournamentQualificationTab from '@/views/tournaments/components/TournamentQualificationTab.vue'
import {
  PROFILE_CAPTAIN_ROLE_UA,
  isJoinableTournamentStatus
} from '@/components/tournaments-tags/tournament.constants'
import { teamsService } from '@/views/teams/teams.service'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import {
  getRegistrationBlockReason,
  registrationBlockBannerMap
} from '@/core/utils/tournament-registration'
import type { TSponsor } from '@/config/sponsors'

const tournament = ref<TTournament | null>(null)
const activeTab = ref('teams')
const myTeam = shallowRef<TTeam | null>(null)
const payments = ref<TTournamentPaymentSummary[]>([])
const paymentIntent = ref<TTournamentPaymentIntent | null>(null)
const paymentIntentLoading = ref(false)
const paymentPolling = ref(false)
let paymentPollAttempts = 0
const MAX_PAYMENT_POLL_ATTEMPTS = 150 // ~10 хв при інтервалі 4с
const joinLoading = ref(false)
const leaveTournamentLoading = ref(false)
const joinHiddenQualificationsClosedByApi = ref(false)
const joinHiddenCaptainByApi = ref(false)

const route = useRoute()
const authStore = useAuthStore()
const tournamentStore = useTournamentStore()
const tournamentId = String(route.params.id)
const apiBaseUrl = import.meta.env.VITE_API_PUBLIC_URL

const { open: openAppModal } = useAppModals()

const sponsors = ref<TSponsor[]>([
  {
    id: 'sponsor-1',
    name: 'BETKING',
    bannerUrl: '/sponsors/bet_1.png',
    logoUrl: '/sponsors/logo_1.png',
    websiteUrl: 'https://77953937.uatracer.link/',
    tier: 'title',
    priority: 1
  },
  {
    id: 'sponsor-2',
    name: 'BETKING',
    bannerUrl: '/sponsors/bet_2.png',
    logoUrl: '/sponsors/logo_2.png',
    websiteUrl: 'https://77953937.uatracer.link/',
    tier: 'title',
    priority: 2
  }
])

// const DUELO_PROMO_LS_KEY = 'dueloPromoLastShownAt'
// const DUELO_PROMO_INTERVAL_MS = 30 * 60 * 1000
let dueloPromoTimer: ReturnType<typeof setInterval> | null = null

/** Показуємо промо-модалку Duelo не частіше, ніж раз на 30 хв (зберігається між візитами). */
//     priority?: number;
// }
//   }
// ])

// const DUELO_PROMO_LS_KEY = 'dueloPromoLastShownAt'
// const DUELO_PROMO_INTERVAL_MS = 30 * 60 * 1000
// let dueloPromoTimer: ReturnType<typeof setInterval> | null = null

/** Показуємо промо-модалку Duelo не частіше, ніж раз на 30 хв (зберігається між візитами). */
// function maybeShowDueloPromo () {
//   const last = Number(localStorage.getItem(DUELO_PROMO_LS_KEY) ?? 0)
//   if (Number.isFinite(last) && last > 0 && Date.now() - last < DUELO_PROMO_INTERVAL_MS) return
//   localStorage.setItem(DUELO_PROMO_LS_KEY, String(Date.now()))
//   openAppModal('DueloPromoModal')
// }

function isTournamentEndedByDate (tt: TTournament | null | undefined): boolean {
  if (!tt?.tournamentEndsAt) return false
  return Date.parse(tt.tournamentEndsAt) < Date.now()
}

const playoff = ref<TPlayoff | null>(null)
const playoffLoading = ref(false)
const playoffFetched = ref(false)

/** Плей-оф активний (триває або турнір завершено за датою) — тоді показуємо сітку. */
const isPlayoffPhase = computed(() =>
  tournament.value?.tournamentStatus === 'PLAYOFF' || isTournamentEndedByDate(tournament.value))

const playoffEmbedUrl = computed(() => playoff.value?.embedUrl ?? '')

async function loadPlayoff (opts?: { force?: boolean }) {
  if (!tournamentId) return
  if (playoffLoading.value) return
  if (playoffFetched.value && !opts?.force) return
  playoffLoading.value = true
  try {
    playoff.value = await tournamentsService.fetchPlayoff(tournamentId)
    playoffFetched.value = true
  } catch (e: unknown) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося завантажити сітку плей-оф'))
  } finally {
    playoffLoading.value = false
  }
}

/** Підвантажуємо сітку, коли відкрито вкладку «Сітка» під час плей-оф. */
watch(
  () => [activeTab.value, tournament.value?.tournamentStatus] as const,
  ([tab]) => {
    if (tab === 'bracket' && isPlayoffPhase.value) loadPlayoff()
  },
  { immediate: true }
)

/** Подати результат матчу плей-оф може будь-який залогінений користувач під час плей-оф. */
const canSubmitPlayoffMatch = computed(() =>
  !!authStore.token && tournament.value?.tournamentStatus === 'PLAYOFF')

async function handlePlayoffSubmitted () {
  await loadPlayoff({ force: true })
  await reloadTournament()
}

function openPlayoffSubmit () {
  openAppModal('PlayoffSubmitResultModal', {
    tournamentId,
    onSubmitted: handlePlayoffSubmitted
  })
}

function openTechLossPlayoff () {
  openAppModal('TechLossPlayoffModal', {
    tournamentId,
    teams: playoff.value?.teams ?? [],
    onSubmitted: (response: TPlayoff) => {
      playoff.value = response
      reloadTournament()
    }
  })
}

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'

function openTestMatchModal (phase: 'qualification' | 'playoff') {
  openAppModal('TestMatchCreationModal', {
    tournamentId,
    phase,
    teams: tournament.value?.teams ?? [],
    onSubmitted: () => {
      if (phase === 'playoff') handlePlayoffSubmitted()
    }
  })
}

const canManagePlayers = computed(() => {
  return authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator
})

const tabs = computed(() => {
  const items = [
    { label: 'Команди', value: 'teams' }
  ]

  // Турнір без кваліфікації не має ні етапу, ні сторінки для нього.
  if (tournament.value?.hasQualification !== false) {
    items.push({ label: 'Кваліфікація', value: 'qualification' })
  }
  items.push({ label: 'Сітка', value: 'bracket' })

  if (canManagePlayers.value) {
    items.push({ label: 'Управління', value: 'admin' })
  }

  return items
})

async function hydrateMyTeam () {
  const tid = authStore.user?.teamId
  if (!tid) {
    myTeam.value = null
    return
  }
  try {
    myTeam.value = await teamsService.fetchTeam(tid, { silent: true })
  } catch {
    myTeam.value = null
  }
}

const hasCaptainUserRole = computed(() =>
  !!(authStore.user?.roles ?? []).some((r) => r.name === PROFILE_CAPTAIN_ROLE_UA)
)

watch(
  () => [authStore.user?.teamId, authStore.token],
  () => {
    hydrateMyTeam().catch(() => {})
  },
  { immediate: true }
)

watch(() => tournament.value?.tournamentStatus, () => {
  joinHiddenQualificationsClosedByApi.value = false
  joinHiddenCaptainByApi.value = false
})

const myTeamId = computed(() => authStore.user?.teamId ?? null)

const isMyTeamInThisTournament = computed(() =>
  !!(myTeamId.value && tournament.value?.teams?.some((t) => t.id === myTeamId.value))
)

const freeSlots = computed(() => {
  if (!tournament.value?.tournamentSlots) return true
  return tournament.value.tournamentSlots - (tournament.value.teams?.length ?? 0) > 0
})

const entryFee = computed(() => tournament.value?.entryFee ?? 0)

const myTeamPaymentSummary = computed(() =>
  myTeamId.value
    ? payments.value.find((p) => p.teamId === myTeamId.value) ?? null
    : null
)

const myTeamPaymentStatus = computed(() => myTeamPaymentSummary.value?.status ?? null)

const myTeamPaid = computed(() => myTeamPaymentSummary.value?.status === 'PAID')

/**
 * Тік раз на 30с, щоб приховати кнопку приєднання, коли дедлайн реєстрації
 * минає під час перебування на сторінці (без перезавантаження).
 */
const now = useNow({ interval: 30_000 })

/** Чому реєстрація зачинена (вікно дат або ручне закриття адміном), або null. */
const registrationBlockReason = computed(() =>
  getRegistrationBlockReason(tournament.value, now.value.getTime())
)

const captainJoinContextOk = computed(() =>
  !!(authStore.token &&
    isJoinableTournamentStatus(tournament.value?.tournamentStatus) &&
    hasCaptainUserRole.value &&
    !registrationBlockReason.value &&
    !joinHiddenQualificationsClosedByApi.value &&
    !joinHiddenCaptainByApi.value)
)

/** Капітану треба сплатити внесок перед приєднанням до платного турніру. */
const paymentRequired = computed(() =>
  captainJoinContextOk.value &&
    !!myTeam.value &&
    !isMyTeamInThisTournament.value &&
    freeSlots.value &&
    entryFee.value > 0 &&
    !myTeamPaid.value
)

const showJoinPrimary = computed(() =>
  captainJoinContextOk.value &&
    !!myTeam.value &&
    !isMyTeamInThisTournament.value &&
    freeSlots.value &&
    (entryFee.value <= 0 || myTeamPaid.value)
)

function joinFriendlyHintFromApi (msg: string): string {
  const hints: Partial<Record<string, string>> = {
    'Реєстрація на турнір закрита': 'Реєстрацію на цей турнір закрито.',
    'Кваліфікація на турнір закрита': 'Реєстрацію на цей турнір закрито.',
    'Тільки капітан команди може приєднатися до турніру': 'До турніру може приєднатися лише капітан команди.',
    'Команда вже бере участь у турнірі': 'Ваша команда вже записана.',
    'Команда не верифікована': 'Спочатку підтвердьте верифікацію команди.',
    'Команда не має Dota2 Team ID': 'Для участі потрібен Dota2 Team ID у профілі команди.',
    'Всі основні гравці повинні бути верифіковані': 'Усі основні гравці мають бути верифіковані.',
    'У складі команди немає основних гравців': 'У складі команди немає основних гравців.',
    'Дозволено не більшше 3 запасних гравців': 'У команді занадто багато запасних гравців.',
    'Усі місця в турнірі зайняті': 'Ліміт учасників турніру вже вичерпано.',
    'Необхідно сплатити вступний внесок за участь у турнірі':
      'Спершу сплатіть вступний внесок за участь у турнірі.'
  }

  const direct = hints[msg.trim()]
  if (direct) return direct

  // Бекенд розрізняє дві причини відмови — АВГ поза діапазоном і гравець понад
  // ліміт. Це різні проблеми з різними рішеннями, тому не зливаємо їх в одну.
  if (msg.startsWith('Середній MMR команди') && msg.includes('не підходить')) { return msg }

  if (msg.startsWith('Гравець з MMR') && msg.includes('перевищує ліміт')) { return msg }

  if (msg.includes('Запасний гравець') && msg.includes('не верифікований')) { return 'Є не верифікований запасний гравець — перевірте заявку.' }

  if (msg.includes('Запасний гравець') && msg.includes('не підходить для дивізіону')) { return 'Запасний гравець не підходить для дивізіону турніру — перевірте його MMR.' }

  return msg
}

async function loadPayments () {
  // Ендпоінт вимагає авторизації; для гостей пропускаємо, щоб уникнути 401 → редіректу на '/'.
  if (!authStore.token) {
    payments.value = []
    return
  }
  try {
    payments.value = await tournamentsService.fetchTournamentPayments(tournamentId)
  } catch {
    payments.value = []
  }
}

async function reloadTournament () {
  const data = await tournamentStore.reloadTournament(tournamentId)
  if (data) {
    tournament.value = data
  }
  await loadPayments()
}

/** Локально оновлюємо статус оплати своєї команди, щоб гейт перерахувався без повного перезавантаження. */
function upsertMyPayment (intent: TTournamentPaymentIntent) {
  const tid = myTeamId.value
  if (!tid) return
  payments.value = [
    ...payments.value.filter((p) => p.teamId !== tid),
    { teamId: tid, status: intent.status, amountPaid: intent.amountPaid }
  ]
}

const { pause: pausePaymentPoll, resume: resumePaymentPoll } = useIntervalFn(
  pollPaymentStatus,
  4000,
  { immediate: false }
)

function stopPaymentPolling () {
  paymentPolling.value = false
  pausePaymentPoll()
}

function startPaymentPolling () {
  paymentPollAttempts = 0
  paymentPolling.value = true
  resumePaymentPoll()
}

async function pollPaymentStatus () {
  paymentPollAttempts += 1
  if (paymentPollAttempts > MAX_PAYMENT_POLL_ATTEMPTS) {
    stopPaymentPolling()
    return
  }
  const intent = await tournamentsService.fetchMyPayment(tournamentId).catch(() => null)
  if (!intent) return
  paymentIntent.value = intent
  upsertMyPayment(intent)
  if (intent.status === 'PAID') {
    stopPaymentPolling()
    ElMessage.success('Оплату підтверджено — тепер можна приєднатися до турніру')
    await reloadTournament()
  } else if (intent.status === 'UNDERPAID') {
    stopPaymentPolling()
    ElMessage.warning('Отримано неповну оплату. Доплатіть різницю, щоб приєднатися.')
  }
}

async function startPayment () {
  paymentIntentLoading.value = true
  try {
    const intent = await tournamentsService.createPaymentIntent(tournamentId)
    paymentIntent.value = intent
    upsertMyPayment(intent)
    if (intent.pageUrl) {
      window.open(intent.pageUrl, '_blank', 'noopener')
    } else {
      ElMessage.warning('Сторінка оплати monobank не налаштована. Зверніться до організатора.')
    }
    startPaymentPolling()
  } catch (e: unknown) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося створити оплату'))
  } finally {
    paymentIntentLoading.value = false
  }
}

/** Ручна перевірка статусу оплати (кнопка «Перевірити зараз»). */
async function recheckPayment () {
  await pollPaymentStatus()
}

function patchTournament (next: TTournament) {
  tournament.value = next
}

function handleJoinTransportError (raw: string) {
  const norm = raw.trim()
  if (
    norm.includes('Реєстрація на турнір закрита') ||
    norm.includes('Кваліфікація на турнір закрита')
  ) {
    joinHiddenQualificationsClosedByApi.value = true
    ElMessage.warning(
      norm.includes('Кваліфікація на турнір закрита')
        ? joinFriendlyHintFromApi('Кваліфікація на турнір закрита')
        : joinFriendlyHintFromApi('Реєстрація на турнір закрита')
    )
    return true
  }
  if (norm.includes('Тільки капітан команди може приєднатися до турніру')) {
    joinHiddenCaptainByApi.value = true
    ElMessage.warning(joinFriendlyHintFromApi('Тільки капітан команди може приєднатися до турніру'))
    return true
  }
  return false
}

async function registerOnTeamTournament () {
  joinLoading.value = true
  try {
    const result = await tournamentsService.joinTournamentWithToast(tournamentId)
    if (result.success) {
      await reloadTournament()
      await hydrateMyTeam()
    } else if (result.errorMsg) {
      if (!handleJoinTransportError(result.errorMsg)) {
        ElMessage.error(joinFriendlyHintFromApi(result.errorMsg))
      }
      if (result.errorMsg.includes('Команда вже бере участь у турнірі')) {
        await reloadTournament()
      }
      if (result.errorMsg.includes('вступний внесок')) {
        await loadPayments()
      }
    }
  } finally {
    joinLoading.value = false
  }
}

async function handleLeaveTournament () {
  leaveTournamentLoading.value = true
  try {
    const success = await tournamentsService.leaveTournamentWithToast(tournamentId)
    if (success) {
      await reloadTournament()
      await hydrateMyTeam()
    }
  } finally {
    leaveTournamentLoading.value = false
  }
}

const joinSecondaryHint = computed(() => {
  if (!captainJoinContextOk.value) return ''

  if (!myTeam.value) { return 'Щоб долучитися до турніру, спочатку приєднайтеся або створіть команду як капітан.' }

  if (!freeSlots.value) { return 'Усі місця в турнірі вже зайняті.' }

  return ''
})

const mutedQualificationsHintForLoggedUser = computed(() => {
  if (!authStore.token || captainJoinContextOk.value) return ''
  // Реєстрація закрита — банер уже пояснює причину, підказка про капітана лише збиває.
  if (registrationBlockReason.value) return ''
  const st = tournament.value?.tournamentStatus
  if (isJoinableTournamentStatus(st) && !hasCaptainUserRole.value) {
    return 'Заявку на турнір подає капітан команди'
  }

  return ''
})

const inactiveTournamentBanner = computed(() => {
  if (!authStore.token) return ''

  if (joinHiddenQualificationsClosedByApi.value) { return 'Реєстрацію на турнір закрито' }

  if (joinHiddenCaptainByApi.value) { return 'Приєднання для цього акаунту неможливе' }

  if (isTournamentEndedByDate(tournament.value)) return 'Турнір завершено'

  // Вікно реєстрації важливіше за статус: приєднатися можна і під час
  // кваліфікації, але реєстрація вже могла закритись за датою або вручну.
  if (registrationBlockReason.value) {
    return registrationBlockBannerMap[registrationBlockReason.value]
  }

  if (isJoinableTournamentStatus(tournament.value?.tournamentStatus)) return ''

  switch (tournament.value?.tournamentStatus) {
    case 'PLAYOFF':
      return 'Триває плей-оф — подача заявок недоступна'
    default:
      return 'Реєстрація на турнір недоступна'
  }
})

onMounted(async () => {
  const cached = await tournamentStore.findTournament(tournamentId)
  if (cached) tournament.value = cached
  try {
    const fresh = await tournamentsService.fetchTournament(tournamentId)
    tournament.value = fresh
    tournamentStore.patchTournamentInList(fresh)
  } catch (e: unknown) {
    if (!tournament.value) {
      ElMessage.error(getApiErrorMessage(e, 'Не вдалося завантажити турнір'))
    }
  }
  await hydrateMyTeam()
  await loadPayments()

  // maybeShowDueloPromo()
  // dueloPromoTimer = setInterval(maybeShowDueloPromo, DUELO_PROMO_INTERVAL_MS)
})

onUnmounted(() => {
  stopPaymentPolling()
  if (dueloPromoTimer != null) {
    clearInterval(dueloPromoTimer)
    dueloPromoTimer = null
  }
})

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.tournament-detail-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.tournament-detail-tabs :deep(.el-tabs__nav-wrap) {
  overflow: hidden;
}

.tournament-detail-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.tournament-detail-tabs :deep(.el-tabs__nav) {
  gap: 0;
}

/** Розтягнуті вкладки: підпис по центру комірки; неонову лінію малює глобальний reset (`.is-active::after`). */
.tournament-detail-tabs :deep(.el-tabs__item) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 12px 14px;
}

.tournament-detail-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

.tab-label {
  @apply inline-flex items-center justify-center gap-8;
}

/** Лічильник команд: моно-чип у реєстрі HUD, підсвічується разом з активною вкладкою. */
.tab-count {
  @apply inline-flex h-18 min-w-18 items-center justify-center rounded-full border px-5;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.7);
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  text-shadow: none;
  transition: color var(--ds-duration-base) ease, border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease;
}

.tournament-detail-tabs :deep(.el-tabs__item.is-active) .tab-count {
  color: var(--ds-primary);
  border-color: rgba(var(--ds-primary-rgb), 0.5);
  background: rgba(var(--ds-primary-rgb), 0.12);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.3);
}
</style>
