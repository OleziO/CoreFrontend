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
            <el-image
              :src="getImageUrl(team?.avatar_url)"
              fit="cover"
              class="!h-100 !w-100 lg:!h-[150px] lg:!w-[150px] mt-15 rounded-xl border-2 border-gray-800"
            />

            <div>
              <div class="flex items-center gap-10 mt-15">
                <el-tooltip placement="top" :content="team?.team_name">
                  <h1
                    class="text-xl md:max-w-300 max-w-150 font-bold uppercase
                      whitespace-nowrap leading-tight truncate"
                  >
                    {{ team?.team_name }}
                  </h1>
                </el-tooltip>

                <el-button
                  v-if="authStore.user?.is_cap || authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator"
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

              <span
                class="text-xs w-fit mt-5 mb-15 flex gap-4 items-center text-gray-500/80 hover:text-primary
                       transition-all duration-300 cursor-pointer"
                @click.stop="team?.dota_team_id && copyDotaTeamID(team.dota_team_id)"
              >
                {{ team?.dota_team_id || '-' }}
                <PhCopy v-if="team?.dota_team_id" size="14" />
              </span>

              <div class="w-full flex flex-wrap gap-10">
                <DivisionTag :divisionName="team?.calculated_division?.name as EDivision" />
                <StatusTag :status="team?.status" />
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
                  <el-button type="primary" @click="createChat">Створити чати</el-button>
                  <el-button type="primary" @click="deleteChat">Видалити чати</el-button>
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
              <el-tooltip content="Вийти з команди" placement="top">
                <el-button
                  v-if="isTeamPlayer" class="w-max px-10 rounded-md"
                  type="primary" @click="leaveFromTeam"
                >
                  <PhSignOut :size="20" />
                  <span class="ml-10 hidden 2xs:flex">Вийти з команди</span>
                </el-button>
              </el-tooltip>

              <el-button
                v-if="isCap"
                class="w-max px-10 rounded-md"
                type="primary" @click="changeCapTeam"
              >
                <PhSwap :size="20" />
                <span class="ml-10 hidden 2xs:flex">Передати капітанство</span>
              </el-button>
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
                  :src="getImageUrl(tournament.img_url)"
                  class="w-[60px] max-w-full rounded-lg object-cover shrink-0"
                />

                <div class="flex flex-col w-full gap-15 min-w-0">
                  <h3 class="flex justify-between gap-20 items-center font-semibold text-sm text-white">
                    <span class="text-lg truncate pr-2">{{ tournament.title }}</span>

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
                              {{ dayjs(tournament.start_time).format("D MMMM YYYY") }}
                            </span>
                          </div>

                          <div class="flex gap-2 justify-between">
                            <span class="text-white/70">Кінець:</span>

                            <span class="text-white">
                              {{ dayjs(tournament.end_time).format("D MMMM YYYY") }}
                            </span>
                          </div>
                        </div>
                      </template>
                    </el-tooltip>
                  </h3>

                  <div class="hidden sm:flex w-full gap-10">
                    <DivisionTag
                      class="flex-1 md:text-xs
                      max-w-200" :divisionName="tournament.division?.name"
                    />
                    <TournamentTypeTag
                      class="flex-1 md:text-xs
                     normal-case max-w-200" :type="tournament.type"
                    />
                  </div>
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
              <TeamAvg :team="team" />
            </h3>
            <el-divider class="mt-15" />

            <div class="mr-0 xl:mr-10 rounded-xl bg-gray-800/50 p-16 flex flex-col gap-20 min-h-0 justify-between">
              <PlayerCard
                v-for="player in team?.players?.filter(p => p.is_team_main)"
                :key="player.id"
                :player="player"
                @removePlayer="teamsStore.removePlayerFromTeam(team?.id!, player.id)"
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
                v-for="player in team?.players?.filter(p => !p.is_team_main)"
                :key="player.id"
                :player="player"
                @removePlayer="teamsStore.removePlayerFromTeam(team?.id!, player.id)"
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
import { PhDotsThree, PhSwap, PhCalendarDots, PhCopy, PhSignOut, PhPencil } from '@phosphor-icons/vue'
import { getImageUrl } from '@/core/helpers'
import { useWindowSize, useClipboard } from '@vueuse/core'
import type { EDivision } from '@/components/team-tags/team.constants'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
dayjs.locale('uk')

const route = useRoute()
const id = ref(Number(route.params.id))

const { copy } = useClipboard({ legacy: true })
const { open, close } = useAppModals()

const authStore = useAuthStore()
const currWindow = useWindowSize()
const isMobile = computed(() => currWindow.width.value < 850)

const teamsStore = useTeamsStore()
const playersStore = usePlayersStore()

const team = ref<TTeam | null>(null)

const isTeamPlayer = computed(() =>
  team.value?.players?.some(el => el.id === authStore.user?.id) ?? false
)
const isCap = computed(() => {
  return authStore.user?.is_cap && authStore.user.team_id === team.value?.id
})

const teamTournaments = computed(() => team.value?.tournaments ?? [])

const isAdmin = computed(() => {
  return authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator
})

const mainSlotCounts = computed(() => {
  const players = team.value?.players.filter(el => el.is_team_main)
  return players ? Math.max(0, 5 - players.length) : 0
})

const reserveSlotCounts = computed(() => {
  const players = team.value?.players.filter(el => !el.is_team_main)
  return players ? Math.max(0, 3 - players.length) : 0
})

async function leaveFromTeam () {
  await teamsStore.leaveFromTeam()
}

function createChat () {
  teamsService.createTeamChats(team.value?.id)
}

function deleteChat () {
  teamsService.deleteTeamChats(team.value?.id)
}

function changeCapTeam () {
  if (!team.value?.id) return
  open('ChangeCaptainModal', { team: team.value, teamId: team.value.id })
}

function handleOpenAddPlayer (isMain: boolean) {
  open('PlayerAddToTeamModal', { team: team.value, isMain })
}

function copyDotaTeamID (id: number) {
  if (!id) return
  copy(String(id))
  ElMessage.success('Dota id скопійовано')
}

async function handleTeamUpdate (payload: ICreateTeamForm) {
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
  team.value = await teamsStore.findTeam(id.value)
  console.log(team)
})
</script>
