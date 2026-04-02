<template>
  <div v-loading.fullscreen="mixStore.isLoading" class="h-full w-full overflow-y-auto bg-[#0b1121] custom-scroll">
    <div class="relative w-full min-h-[550px] lg:h-[600px] flex items-end shrink-0">
      <AppBackButton class="top-24 left-20 lg:left-40" />

      <div class="absolute inset-0 z-0 select-none">
        <el-image
          v-if="mixTournament?.img_url"
          class="w-full h-full object-cover"
          fit="cover"
          :src="apiPublicUrl + (mixTournament.img_url as string)"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-[#0b1121]/80 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-[#0b1121]/80 via-transparent to-transparent" />
      </div>

      <div
        class="relative z-10 w-full max-w-7xl mx-auto px-20 lg:px-40
       pb-12 lg:pb-16 pt-24 sm:pt-28 lg:pt-32"
      >
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-end">
          <div class="lg:col-span-7 flex flex-col gap-15 animate-fade-in-up">
            <h1
              class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl
            font-black text-white tracking-tight leading-[1] drop-shadow-2xl mb-6 sm:mb-8 lg:mb-10"
            >
              {{ mixTournament?.title }}
            </h1>

            <div
              class="grid grid-flow-col auto-cols-[1fr] gap-10 sm:gap-12
               lg:gap-10 mb-6 sm:mb-8 max-w-full sm:max-w-lg"
            >
              <TournamentStatusTag
                :status="mixTournament?.status as ETournamentStatus"
                class="shadow-lg shadow-black/20 w-full justify-center"
              />

              <TournamentTypeTag
                :type="mixTournament?.type"
                class="shadow-lg shadow-black/20 w-full justify-center"
              />
            </div>

            <div
              class="text-sm sm:text-base md:text-lg mt-6 sm:mt-8
             text-gray-300 font-normal leading-relaxed whitespace-pre-wrap
              max-w-full sm:max-w-2xl drop-shadow-md"
            >
              {{ mixTournament?.description }}
            </div>
          </div>

          <div class="lg:col-span-5 flex justify-center w-full mt-6 lg:mt-0">
            <div
              class="w-full bg-[#111827]/60 backdrop-blur-xl
              border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10
                     shadow-[0_0_30px_rgba(0,0,0,0.3)] sm:shadow-[0_0_40px_rgba(0,0,0,0.3)]
                     flex flex-col gap-4 sm:gap-6 transition-transform"
            >
              <div class="lg:grid lg:grid-cols-2 h-full flex flex-col gap-6 sm:gap-10">
                <div
                  class="bg-black/20 rounded-xl w-full px-10 py-15 border
                 border-white/5 flex flex-col justify-center items-center"
                >
                  <span
                    class="text-gray-400 text-[9px]
                     sm:text-[10px] uppercase font-bold tracking-wider"
                  >
                    Призовий фонд
                  </span>

                  <div
                    class="flex items-center justify-center
                    gap-1 sm:gap-2 w-full h-fit text-yellow-400
                    font-bold text-sm sm:text-lg text-wrap"
                  >
                    <PhTrophy class="min-w-14" :size="20" />
                    <p class="ml-5">{{ mixTournament?.prizes || '—' }}</p>
                  </div>
                </div>

                <div
                  class="bg-black/20 rounded-xl px-10 py-15 border
                 border-white/5 flex flex-col justify-center items-center"
                >
                  <span
                    class="text-gray-400 text-[9px]
                     sm:text-[10px] uppercase font-bold tracking-wider"
                  >
                    Дата початку
                  </span>

                  <div
                    class="flex items-center
                   justify-center gap-4 sm:gap-2 text-cyan-400 font-bold text-sm sm:text-lg"
                  >
                    <el-icon><Calendar /></el-icon>
                    <span class="whitespace-nowrap truncate">{{ formatDate(mixTournament?.start_time) }}</span>
                  </div>
                </div>

                <div
                  class="col-span-2 bg-black/20 rounded-xl px-10 py-15 border
                  border-white/5 flex justify-center items-center flex-col"
                >
                  <span
                    class="text-gray-400 text-[9px]
                  sm:text-[10px] uppercase font-bold tracking-wider"
                  >
                    Учасники
                  </span>

                  <div
                    class="flex justify-center
                    items-center gap-1 sm:gap-2 text-purple-400 font-bold text-sm sm:text-lg"
                  >
                    <el-icon><User /></el-icon>
                    <span>
                      <template v-if="!mixTournament?.limit">
                        <span>{{ mixPools?.length || 0 }}</span> (Необмежено)
                      </template>
                      <template v-else>
                        <span>{{ mixPools?.length || 0 }}</span>
                        <span class="text-gray-500 mx-1 sm:mx-2">/</span>
                        <span>{{ mixTournament.limit * 5 }}</span>
                      </template>
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-2 sm:gap-3 mt-4 sm:mt-6">
                <el-button
                  v-if="authStore.token"
                  :disabled="isActionDisabled"
                  type="primary"
                  size="large"
                  class="!h-[48px] sm:!h-[52px] !w-full"
                  style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);"
                  @click="handleMainButtonClick"
                >
                  {{ actionButtonText }}
                </el-button>

                <el-button
                  v-else
                  size="large"
                  class="!h-[48px] sm:!h-[52px] !w-full !text-sm sm:!text-base !font-bold
                  !rounded-xl !bg-white/10 !border-white/10 !text-white
                         hover:!bg-white/20 hover:!border-white/20 backdrop-blur-md transition-all"
                  tag="a"
                  :href="`${apiPublicUrl}/api/v1/steam/login`"
                >
                  <span class="flex items-center gap-1 sm:gap-2">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M11.979 0C5.666 0 .548 5.137.548 11.474c0 4.095 2.147
                      7.712 5.418 9.836l1.244-1.808c-.287-.24-.525-.565-.674-.954-.424-1.11-.069-2.203.791-2.923.826-.69
                       2.05-.722 3.109-.276l3.352-4.904C13.56 5.86 16.927 4.5 19.467 4.5c.348 0 .692.025
                        1.033.075C18.683 1.954 15.548 0 11.979 0z"
                      />
                    </svg>
                    Увійти через Steam
                  </span>
                </el-button>

                <p v-if="!authStore.token" class="text-[10px] sm:text-xs text-center text-gray-500 mt-1">
                  Для реєстрації необхідна авторизація
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full max-w-7xl mx-auto px-20 lg:px-40 py-6 sm:py-8 pb-20 mt-32 sm:mt-40">
      <!-- TABS -->
      <el-tabs v-model="activeTab" class="border-b border-white/10" tab-position="top" stretch>
        <el-tab-pane v-for="(tab, index) in tabs" :key="tab.value" :name="tab.value">
          <template #label>
            <div class="relative flex gap-4 sm:gap-6 items-end">
              <span class="text-sm sm:text-base">{{ tab.label }}</span>
              <el-tag
                v-if="!index"
                type="danger"
                round
                class="border border-blue-500/40 bg-blue-500/15 text-blue-300
                rounded-lg p-6 sm:p-10 flex justify-center items-center text-[10px] sm:text-[12px]
                tracking-wide font-semibold transition-all duration-300"
              >
                {{ mixPools?.length || 0 }}
              </el-tag>
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- CONTENT -->
      <div v-loading="mixStore.isLoading" class="mt-12 sm:mt-20 min-h-[300px] sm:min-h-[400px]">
        <transition name="fade" mode="out-in">
          <!-- PARTICIPANTS -->
          <div v-if="activeTab === 'participants'" key="participants">
            <div
              v-if="mixPools && mixPools.length > 0"
              class="grid
              grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-10"
            >
              <div
                v-for="player in mixPools"
                :key="player.player_id"
                class="bg-[#111827] rounded-xl p-2 sm:p-4 hover:border-cyan-500/30
                transition-all group relative hover:-translate-y-0.5 shadow-lg shadow-black/20"
              >
                <PlayerCard
                  v-if="player"
                  :player="playersMap.get(player.player_id) || null"
                  skip-team-fetch
                  :show-regular-cap="false"
                  :is-mix-cap="player.is_cap"
                  @remove-player="handleRemovePlayerFromMixTournament"
                />
              </div>
            </div>

            <div
              v-else class="py-12 sm:py-24 text-center
            border border-dashed border-white/10 rounded-xl bg-white/5 mt-6 sm:mt-8"
            >
              <el-icon :size="30" class="text-gray-600 mb-2 sm:mb-3"><User /></el-icon>
              <p class="text-gray-400 text-sm sm:text-lg">Список учасників порожній</p>
            </div>
          </div>

          <!-- TEAMS -->
          <div v-else-if="activeTab === 'teams'" key="teams">
            <div
              v-if="mixTournament?.teams && mixTournament.teams.length > 0"
              class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-10"
            >
              <MixTeamCard
                v-for="team in mixTournament?.teams"
                :key="team.id"
                :team-id="team.id"
                :players="
                  team?.slots
                    ?.map(player => player.player_id)
                    .filter((id): id is number => typeof id === 'number') || []
                "
                :team="team"
                :tournament="mixTournament"
                @remove-player="handleRemovePlayerFromTeam($event, team.id, mixTournament)"
              />
            </div>

            <div
              v-else class="py-12 sm:py-20 flex justify-center items-center
              gap-5 text-center border border-dashed border-white/10 rounded-xl bg-white/5"
            >
              <PhTrophy />
              <p class="text-gray-400 mt-2">Команди ще не сформовані</p>
            </div>
          </div>

          <!-- BRACKET -->
          <div
            v-else-if="activeTab === 'bracket'"
            key="bracket"
            class="bg-[#111827] border border-white/5 rounded-xl p-2 sm:p-4 min-h-[400px]
            sm:min-h-[500px] flex items-center justify-center relative overflow-hidden"
          >
            <div v-if="mixTournament?.bracket" class="w-full h-full">
              <iframe
                :src="getBracketUrl(mixTournament.bracket)"
                width="100%"
                height="500"
                class="sm:h-[600px] rounded-lg border-0"
                frameborder="0"
                scrolling="auto"
                allowtransparency="true"
              />
            </div>
            <div v-else class="flex flex-col items-center gap-2 sm:gap-4 text-gray-500">
              <PhTrophy />
              <p>Сітка турніру недоступна</p>
            </div>
          </div>

          <!-- ADMIN -->
          <div v-else-if="activeTab === 'admin'" key="admin">
            <AdminTab :tournament-data="mixTournament!" :teams="mixTournament?.teams || []" />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, User } from '@element-plus/icons-vue'
