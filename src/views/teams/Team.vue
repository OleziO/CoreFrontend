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
              v-if="canEditTeamProfile"
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

            <div
              v-if="isAdmin && team && !team.isVerified"
              class="mt-10 flex w-full shrink-0"
            >
              <el-button
                type="success"
                class="h-30 w-full max-sm:text-xs max-sm:!px-8"
                :loading="verifyTeamLoading"
                @click="handleVerifyTeam"
              >
                <PhSealCheck :size="20" class="shrink-0" />
                <span class="ml-8">Верифікувати команду</span>
              </el-button>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="flex flex-col gap-10">
            <el-dropdown
              v-if="canEditTeamRoster"
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
                :to="{ name: routeNames.tournament, params: { id: tournament.id } }"
                class="flex items-center gap-20 p-15 shrink-0 min-w-0
                rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors backdrop-blur-sm"
              >
                <TournamentBannerImage
                  :url="tournament.listBannerUrl"
                  variant="thumb"
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
        <div class="grid min-h-0 h-fit grid-cols-1 gap-20 2sm:grid-cols-2">
          <div class="flex-1 h-fit w-full min-w-0">
            <h3 class="text-xl text-center font-semibold items-center justify-center gap-6 flex">
              Основа
            </h3>
            <el-divider class="mt-15" />

            <div class="rounded-xl bg-gray-800/50 p-16 flex flex-col gap-20 min-h-0 justify-between">
              <div
                v-for="player in team?.mainPlayers"
                :key="player.id"
                class="relative overflow-visible rounded-2xl"
              >
                <PlayerCard
                  :player="player"
                  :is-captain="player.id === team?.captain?.id"
                />
                <template v-if="showRemovePlayerButton(player)">
                  <el-popconfirm
                    v-if="team?.tournament"
                    width="320"
                    placement="top-end"
                    :title="tournamentRemovePlayerWarning"
                    confirm-button-text="Видалити"
                    cancel-button-text="Скасувати"
                    @confirm="runRemovePlayerFromTeam(player.id)"
                  >
                    <template #reference>
                      <button
                        type="button"
                        class="player-remove-from-team-btn"
                        :disabled="removePlayerLoadingId === player.id"
                        aria-label="Прибрати з команди"
                        @click.stop
                      >
                        <PhX :size="14" weight="bold" class="pointer-events-none" />
                      </button>
                    </template>
                  </el-popconfirm>
                  <button
                    v-else
                    type="button"
                    class="player-remove-from-team-btn"
                    :disabled="removePlayerLoadingId === player.id"
                    aria-label="Прибрати з команди"
                    @click.stop="handleRemovePlayerFromTeam(player.id)"
                  >
                    <PhX :size="14" weight="bold" class="pointer-events-none" />
                  </button>
                </template>
              </div>

              <template v-if="canEditTeamRoster">
                <button
                  v-for="i in mainSlotCounts"
                  :key="i"
                  class="h-48 rounded-lg border border-dashed
                   border-gray-600 text-gray-400 hover:border-primary hover:text-primary"
                  @click="handleOpenAddPlayer('main')"
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
          <div class="flex-1 h-fit w-full min-w-0">
            <h3 class="text-xl text-center font-semibold">Запас</h3>
            <el-divider class="mt-15" />

            <div class="rounded-xl bg-gray-800/30 p-16 flex flex-col gap-20 min-h-0">
              <div
                v-for="player in team?.reservedPlayers"
                :key="player.id"
                class="relative overflow-visible rounded-2xl"
              >
                <PlayerCard
                  :player="player"
                  :is-captain="player.id === team?.captain?.id"
                />
                <template v-if="showRemovePlayerButton(player)">
                  <el-popconfirm
                    v-if="team?.tournament"
                    width="320"
                    placement="top-end"
                    :title="tournamentRemovePlayerWarning"
                    confirm-button-text="Видалити"
                    cancel-button-text="Скасувати"
                    @confirm="runRemovePlayerFromTeam(player.id)"
                  >
                    <template #reference>
                      <button
                        type="button"
                        class="player-remove-from-team-btn"
                        :disabled="removePlayerLoadingId === player.id"
                        aria-label="Прибрати з команди"
                        @click.stop
                      >
                        <PhX :size="14" weight="bold" class="pointer-events-none" />
                      </button>
                    </template>
                  </el-popconfirm>
                  <button
                    v-else
                    type="button"
                    class="player-remove-from-team-btn"
                    :disabled="removePlayerLoadingId === player.id"
                    aria-label="Прибрати з команди"
                    @click.stop="handleRemovePlayerFromTeam(player.id)"
                  >
                    <PhX :size="14" weight="bold" class="pointer-events-none" />
                  </button>
                </template>
              </div>

              <template v-if="canEditTeamRoster">
                <button
                  v-for="i in reserveSlotCounts"
                  :key="i"
                  class="h-48 rounded-lg border border-dashed
                   border-gray-600 text-gray-400 hover:border-primary hover:text-primary"
                  @click="handleOpenAddPlayer('reserved')"
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
import { getApiErrorMessage } from '@/utils/api-errors'
import { routeNames } from '@/router/route-names'
import { ElMessageBox } from 'element-plus'
import { PhCopy, PhCrown, PhDotsThree, PhCalendarDots, PhPencil, PhSealCheck, PhTrash, PhUsersThree, PhX } from '@phosphor-icons/vue'
import { useClipboard, useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import TournamentBannerImage from '@/components/tournaments/TournamentBannerImage.vue'
import type { TTeamResponse } from '@/api/types/api.types'
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

const team = ref<TTeamResponse | null>(null)

const teamLogoSrc = computed(() => resolvePublicOrApiUrl(team.value?.logoUrl))

const dotaTeamIdTrimmed = computed(() => team.value?.dotaTeamId?.trim() ?? '')

const { copy } = useClipboard({ legacy: true })
const isAdmin = computed(() => {
  return authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator
})

const isTeamCaptain = computed(
  () =>
    !!authStore.user?.id &&
    !!team.value?.captain?.id &&
    authStore.user.id === team.value!.captain!.id
)

const rosterLockedForEdits = computed(() => false)

const canEditTeamRoster = computed(
  () => (isAdmin.value || isTeamCaptain.value) && !rosterLockedForEdits.value
)

function showRemovePlayerButton (player: { id: string }) {
  if (!canEditTeamRoster.value) return false
  if (isAdmin.value) return true
  const capId = team.value?.captain?.id
  if (!capId) return true
  return player.id !== capId
}

const canEditTeamProfile = computed(() => canEditTeamRoster.value)

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

const tournamentRemovePlayerWarning =
  'Гравець бере участь у турнірі. Після виходу він втратить 70% зароблених очок у цьому турнірі. Продовжити?'

const verifyTeamLoading = ref(false)
const removePlayerLoadingId = ref<string | null>(null)

async function handleVerifyTeam () {
  const tid = team.value?.id
  if (!tid || team.value?.isVerified) return
  verifyTeamLoading.value = true
  try {
    const updated = await teamsStore.updateTeam(tid, { isVerified: true })
    team.value = hydrateTeamPlayersRanks(updated)
    teamsStore.patchTeamInList(team.value)
    ElMessage.success('Команду верифіковано')
  } catch (e: unknown) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося верифікувати команду'))
  } finally {
    verifyTeamLoading.value = false
  }
}

