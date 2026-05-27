<template>
  <div v-loading.fullscreen="tournamentStore.loading" class="h-full w-full overflow-y-auto bg-[#0b1121] custom-scroll">
    <div class="relative w-full min-h-[550px] lg:h-[600px] flex items-end shrink-0">
      <AppBackButton class="top-24 left-20 lg:left-40" />

      <div class="absolute inset-0 z-0 select-none">
        <TournamentBannerImage
          :url="tournament?.headerBannerUrl"
          variant="hero"
          :lazy="false"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-[#0b1121]
           via-[#0b1121]/80 to-transparent pointer-events-none"
        />
        <div
          class="absolute inset-0 bg-gradient-to-r from-[#0b1121]/80
           via-transparent to-transparent pointer-events-none"
        />
      </div>

      <div class="relative z-10 pt-24 w-full max-w-7xl mx-auto px-20 sm:px-15 lg:px-20 xl:px-40 pb-14 lg:pb-16">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-14 xl:gap-16 items-end">
          <div class="lg:col-span-7 flex flex-col gap-12 lg:gap-16 animate-fade-in-up">
            <h1
              class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white
               tracking-tight leading-[1.05] drop-shadow-2xl lg:mb-2"
            >
              {{ tournament?.name }}
            </h1>

            <div class="flex md:flex-nowrap flex-wrap items-stretch gap-8 lg:gap-10 max-w-lg">
              <TournamentStatusTag
                :status="tournament?.tournamentStatus"
                class="shadow-lg flex-1 shadow-black/20 justify-center"
              />
              <DivisionTag
                :division="tournament?.division"
                variant="hero"
                class="shrink-0 self-center shadow-lg shadow-black/25"
              />
            </div>

            <!-- tournament.description not in new API schema -->
          </div>

          <div class="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <div
              class="w-full bg-[#111827]/70 backdrop-blur-xl border border-white/[0.08]
               rounded-2xl p-7 sm:p-8 shadow-xl shadow-black/30 ring-1 ring-white/[0.04]
               flex flex-col gap-6 sm:gap-7 transition-[box-shadow,border-color] duration-300"
            >
              <div class="lg:grid lg:grid-cols-2 h-full flex flex-col gap-5 sm:gap-8">
                <div
                  class="bg-black/25 rounded-xl p-8 sm:p-10 border border-white/[0.06]
                   flex flex-col items-center gap-1.5"
                >
                  <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Призовий фонд</span>
                  <div class="flex items-center gap-2 text-yellow-400 font-bold text-lg">
                    <el-icon><Trophy /></el-icon>
                    <span class="truncate">{{ formatTournamentPrizeUah(tournament?.prizePool) }}</span>
                  </div>
                </div>

                <div
                  class="bg-black/25 rounded-xl p-8 sm:p-10 border border-white/[0.06]
                   flex flex-col items-center gap-1.5"
                >
                  <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Дата початку</span>
                  <div class="flex items-center gap-5 text-cyan-400 font-bold text-lg">
                    <el-icon><Calendar /></el-icon>
                    <span class="whitespace-nowrap truncate">
                      {{ formatDate(new Date(tournament?.tournamentStartsAt as string)) }}
                    </span>
                  </div>
                </div>

                <div
                  class="col-span-2 bg-black/25 rounded-xl p-8 sm:p-10 border border-white/[0.06]
                   flex flex-col items-center gap-1.5"
                >
                  <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Учасники</span>
                  <div class="flex items-center gap-2 text-purple-400 font-bold text-lg">
                    <el-icon><User /></el-icon>
                    <span>
                      <template v-if="!tournament?.tournamentSlots">
                        Необмежено
                      </template>
                      <template v-else>
                        <span>{{ tournament.teams?.length || 0 }}</span>
                        <span class="text-gray-500 mx-2">/</span>
                        <span>{{ tournament.tournamentSlots }}</span>
                      </template>
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <template v-if="authStore.token">
                  <template v-if="captainJoinContextOk">
                    <el-button
                      v-if="showJoinPrimary"
                      type="primary"
                      size="large"
                      :loading="joinLoading"
                      class="!h-[52px] !w-full !text-base !font-bold !rounded-xl
                       shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5
                        transition-all border-none"
                      style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);"
                      @click="registerOnTeamTournament"
                    >
                      Приєднатися до турніру
                    </el-button>
                    <div
                      v-else-if="isMyTeamInThisTournament"
                      class="flex flex-col gap-10 rounded-xl border border-white/10 bg-black/25 px-10 py-10"
                    >
                      <p class="text-sm text-center leading-snug text-gray-300">
                        {{ joinSecondaryHint }}
                      </p>
                      <el-button
                        type="danger"
                        plain
                        size="large"
                        :loading="leaveTournamentLoading"
                        class="!h-[48px] !w-full !text-base !font-semibold !rounded-xl"
                        @click="handleLeaveTournament"
                      >
                        Покинути турнір
                      </el-button>
                    </div>
                    <p
                      v-else
                      class="text-sm text-center px-10 leading-snug rounded-xl border border-white/10
                       bg-black/25 py-10 text-gray-300"
                    >
                      {{ joinSecondaryHint }}
                    </p>
                  </template>
                  <template v-else>
                    <el-button
                      v-if="inactiveTournamentBanner"
                      :disabled="true"
                      type="info"
                      size="large"
                      class="!h-[52px] !w-full !text-base !font-bold !rounded-xl !opacity-85"
                    >
                      {{ inactiveTournamentBanner }}
                    </el-button>
                    <p
                      v-if="mutedQualificationsHintForLoggedUser"
                      class="text-xs text-center text-gray-500 leading-snug px-14"
                    >
                      {{ mutedQualificationsHintForLoggedUser }}
                    </p>
                  </template>
                </template>

                <el-button
                  v-else
                  size="large"
                  class="!h-[52px] !w-full !text-base !font-bold !rounded-xl !bg-white/10
                   !border-white/10 !text-white hover:!bg-white/20 hover:!border-white/20
                   backdrop-blur-md transition-all"
                  tag="a"
                  :href="`${apiBaseUrl}/api/v1/steam/login`"
                >
                  <span class="flex items-center gap-5 justify-center">
                    <PhSteamLogo :size="28" />
                    Увійти через Steam
                  </span>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full max-w-7xl mx-auto px-10 sm:px-15 lg:px-20 xl:px-40 py-10 pb-20">
      <div class="flex items-center gap-12 overflow-x-auto no-scrollbar relative border-b border-white/[0.08]">
        <el-tabs v-model="activeTab" class="tournament-detail-tabs w-full" tab-position="top" stretch>
          <el-tab-pane v-for="tab in tabs" :key="tab.value" :name="tab.value">
            <template #label>
              <div class="relative flex gap-4 sm:gap-6 items-center py-2">
                <span class="text-sm sm:text-[15px] font-medium text-white/85">{{ tab.label }}</span>
                <el-tag
                  v-if="tab.value === 'teams'"
                  type="danger"
                  round
                  class="border border-blue-500/40 bg-blue-500/15 text-blue-300
                rounded-full size-20 flex justify-center items-center text-xs
                tracking-wide font-semibold transition-all duration-300"
                >
                  {{ tournament?.teams?.length || 0 }}
                </el-tag>
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
          <div
            v-if="canSubmitPlayoffMatch || isLocalhost ||
              (canManagePlayers && isPlayoffPhase)" class="flex justify-end gap-10 mb-12"
          >
            <el-button
              v-if="isLocalhost"
              type="warning"
              @click="openTestMatchModal('playoff')"
            >
              Test match creation
            </el-button>
            <el-button
              v-if="canManagePlayers && isPlayoffPhase"
              type="danger"
              plain
              @click="openTechLossPlayoff"
            >
              Технічна поразка
            </el-button>
            <el-button
              v-if="canSubmitPlayoffMatch"
              type="primary"
              class="!bg-cyan-600 !border-cyan-600"
              @click="openPlayoffSubmit"
            >
              Подати результат матчу
            </el-button>
          </div>

          <div
            class="rounded-xl flex items-center justify-center relative overflow-hidden"
          >
            <div
              v-if="playoffLoading"
              class="w-full py-20 flex justify-center items-center flex-col text-center
            border border-dashed border-white/[0.07] rounded-2xl bg-white/[0.04]"
            >
              <PhBracketsCurly :size="40" class="text-gray-600 mb-4 animate-pulse" />
              <p class="text-sm text-gray-400 max-w-sm">
                Завантаження сітки…
              </p>
            </div>
            <iframe
              v-else-if="playoffEmbedUrl"
              :src="getBracketUrl(playoffEmbedUrl)"
              width="100%"
              height="500"
              class="sm:h-[600px] rounded-lg border-0"
              frameborder="0"
              scrolling="auto"
              allowtransparency="true"
            />
            <div
              v-else-if="!isPlayoffPhase"
              class="w-full py-20 flex justify-center items-center flex-col text-center
            border border-dashed border-white/[0.07] rounded-2xl bg-white/[0.04]"
            >
              <PhBracketsCurly :size="40" class="text-gray-600 mb-4" />
              <p class="text-sm text-gray-400 max-w-sm">
                Сітка доступна під час плей-оф
              </p>
            </div>
            <div
              v-else
              class="w-full py-20 flex justify-center items-center flex-col text-center
            border border-dashed border-white/[0.07] rounded-2xl bg-white/[0.04]"
            >
              <PhBracketsCurly :size="40" class="text-gray-600 mb-4" />
              <p class="text-sm text-gray-400 max-w-sm">
                Сітку плей-оф ще не сформовано
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="activeTab === 'admin'"
        >
          <TournamentAdminTab
            :tournament="tournament"
            @refresh="reloadTournament"
            @playoff-updated="(r) => { playoff = r; playoffFetched = true }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trophy, Calendar, User } from '@element-plus/icons-vue'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import TournamentBannerImage from '@/components/tournaments/TournamentBannerImage.vue'
import TournamentQualificationTab from '@/views/tournaments/components/TournamentQualificationTab.vue'
import { PROFILE_CAPTAIN_ROLE_UA } from '@/components/tournaments-tags/tournament.constants'

import { formatDate } from '@/core/helpers'
import { formatTournamentPrizeUah } from '@/views/tournaments/utils/tournament-prize-format'
import { teamsService } from '@/views/teams/teams.service'
import { PhBracketsCurly, PhSteamLogo } from '@phosphor-icons/vue'
import { getApiErrorMessage } from '@/utils/api-errors'

const tournament = ref<TTournament | null>(null)
const activeTab = ref('teams')
const myTeam = shallowRef<TTeam | null>(null)
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

const DUELO_PROMO_LS_KEY = 'dueloPromoLastShownAt'
const DUELO_PROMO_INTERVAL_MS = 30 * 60 * 1000
let dueloPromoTimer: ReturnType<typeof setInterval> | null = null

/** Показуємо промо-модалку Duelo не частіше, ніж раз на 30 хв (зберігається між візитами). */
function maybeShowDueloPromo () {
  const last = Number(localStorage.getItem(DUELO_PROMO_LS_KEY) ?? 0)
  if (Number.isFinite(last) && last > 0 && Date.now() - last < DUELO_PROMO_INTERVAL_MS) return
  localStorage.setItem(DUELO_PROMO_LS_KEY, String(Date.now()))
  openAppModal('DueloPromoModal')
}

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
    { label: 'Команди', value: 'teams' },
    { label: 'Кваліфікація', value: 'qualification' },
    { label: 'Сітка', value: 'bracket' }
  ]

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