import checkRoles from '@/core/helpers'
import { ERole } from '@/types/general.types'
import type { ETournamentStatus } from '@/components/tournaments-tags/tournament.constants'
import { PhTrophy } from '@phosphor-icons/vue'

const { open } = useAppModals()
const authStore = useAuthStore()
const mixStore = useMixTournamentStore()
const route = useRoute()
const playersStore = usePlayersStore()

const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const tournamentId = ref(Number(route.params.id))
const activeTab = ref('participants')

const mixTournament = ref<TMixTournament | null>(null)

const playersMap = computed(() => {
  return new Map(playersStore.players.map(p => [p.id, p]))
})

const canManagePlayers = computed(() => {
  return checkRoles(authStore.user?.roles || [], ERole.ADMIN) ||
  checkRoles(authStore.user?.roles || [], ERole.MODERATOR)
})

const mixPools = computed(() => mixTournament.value?.mix_pools)

const tabs = computed(() => {
  const items = [
    { label: 'Учасники', value: 'participants' },
    { label: 'Команди', value: 'teams' }
  ]

  if (mixTournament.value?.bracket) {
    items.push({ label: 'Сітка', value: 'bracket' })
  }

  if (canManagePlayers.value) {
    items.push({ label: 'Управління', value: 'admin' })
  }

  return items
})

