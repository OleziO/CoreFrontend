<template>
  <div
    v-loading.fullscreen="teamsStore.loading || playersStore.loading"
    class="w-full flex justify-center overflow-auto py-20 px-20 lg:px-40"
  >
    <div
      class="nm:pt-60 pt-20 relative grid lg:grid-cols-[1fr_2fr] h-full w-full lg:max-w-[1400px] gap-20
      lg:items-stretch scrollbar-gutter-stable"
    >
      <AppBackButton />

      <aside class="flex flex-1 flex-col gap-20 max-w-full lg:max-w-[600px] lg:self-stretch">
        <div
          class="rounded-xl w-full bg-gray-900 p-20 flex flex-col gap-20 relative
                 border border-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
        >
          <div class="flex items-center gap-15">
            <div>
              <div class="flex items-center gap-10 mt-15">
                <el-tooltip placement="top" :content="team?.name">
                  <h1
                    class="text-xl md:max-w-300 max-w-150 font-bold uppercase
                      whitespace-nowrap leading-tight truncate"
                  >
                    {{ team?.name }}
                  </h1>
                </el-tooltip>

                <el-button
                  v-if="authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator"
                  type="primary"
                  class="px-10"
                  @click="open('TeamCreateModal', {
                    team,
                    onSubmit: handleTeamUpdate
                  })"
                >
                  <PhPencil size="16" />
                </el-button>
              </div>

              <div class="w-full flex flex-wrap gap-10 mt-10">
                <el-tag :type="team?.isVerified ? 'success' : 'danger'">
                  {{ team?.isVerified ? 'Верифікована' : 'Не верифікована' }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="flex flex-col gap-10">
            <el-dropdown
              v-if="isAdmin"
              trigger="click"
              :placement="isMobile ? 'left-start' : 'bottom'"
              class="absolute top-10 right-15 text-white hover:text-white/50"
              @click.stop
            >
              <PhDotsThree size="26" weight="bold" @click.stop />

              <template #dropdown>
                <div class="flex flex-col gap-10 p-2 rounded-lg shadow-lg bg-gray-900">
                  <el-button type="primary" @click="teamsStore.deleteTeam(team?.id!)">Розпустити команду</el-button>
                  <el-button
                    class="w-max px-10 rounded-md"
                    type="primary" @click="changeCapTeam"
                  >
                    <span class="">Передати капітанство</span>
                  </el-button>
                </div>
              </template>
            </el-dropdown>

            <div class="flex gap-12">
              <!-- TODO: endpoint not in API yet (leaveFromTeam, transferCaptaincy) -->
            </div>
          </div>
        </div>

        <!-- TOURNAMENTS -->
        <div
          class="flex flex-col rounded-xl bg-gray-900 border
          border-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] p-15 pr-0
           pt-15 overflow-hidden max-h-[450px] w-full min-w-0"
        >
          <div class="flex flex-col gap-2 min-h-0 flex-1 overflow-hidden min-w-0">
            <h3 class="text-xl text-center font-semibold shrink-0 mr-15">Історія турнірів</h3>
            <el-divider class="mt-15 w-[calc(100%-15px)] shrink-0" />

            <p v-if="!teamTournaments.length" class="text-gray-400 text-sm mt-2 shrink-0">
              Команда ще не приймала участь у турнірах
            </p>

            <div
              v-else
              class="flex flex-col gap-15 overflow-y-auto overflow-x-hidden flex-1
              custom-scrollbar min-h-0 pr-15"
            >
              <RouterLink
                v-for="tournament in teamTournaments"
                :key="tournament.id"
                :to="{ name: 'tournament', params: { id: tournament.id } }"
                class="flex items-center gap-20 p-15 shrink-0 min-w-0
                rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors backdrop-blur-sm"
              >
                <el-image
                  :src="tournament.listBannerUrl"
                  class="w-[60px] max-w-full rounded-lg object-cover shrink-0"
                />

                <div class="flex flex-col w-full gap-15 min-w-0">
                  <h3 class="flex justify-between gap-20 items-center font-semibold text-sm text-white">
                    <span class="text-lg truncate pr-2">{{ tournament.name }}</span>

                    <el-tooltip placement="top" effect="dark">
                      <PhCalendarDots
                        :size="18"
                        class="text-white/30 hover:text-white/80 cursor-pointer transition-colors shrink-0"
                      />
                      <template #content>
                        <div class="flex flex-col gap-2 p-2 text-xs">
                          <div class="flex gap-2 justify-between">
                            <span class="text-white/70">Початок:</span>
                            <span class="text-white">
                              {{ dayjs(tournament.tournamentStartsAt).format("D MMMM YYYY") }}
                            </span>
                          </div>
                          <div class="flex gap-2 justify-between">
                            <span class="text-white/70">Кінець:</span>
                            <span class="text-white">
                              {{ dayjs(tournament.tournamentEndsAt).format("D MMMM YYYY") }}
                            </span>
                          </div>
                        </div>
                      </template>
                    </el-tooltip>
                  </h3>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </aside>

      <!-- PLAYERS -->
      <div
        class="rounded-xl border border-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.3)]
         bg-gray-900 flex relative flex-col w-full flex-1 gap-20 lg:self-stretch min-h-0 p-20 2xs:min-w-[400px]
         overflow-y-auto"
      >
        <div class="grid xl:grid-cols-2 gap-40 min-h-0 h-fit">
          <div class="flex-1 h-fit w-full">
              <h3 class="text-xl text-center font-semibold items-center justify-center gap-6 flex">
              Основа
            </h3>
            <el-divider class="mt-15" />

            <div class="mr-0 xl:mr-10 rounded-xl bg-gray-800/50 p-16 flex flex-col gap-20 min-h-0 justify-between">
              <PlayerCard
                v-for="player in team?.mainPlayers"
                :key="player.id"
                :player="player"
              />

              <template v-if="isAdmin">
                <button
                  v-for="i in mainSlotCounts"
                  :key="i"
                  class="h-48 rounded-lg border border-dashed
                   border-gray-600 text-gray-400 hover:border-primary hover:text-primary"
                  @click="handleOpenAddPlayer(true)"
                >
                  + Додати гравця
                </button>
              </template>

              <template v-else>
                <div
                  v-for="i in mainSlotCounts"
                  :key="i"
                  class="h-48 rounded-lg border border-dashed border-gray-600 text-gray-400
                         flex items-center justify-center"
                >
                  Відсутній
                </div>
              </template>
            </div>
          </div>

          <!-- RESERVE -->
          <div class="flex-1 h-fit  w-full">
            <h3 class="text-xl text-center font-semibold">Запас</h3>
            <el-divider class="mt-15" />

            <div class="ml-0 xl:ml-10 rounded-xl bg-gray-800/30 p-16 flex flex-col gap-20 min-h-0">
              <PlayerCard
                v-for="player in team?.reservedPlayers"
                :key="player.id"
                :player="player"
              />

              <template v-if="isAdmin">
                <button
                  v-for="i in reserveSlotCounts"
                  :key="i"
                  class="h-48 rounded-lg border border-dashed
                   border-gray-600 text-gray-400 hover:border-primary hover:text-primary"
                  @click="handleOpenAddPlayer(false)"
                >
                  + Додати гравця
                </button>
              </template>

              <template v-else>
                <div
                  v-for="i in reserveSlotCounts"
                  :key="i"
                  class="h-48 rounded-lg border border-dashed border-gray-600 text-gray-400
                         flex items-center justify-center"
                >
                  Відсутній
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhDotsThree, PhCalendarDots, PhPencil } from '@phosphor-icons/vue'
import { useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import type { TTeam as Team, TUpdateTeamDto as UpdateTeamDto } from '@/api/types/api.types'
dayjs.locale('uk')

const route = useRoute()
const id = String(route.params.id)

const { open, close } = useAppModals()

const authStore = useAuthStore()
const currWindow = useWindowSize()
const isMobile = computed(() => currWindow.width.value < 850)

const teamsStore = useTeamsStore()
const playersStore = usePlayersStore()

const team = ref<Team | null>(null)

const isAdmin = computed(() => {
  return authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator
})

// TODO: endpoint not in API yet
// const isTeamPlayer = computed(() => false)
// const isCap = computed(() => false)
const teamTournaments = computed(() => team.value?.tournament ? [team.value.tournament] : [])

const mainSlotCounts = computed(() => {
  const count = team.value?.mainPlayers?.length ?? 0
  return Math.max(0, 5 - count)
})

const reserveSlotCounts = computed(() => {
  const count = team.value?.reservedPlayers?.length ?? 0
  return Math.max(0, 3 - count)
})

// TODO: endpoint not in API yet
// async function leaveFromTeam () { ... }
// function createChat () { ... }
// function deleteChat () { ... }

function changeCapTeam () {
  if (!team.value?.id) return
  open('ChangeCaptainModal', { team: team.value, teamId: team.value.id })
}

function handleOpenAddPlayer (isMain: boolean) {
  open('PlayerAddToTeamModal', { team: team.value, isMain })
}

async function handleTeamUpdate (payload: UpdateTeamDto) {
  try {
    await teamsStore.updateTeam(team.value!.id, payload)
    close('TeamCreateModal')
  } catch (e) {
    if (e instanceof Error) {
      ElMessage.error(e)
    }
  }
}

onMounted(async () => {
  team.value = await teamsStore.findTeam(id)
})
</script>