const captainJoinContextOk = computed(() =>
  !!(authStore.token &&
    tournament.value?.tournamentStatus === 'QUALIFICATIONS' &&
    hasCaptainUserRole.value &&
    !joinHiddenQualificationsClosedByApi.value &&
    !joinHiddenCaptainByApi.value)
)

const showJoinPrimary = computed(() =>
  captainJoinContextOk.value &&
    !!myTeam.value &&
    !isMyTeamInThisTournament.value &&
    freeSlots.value
)

function joinFriendlyHintFromApi (msg: string): string {
  const hints: Partial<Record<string, string>> = {
    'Реєстрація на турнір закрита': 'Кваліфікацію на цей турнір закрито.',
    'Кваліфікація на турнір закрита': 'Кваліфікацію на цей турнір закрито.',
    'Тільки капітан команди може приєднатися до турніру': 'До турніру може приєднатися лише капітан команди.',
    'Команда вже бере участь у турнірі': 'Ваша команда вже записана.',
    'Команда не верифікована': 'Спочатку підтвердьте верифікацію команди.',
    'Команда не має Dota2 Team ID': 'Для участі потрібен Dota2 Team ID у профілі команди.',
    'Всі основні гравці повинні бути верифіковані': 'Усі основні гравці мають бути верифіковані.',
    'Рейтинг команди виходить за межі дозволених дивізіонів': 'Середній MMR команди не відповідає дивізіону турніру.',
    'Дозволено не більшше 3 запасних гравців': 'У команді занадто багато запасних гравців.',
    'Усі місця в турнірі зайняті': 'Ліміт учасників турніру вже вичерпано.'
  }

  const direct = hints[msg.trim()]
  if (direct) return direct

  if (msg.startsWith('Дивізіон команди') && msg.includes('не відповідає')) { return 'Дивізіон вашої команди не збігається з дивізіоном турніру.' }

  if (msg.includes('Запасний гравець') && msg.includes('не верифікований')) { return 'Є не верифікований запасний гравець — перевірте заявку.' }

  return msg
}

