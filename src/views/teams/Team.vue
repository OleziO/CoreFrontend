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
          <div class="flex flex-col gap-14">
            <div class="flex items-start gap-16">
              <div
                class="relative mt-15 size-[92px] shrink-0 overflow-hidden rounded-2xl bg-white/[0.06]
                  shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] ring-2 ring-black/40"
              >
                <img
                  v-if="teamLogoSrc"
                  :src="teamLogoSrc"
                  alt=""
                  class="pointer-events-none h-full w-full object-cover"
                >
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center text-white/30"
                >
                  <PhUsersThree :size="38" weight="duotone" />
                </div>
              </div>

              <div class="flex flex-1 min-w-0 flex-col gap-6 mt-15">
                <div class="flex flex-wrap items-center gap-10">
                  <el-tooltip placement="top" :content="team?.name">
                    <h1
                      class="text-xl md:max-w-300 max-w-150 font-bold uppercase
                        whitespace-nowrap leading-tight truncate"
                    >
                      {{ team?.name }}
                    </h1>
                  </el-tooltip>
                </div>

                <div class="flex min-w-0 flex-wrap items-center gap-3">
                  <span class="text-[10px] shrink-0 font-semibold uppercase tracking-[0.16em] text-gray-600">
                    Dota ID
                  </span>
                  <button
                    type="button"
                    class="group/dota-id inline-flex min-w-0 max-w-full cursor-pointer items-center gap-8
                           rounded-lg border border-transparent px-8 py-4 font-mono text-xs tabular-nums
                           outline-none transition-all duration-200
                           hover:border-white/10 hover:bg-white/[0.04]"
                    :class="dotaTeamIdTrimmed
                      ? 'text-gray-400 hover:text-primary'
                      : 'cursor-default text-gray-600'"
                    @click="dotaTeamIdTrimmed && copyDotaTeamIdPage()"
                  >
                    <span class="min-w-0 truncate">{{ dotaTeamIdTrimmed || '—' }}</span>
                    <PhCopy
                      v-if="dotaTeamIdTrimmed"
                      size="14"
                      class="shrink-0 opacity-55 transition-opacity group-hover/dota-id:opacity-100"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div
              v-if="authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator"
              class="mt-12 flex w-full"
            >
              <el-button
                type="primary"
                class="h-30 w-full shrink-0 max-sm:text-xs max-sm:!px-8"
                @click="open('TeamCreateModal', {
                  team,
                  onSubmit: handleTeamUpdate
                })"
              >
                <PhPencil />

                <span class="ml-8">
                  Редагувати {{ currWindow.width.value > 650 ? ' команду' : '' }}
                </span>
              </el-button>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="flex flex-col gap-10">
            <el-dropdown
              v-if="isAdmin"
              trigger="click"
              :placement="isMobile ? 'left-start' : 'bottom'"
              popper-class="header-dropdown"
              class="absolute top-10 right-15 cursor-pointer text-white hover:text-white/50"
              @click.stop
            >
              <PhDotsThree size="26" weight="bold" @click.stop />

              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="changeCapTeam">
                    <PhCrown :size="20" />
                    <span class="ml-8">Передати капітанство</span>
                  </el-dropdown-item>
                  <el-dropdown-item
                    class="header-user-menu__item--danger"
                    divided
                    @click="handleDisbandTeam"
                  >
                    <PhTrash :size="20" />
                    <span class="ml-8">Розпустити команду</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
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
                :is-captain="player.id === team?.captain?.id"
                @player-updated="onPlayerVerificationUpdated"
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
                :is-captain="player.id === team?.captain?.id"
                @player-updated="onPlayerVerificationUpdated"
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
import { PhCopy, PhCrown, PhDotsThree, PhCalendarDots, PhPencil, PhTrash, PhUsersThree } from '@phosphor-icons/vue'
import { useClipboard, useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import type { TTeam as Team, TPlayer } from '@/api/types/api.types'
import type { TUpdateTeamPayload } from '@/views/teams/teams.service'
import { teamsService } from '@/views/teams/teams.service'
import { hydrateTeamPlayersRanks } from '@/views/teams/team-roster-hydrate'
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

const teamLogoSrc = computed(() => resolvePublicOrApiUrl(team.value?.logoUrl))

const dotaTeamIdTrimmed = computed(() => team.value?.dotaTeamId?.trim() ?? '')

const { copy } = useClipboard({ legacy: true })
const isAdmin = computed(() => {
  return authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator
})

function copyDotaTeamIdPage () {
  const id = dotaTeamIdTrimmed.value
  if (!id) return
  copy(id)
  ElMessage.success('Dota ID скопійовано')
}

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

function handleDisbandTeam () {
  const tid = team.value?.id
  if (!tid) return
  void teamsStore.deleteTeam(tid)
}

function handleOpenAddPlayer (isMain: boolean) {
  open('PlayerAddToTeamModal', { team: team.value, isMain })
}

function onPlayerVerificationUpdated (updated: TPlayer) {
  if (!team.value) return
  for (const key of ['mainPlayers', 'reservedPlayers'] as const) {
    const list = team.value[key]
    if (!list?.length) continue
    const ix = list.findIndex(p => p.id === updated.id)
    if (ix !== -1) {
      list.splice(ix, 1, updated)
      break
    }
  }
}

async function handleTeamUpdate (payload: TUpdateTeamPayload) {
  try {
    const tid = team.value!.id
    const updatedTeam = await teamsStore.updateTeam(tid, payload)
    team.value = await hydrateTeamPlayersRanks(updatedTeam)
    close('TeamCreateModal')
  } catch (e) {
    if (e instanceof Error) {
      ElMessage.error(e)
    }
  }
}

onMounted(async () => {
  let t = await teamsStore.findTeam(id)
  if (!t) {
    try {
      t = await teamsService.fetchTeam(id)
    } catch {
      team.value = null
      return
    }
  }
  team.value = await hydrateTeamPlayersRanks(t)
})
</script>
