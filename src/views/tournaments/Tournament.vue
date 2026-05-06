<template>
  <div v-loading.fullscreen="tournamentStore.loading" class="h-full w-full overflow-y-auto bg-[#0b1121] custom-scroll">
    <div class="relative w-full min-h-[550px] lg:h-[600px] flex items-end shrink-0">
      <AppBackButton class="top-24 left-20 lg:left-40" />

      <div class="absolute inset-0 z-0 select-none">
        <el-image
          v-if="tournament?.headerBannerUrl"
          class="w-full h-full object-cover"
          fit="cover"
          :src="tournament.headerBannerUrl"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-[#0b1121]/80 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-[#0b1121]/80 via-transparent to-transparent" />
      </div>

      <div class="relative z-10 pt-24 w-full max-w-7xl mx-auto px-20 sm:px-15 lg:px-20 xl:px-40 pb-12 lg:pb-16">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-18 lg:gap-12 items-end">
          <div class="lg:col-span-7 gap-20 flex flex-col animate-fade-in-up">
            <h1
              class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black
               text-white tracking-tight leading-[1] drop-shadow-2xllg:mb-10"
            >
              {{ tournament?.name }}
            </h1>

            <div class="flex md:flex-nowrap flex-wrap items-stretch gap-10 max-w-lg">
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
              class="w-full bg-[#111827]/60 backdrop-blur-xl
            border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)]
            flex flex-col gap-6 transition-transform"
            >
              <div class="lg:grid lg:grid-cols-2 h-full flex flex-col gap-6 sm:gap-10">
                <div
                  class="bg-black/20 rounded-xl p-10 border border-white/5 flex
                 flex-col items-center  gap-1"
                >
                  <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Призовий фонд</span>
                  <div class="flex items-center gap-2 text-yellow-400 font-bold text-lg">
                    <el-icon><Trophy /></el-icon>
                    <span class="truncate">{{ tournament?.prizePool || '—' }}</span>
                  </div>
                </div>

                <div
                  class="bg-black/20 rounded-xl p-10 border border-white/5 flex
                 flex-col items-center  gap-1 "
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
                  class="col-span-2 bg-black/20 rounded-xl p-10 border
                 border-white/5 flex flex-col items-center gap-1"
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
                        @click="confirmLeaveTournament"
                      >
                        Покинути турнір
                      </el-button>
                    </div>
                    <p
                      v-else
                      class="text-sm text-center px-10 leading-snug rounded-xl border border-white/10 bg-black/25 py-10 text-gray-300"
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
                      v-if="mutedRegistrationHintForLoggedUser"
                      class="text-xs text-center text-gray-500 leading-snug px-14"
                    >
                      {{ mutedRegistrationHintForLoggedUser }}
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

    <div class="w-full max-w-7xl mx-auto px-10 sm:px-15 lg:px-20 xl:px-40 py-8 pb-20">
      <div class="flex items-center gap-16 border-b border-white/10 overflow-x-auto no-scrollbar relative">
        <el-tabs v-model="activeTab" class="border-b border-white/10 w-full" tab-position="top" stretch>
          <el-tab-pane v-for="tab in tabs" :key="tab.value" :name="tab.value">
            <template #label>
              <div class="relative flex gap-4 sm:gap-6 items-center">
                <span class="text-sm sm:text-base">{{ tab.label }}</span>
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
          class="mt-20 rounded-xl
            flex items-center justify-center relative overflow-hidden"
        >
          <iframe
            v-if="showBracketIframe"
            :src="getBracketUrl(tournament?.tournamentGridUrl || '')"
            width="100%"
            height="500"
            class="sm:h-[600px] rounded-lg border-0"
            frameborder="0"
            scrolling="auto"
            allowtransparency="true"
          />
          <div
            v-else-if="!tournament?.tournamentGridUrl"
            class="w-full py-20 flex justify-center items-center flex-col text-center
            border border-dashed border-white/10 rounded-xl bg-white/5"
          >
            <PhBracketsCurly :size="40" class="text-gray-600 mb-3" />
            <p class="text-gray-400">
              Сітка турніру ще не готова
            </p>
          </div>
          <div
            v-else
            class="w-full py-20 flex justify-center items-center flex-col text-center
            border border-dashed border-white/10 rounded-xl bg-white/5"
          >
            <PhBracketsCurly :size="40" class="text-gray-600 mb-3" />
            <p class="text-gray-400">
              Сітка доступна під час плей-оф
            </p>
          </div>
        </div>

        <div
          v-if="activeTab === 'admin'"
        >
          <TournamentAdminTab :tournament="tournament" @refresh="reloadTournament" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trophy, Calendar, User } from '@element-plus/icons-vue'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import TournamentQualificationTab from '@/views/tournaments/components/TournamentQualificationTab.vue'