async function reloadTournament () {
  try {
    const data = await tournamentsService.fetchTournament(tournamentId)
    tournament.value = data
    tournamentStore.patchTournamentInList(data)
  } catch (e: unknown) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося оновити дані турніру'))
  }
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
    await tournamentsService.joinTournament(tournamentId)
    ElMessage.success('Команду успішно записано на турнір')
    await reloadTournament()
    await hydrateMyTeam()
  } catch (e: unknown) {
    const msg = getApiErrorMessage(e, 'Не вдалося приєднатися до турніру')
    if (!handleJoinTransportError(msg)) { ElMessage.error(joinFriendlyHintFromApi(msg)) }
    if (
      msg.includes('Команда вже бере участь у турнірі')
    ) { await reloadTournament() }
  } finally {
    joinLoading.value = false
  }
}

async function handleLeaveTournament () {
  leaveTournamentLoading.value = true
  try {
    await tournamentsService.leaveTournament(tournamentId)
    ElMessage.success('Команда покинула турнір')
    await reloadTournament()
    await hydrateMyTeam()
  } catch (e: unknown) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося покинути турнір'))
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
  const st = tournament.value?.tournamentStatus
  if (st === 'QUALIFICATIONS' && !hasCaptainUserRole.value) {
    return 'Кваліфікаційну заявку подає капітан команди'
  }

  return ''
})