const isRegistered = computed(() => mixPools.value?.some(
  (p: TMixPoolEntry) => p.player_id === authStore.user?.id
))

const currentUserEntry = computed(() => {
  if (!authStore.user?.id || !mixPools.value) return null

  return mixPools.value.find((p: TMixPoolEntry) => p.player_id === authStore.user?.id) || null
})

const freeSlots = computed(() => {
  if (!mixTournament.value?.limit) return false

  return mixTournament.value.limit * 5 - (mixPools.value?.length || 0)
})

const isCaptainNeedTeam = computed(() => {
  const status = mixTournament.value?.status

  if (status && status !== 'team-creation') return false

  const entry = currentUserEntry.value

  return entry && entry.is_cap && !entry.team_id
})

const isCaptainNeedRoll = computed(() => {
  const entry = currentUserEntry.value

  if (!entry || !entry.is_cap || !entry.team_id) return false

  const mixPoolUsed = entry.mix_pool_used || []

  return mixPoolUsed.length < 5
})

const actionButtonText = computed(() => {
  const status = mixTournament.value?.status
  const isLoggedIn = !!authStore.user?.id

  // Турнір вже завершено або триває
  if (status === 'ended') return 'Турнір завершено'
  if (status === 'in-progress') return 'Турнір триває'

  if (isLoggedIn) {
    // Користувач зареєстрований
    if (isRegistered.value) {
      if (status === 'registration') {
        return 'Покинути турнір'
      }

      if (status === 'team-creation') {
        if (isCaptainNeedTeam.value) return 'Створити команду' // капітан ще не створив команду
        if (isCaptainNeedRoll.value) return 'Розподіл гравців' // капітан чекає на розподіл
        if (!isCaptainNeedTeam.value && !isCaptainNeedRoll.value) return 'Гравців відібрано' // команда сформована

        return 'Ви не числитесь серед капітанів' // якщо не капітан
      }
    }
  }

  // Для всіх інших користувачів / глядачів
  if (!freeSlots.value) return 'Місць більше немає'
  if (status === 'pre-registration') return 'Реєстрація ще не почалась'
  if (status === 'team-creation') return 'Створити команду'

  // За замовчуванням
  return 'Взяти участь'
})