async function refreshTeamFromServer () {
  const tid = team.value?.id ?? id
  let t = await teamsStore.findTeam(tid)
  if (!t) {
    try {
      t = await teamsService.fetchTeam(tid)
    } catch {
      return
    }
  }
  team.value = hydrateTeamPlayersRanks(t)
  teamsStore.patchTeamInList(team.value)
}

function handleOpenAddPlayer (slot: 'main' | 'reserved') {
  if (isAdmin.value) {
    open('PlayerAddToTeamModal', {
      team: team.value,
      isMain: slot === 'main',
      onAdded: refreshTeamFromServer
    })
  } else {
    open('CreateInviteModal', {
      teamId: team.value?.id,
      slot
    })
  }
}

async function runRemovePlayerFromTeam (playerId: string) {
  const tid = team.value?.id
  if (!tid) return
  removePlayerLoadingId.value = playerId
  try {
    const updated = await teamsService.removePlayerFromTeam(tid, playerId)
    playersStore.setPlayerTeamIdClientside(playerId, null)
    team.value = hydrateTeamPlayersRanks(updated)
    teamsStore.patchTeamInList(team.value)
    ElMessage.success('Гравця прибрано з команди')
  } catch (e: unknown) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося прибрати гравця'))
  } finally {
    removePlayerLoadingId.value = null
  }
}

async function handleRemovePlayerFromTeam (playerId: string) {
  if (!team.value?.id) return
  try {
    await ElMessageBox.confirm(
      'Гравця буде прибрано зі складу цієї команди.',
      'Прибрати з команди?',
      {
        confirmButtonText: 'Прибрати',
        cancelButtonText: 'Скасувати',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )
  } catch {
    return
  }
  await runRemovePlayerFromTeam(playerId)
}

async function handleTeamUpdate (payload: TUpdateTeamPayload) {
  try {
    const tid = team.value!.id
    const updatedTeam = await teamsStore.updateTeam(tid, payload)
    team.value = hydrateTeamPlayersRanks(updatedTeam)
    teamsStore.patchTeamInList(team.value)
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
  team.value = hydrateTeamPlayersRanks(t)
  teamsStore.patchTeamInList(team.value)
})
</script>

<style scoped>
/* Центр кнопки = верхній правий кут контейнера: left 100% + translate(-50%, -50%). */
.player-remove-from-team-btn {
  position: absolute;
  left: 100%;
  top: 0;
  z-index: 30;
  display: flex;
  width: 1.875rem;
  height: 1.875rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  transform-origin: center center;
  border: 1px solid rgb(255 255 255 / 0.12);
  background: linear-gradient(155deg, rgb(24 24 27 / 0.97) 0%, rgb(9 9 11 / 0.98) 100%);
  color: rgb(212 212 216);
  box-shadow:
    0 2px 10px rgb(0 0 0 / 0.45),
    inset 0 1px 0 rgb(255 255 255 / 0.06);
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition:
    transform 0.2s cubic-bezier(0.34, 1.2, 0.64, 1),
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.player-remove-from-team-btn:hover:not(:disabled) {
  transform: translate(-50%, -50%) scale(1.06);
  border-color: rgb(248 113 113 / 0.45);
  color: rgb(254 226 226);
  background: linear-gradient(155deg, rgb(69 10 10 / 0.92) 0%, rgb(9 9 11 / 0.98) 100%);
  box-shadow:
    0 6px 22px rgb(127 29 29 / 0.35),
    inset 0 1px 0 rgb(255 255 255 / 0.06);
}

.player-remove-from-team-btn:active:not(:disabled) {
  transform: translate(-50%, -50%) scale(0.94);
}

.player-remove-from-team-btn:focus-visible {
  outline: 2px solid rgb(59 130 246 / 0.75);
  outline-offset: 3px;
}

.player-remove-from-team-btn:disabled {
  cursor: not-allowed;
  opacity: 0.38;
  pointer-events: none;
}
</style>