const inactiveTournamentBanner = computed(() => {
  if (!authStore.token) return ''

  if (joinHiddenQualificationsClosedByApi.value) { return 'Кваліфікацію на турнір закрито' }

  if (joinHiddenCaptainByApi.value) { return 'Приєднання для цього акаунту неможливе' }

  if (isTournamentEndedByDate(tournament.value)) return 'Турнір завершено'

  switch (tournament.value?.tournamentStatus) {
    case 'PLAYOFF':
      return 'Триває плей-оф — подача заявок недоступна'
    case 'QUALIFICATIONS':
      return ''
    default:
      return 'Кваліфікація на турнір недоступна'
  }
})

function getBracketUrl (url: string) {
  if (!url) return ''
  if (url.includes('challonge.com') && !url.includes('/module')) {
    return url.replace(/\/$/, '') + '/module'
  }
  return url
}

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

  maybeShowDueloPromo()
  dueloPromoTimer = setInterval(maybeShowDueloPromo, DUELO_PROMO_INTERVAL_MS)
})

onUnmounted(() => {
  if (dueloPromoTimer != null) {
    clearInterval(dueloPromoTimer)
    dueloPromoTimer = null
  }
})

</script>

<style scoped>
/* Анимация появления текста */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

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
  gap: 0.25rem;
}

/** Не брати дефолтний primary EP (синій); під нейтральну лінію з border-батькова */
.tournament-detail-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
  border-radius: 0;
  background-color: rgb(229 231 235);
  box-shadow: none;
}

.tournament-detail-tabs :deep(.el-tabs__item) {
  padding: 0 0.75rem 0.75rem;
  color: rgb(156 163 175);
}

.tournament-detail-tabs :deep(.el-tabs__item:hover) {
  color: rgb(229 231 235);
}

.tournament-detail-tabs :deep(.el-tabs__item.is-active) {
  color: rgb(255 255 255);
}
</style>