const isActionDisabled = computed(() => {
  const status = mixTournament.value?.status

  if (status === 'ended' || status === 'in-progress' || status === 'pre-registration') return true
  if (isCaptainNeedTeam.value) return false
  if (!isCaptainNeedRoll.value && status === 'team-creation') return true
  if (isCaptainNeedRoll.value) return false

  if (!freeSlots.value) return true
  if (status === 'team-creation' && (!isRegistered.value || !currentUserEntry.value?.is_cap)) return true

  return false
})

function getBracketUrl (url: string) {
  if (!url) return ''
  if (url.includes('challonge.com') && !url.includes('/module')) {
    return url.replace(/\/$/, '') + '/module'
  }

  return url
}

function formatDate (dateString?: string) {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('uk-UA')
}

async function handleRemovePlayerFromTeam (playerId: number, teamId: number, tournament: TMixTournament) {
  await mixStore.removePlayerFromTeam(tournament, playerId, teamId)
}

async function handleRemovePlayerFromMixTournament (playerID: number) {
  if (!mixTournament.value) return

  await mixStore.removePlayerFromMix(mixTournament.value, playerID)
}

function handleMainButtonClick () {
  if (!authStore.token) return

  if (isCaptainNeedTeam.value) {
    openCreateTeamModal()
  } else if (isCaptainNeedRoll.value) {
    handleRollPlayers()
  } else if (mixTournament.value?.status === 'registration' && isRegistered.value) {
    handleUnregister()
  } else {
    handleRegister()
  }
}

const currTeam = computed(() => {
  return mixTournament.value?.teams?.find(team => team.id === currentUserEntry.value?.team_id)
})

function handleRollPlayers () {
  if (!currentUserEntry.value?.team_id) return

  open('RollPlayersModal', {
    tournament: mixTournament,
    team: currTeam
  })
}

function openCreateTeamModal () {
  open('TeamCreateModal', {
    onSubmit: createTeam
  })
}

async function createTeam (form: ICreateTeamForm) {
  if (!mixTournament.value) return

  await mixStore.createTeam(mixTournament.value, {
    name: form.name,
    dotaTeamId: form.dotaTeamId,
    avatar: form.avatar
  })
}

async function handleRegister () {
  if (!authStore.token) return

  await mixStore.register(tournamentId.value)
}

async function handleUnregister () {
  if (!authStore.token) return

  await mixStore.unregister(tournamentId.value)
}

onMounted(async () => {
  mixTournament.value = await mixStore.findMixTournament(tournamentId.value)

  if (mixTournament.value?.id) {
    await mixStore.getOpenMatches(mixTournament.value?.id)
  }
})
</script>

<style scoped>
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

.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.badge-fix .el-badge__content {
  @apply translate-x-1/3 -translate-y-2;
  @apply text-[10px] leading-none;
  @apply flex items-center justify-center;
  @apply min-w-[8px] h-[8px];
}
</style>
