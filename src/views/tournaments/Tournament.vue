<template>
  <div v-loading.fullscreen="tournamentStore.loading" class="h-full w-full overflow-y-auto bg-[#0b1121] custom-scroll">
    <div class="relative w-full min-h-[550px] lg:h-[600px] flex items-end shrink-0">
      <AppBackButton class="top-24 left-20 lg:left-40" />

      <div class="absolute inset-0 z-0 select-none">
        <el-image
          v-if="tournament?.img_url"
          class="w-full h-full object-cover"
          fit="cover"
          :src="getImageUrl(tournament.img_url)"
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
              {{ tournament?.title }}
            </h1>

            <div class="flex md:flex-nowrap flex-wrap gap-10 max-w-lg">
              <TournamentStatusTag
                :status="(tournament?.status as ETournamentStatus)"
                class="shadow-lg flex-1 shadow-black/20 justify-center"
              />

              <TournamentTypeTag
                :type="tournament?.type"
                class="shadow-lg flex-1 shadow-black/20 justify-center"
              />

              <DivisionTag
                :divisionName="tournament?.division?.name"
                class="shadow-lg flex-1 shadow-black/20 justify-center"
              />
            </div>

            <div
              class="text-base md:text-lg text-gray-300 font-normal
            leading-relaxed whitespace-pre-wrap max-w-2xl drop-shadow-md"
            >
              {{ tournament?.description }}
            </div>
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
                    <span class="truncate">{{ tournament?.prizes || '—' }}</span>
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
                      {{ formatDate(new Date(tournament?.start_time as string)) }}
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
                      <template v-if="!tournament?.limit">
                        Необмежено
                      </template>
                      <template v-else>
                        <span>{{ tournament.participants?.length || 0 }}</span>
                        <span class="text-gray-500 mx-2">/</span>
                        <span>{{ tournament.limit }}</span>
                      </template>
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <el-button
                  v-if="authStore.token"
                  :disabled="isDisabledActionButton"
                  type="primary"
                  size="large"
                  class="!h-[52px] !w-full !text-base !font-bold !rounded-xl
                   shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5
                    transition-all border-none"
                  style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);"
                  @click="registerOnTeamTournament"
                >
                  {{ actionButtonText }}
                </el-button>

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
          <el-tab-pane v-for="(tab, index) in tabs" :key="tab.value" :name="tab.value">
            <template #label>
              <div class="relative flex gap-4 sm:gap-6 items-center">
                <span class="text-sm sm:text-base">{{ tab.label }}</span>
                <el-tag
                  v-if="!index"
                  type="danger"
                  round
                  class="border border-blue-500/40 bg-blue-500/15 text-blue-300
                rounded-full size-20 flex justify-center items-center text-xs
                tracking-wide font-semibold transition-all duration-300"
                >
                  {{ tournament?.participants?.length || 0 }}
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

        <div
          v-if="activeTab === 'bracket'"
          class="mt-20 rounded-xl
            flex items-center justify-center relative overflow-hidden"
        >
          <iframe
            v-if="tournament?.bracket"
            :src="getBracketUrl(tournament?.bracket || '')"
            width="100%"
            height="500"
            class="sm:h-[600px] rounded-lg border-0"
            frameborder="0"
            scrolling="auto"
            allowtransparency="true"
          />
          <div
            v-else class="w-full py-20 flex justify-center items-center flex-col text-center
            border border-dashed border-white/10 rounded-xl bg-white/5"
          >
            <PhBracketsCurly :size="40" class="text-gray-600 mb-3" />
            <p class="text-gray-400">
              Сітка турніру ще не готова
            </p>
          </div>
        </div>

        <div
          v-if="activeTab === 'admin'"
        >
          <TournamentAdminTab v-model:matches="matches" :tournament="tournament" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trophy, Calendar, User } from '@element-plus/icons-vue'
import TournamentTypeTag from '@/components/tournaments-tags/TournamentTypeTag.vue'
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import checkRoles, { formatDate, getImageUrl } from '@/core/helpers'
import { ERole } from '@/types/general.types'
import { ETournamentStatus } from '@/components/tournaments-tags/tournament.constants'
import { PhBracketsCurly, PhSteamLogo } from '@phosphor-icons/vue'

const tournament = ref<TTournamentItem>()
const activeTab = ref('teams')
const matches = ref<TTournamentOpenMatch[]>([])

const route = useRoute()
const authStore = useAuthStore()
const tournamentStore = useTournamentStore()
const tournamentId = Number(route.params.id)
const apiBaseUrl = import.meta.env.VITE_API_PUBLIC_URL

const canManagePlayers = computed(() => {
  return checkRoles(authStore.user?.roles || [], ERole.ADMIN) ||
        checkRoles(authStore.user?.roles || [], ERole.MODERATOR)
})

const tabs = computed(() => {
  const items = [
    { label: 'Команди', value: 'teams' },
    { label: 'Сітка', value: 'bracket' }
  ]

  if (canManagePlayers.value) {
    items.push({ label: 'Управління', value: 'admin' })
  }

  return items
})

const isTeamRegistered = computed(() => {
  if (!tournament.value) return false
  return tournament.value?.participants?.some(team => team.id === authStore.user?.team_id)
})

const isCaptain = computed(() => {
  return authStore.user?.is_cap === true
})

const freeSlots = computed(() => {
  if (!tournament.value?.limit) return true
  return tournament.value.limit - tournament.value.participants?.length > 0
})

const actionButtonText = computed(() => {
  if (tournament.value?.status === ETournamentStatus.ENDED) return 'Турнір завершено'
  if (tournament.value?.status === ETournamentStatus.IN_PROGRESS) return 'Турнір вже триває'
  if (isTeamRegistered.value && isCaptain.value) return 'Відмінити реєстрацію'
  if (isTeamRegistered.value) return 'Ваша команда вже зареєстрована'
  if (!freeSlots.value) return 'Вільних слотів більше немає'
  return 'Зареєструвати команду'
})

const isDisabledActionButton = computed(() => {
  if (tournament.value?.status === ETournamentStatus.IN_PROGRESS) return true
  if (tournament.value?.status === ETournamentStatus.ENDED) return true
  if (isTeamRegistered.value && isCaptain.value) return false
  if (!freeSlots.value) return true
  if (!isCaptain.value) return true
  return false
})

async function registerOnTeamTournament () {
  // Если команда зарегистрирована и пользователь капитан - отменяем регистрацию
  if (isTeamRegistered.value && isCaptain.value) {
    await tournamentStore.unRegisterInTeamTournament(tournamentId)
  } else {
    await tournamentStore.registerInTeamTournament(tournamentId)
  }
}

function getBracketUrl (url: string) {
  if (!url) return ''
  if (url.includes('challonge.com') && !url.includes('/module')) {
    return url.replace(/\/$/, '') + '/module'
  }
  return url
}

onMounted(async () => {
  const data = await tournamentStore.findTournament(tournamentId)

  if (data) {
    tournament.value = data
  }

  matches.value = await tournamentStore.getOpenMatches(tournamentId) || []
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