import { PROFILE_CAPTAIN_ROLE_UA } from '@/components/tournaments-tags/tournament.constants'
import type { TTournament as Tournament, TTeam as Team } from '@/api/types/api.types'

import { formatDate } from '@/core/helpers'
import { teamsService } from '@/views/teams/teams.service'
import { PhBracketsCurly, PhSteamLogo } from '@phosphor-icons/vue'
import { getApiErrorMessage } from '@/utils/api-errors'
import { ElMessageBox } from 'element-plus'

const tournament = ref<Tournament | null>(null)
const activeTab = ref('teams')
const myTeam = shallowRef<Team | null>(null)
const joinLoading = ref(false)
const leaveTournamentLoading = ref(false)
const joinHiddenRegClosedByApi = ref(false)
const joinHiddenCaptainByApi = ref(false)

const route = useRoute()
const authStore = useAuthStore()
const tournamentStore = useTournamentStore()
const tournamentId = String(route.params.id)
const apiBaseUrl = import.meta.env.VITE_API_PUBLIC_URL

function isTournamentEndedByDate (tt: Tournament | null | undefined): boolean {
  if (!tt?.tournamentEndsAt) return false
  return Date.parse(tt.tournamentEndsAt) < Date.now()
}

const showBracketIframe = computed(() =>
  !!(tournament.value?.tournamentGridUrl &&
    (tournament.value.tournamentStatus === 'PLAYOFF' || isTournamentEndedByDate(tournament.value))))

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
    void hydrateMyTeam()
  },
  { immediate: true }
)

watch(() => tournament.value?.tournamentStatus, () => {
  joinHiddenRegClosedByApi.value = false
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
    !joinHiddenRegClosedByApi.value &&
    !joinHiddenCaptainByApi.value)
)

const occupiedByAnotherTournament = computed(() =>
  !!(myTeam.value?.tournament && myTeam.value.tournament.id !== tournament.value?.id)
)

const showJoinPrimary = computed(() =>
  captainJoinContextOk.value &&
    !!myTeam.value &&
    !myTeam.value.tournament &&
    !isMyTeamInThisTournament.value &&
    freeSlots.value &&
    !occupiedByAnotherTournament.value
)

function joinFriendlyHintFromApi (msg: string): string {
  const hints: Partial<Record<string, string>> = {
    'Реєстрація на турнір закрита': 'Реєстрація на цей турнір закрита.',
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
  const data = await tournamentStore.findTournament(tournamentId)
  if (data) tournament.value = data
}

function patchTournament (next: Tournament) {
  tournament.value = next
}

function handleJoinTransportError (raw: string) {
  const norm = raw.trim()
  if (norm.includes('Реєстрація на турнір закрита')) {
    joinHiddenRegClosedByApi.value = true
    ElMessage.warning(joinFriendlyHintFromApi('Реєстрація на турнір закрита'))
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
    ElMessage.success('Команда успішно зареєстрована')
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

async function confirmLeaveTournament () {
  try {
    await ElMessageBox.confirm(
      'Команду буде знято з участі в цьому турнірі. Продовжити?',
      'Покинути турнір?',
      {
        confirmButtonText: 'Так, покинути',
        cancelButtonText: 'Скасувати',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )
  } catch {
    return
  }

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

  if (!myTeam.value) { return 'Щоб зареєструватися, спочатку приєднайтесь або створіть команду як капітан.' }

  if (!freeSlots.value) { return 'Усі місця в турнірі вже зайняті.' }

  return ''
})

const mutedRegistrationHintForLoggedUser = computed(() => {
  if (!authStore.token || captainJoinContextOk.value) return ''
  const st = tournament.value?.tournamentStatus
  if (st === 'QUALIFICATIONS' && !hasCaptainUserRole.value) { return 'Реєстрацію виконує капітан команди з роллю «Капітан» у профілі.' }

  return ''
})

const inactiveTournamentBanner = computed(() => {
  if (!authStore.token) return ''

  if (joinHiddenRegClosedByApi.value) { return 'Реєстрація на турнір закрита' }

  if (joinHiddenCaptainByApi.value) { return 'Приєднання для цього акаунту неможливе' }

  if (isTournamentEndedByDate(tournament.value)) return 'Турнір завершено'

  switch (tournament.value?.tournamentStatus) {
    case 'PLAYOFF':
      return 'Триває плей-оф — запис на турнір недоступний'
    case 'QUALIFICATIONS':
      return ''
    default:
      return tournament.value?.tournamentStatus !== 'QUALIFICATIONS'
        ? 'Реєстрація на турнір недоступна'
        : ''
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
  const data = await tournamentStore.findTournament(tournamentId)
  if (data) tournament.value = data
  await hydrateMyTeam()
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
</style>
