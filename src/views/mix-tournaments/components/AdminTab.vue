<!-- eslint-disable max-len -->
<template>
  <div class="w-full animate-fade-in pt-10">
    <el-tabs
      v-model="activeSubTab"
      class="w-full border-b border-white/10"
      tab-position="top"
      stretch
    >
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.value"
        :name="tab.value"
      >
        <template #label>
          <div
            class="flex-1 text-center pb-8 pt-2 md:text-lg text-sm font-medium transition-colors relative whitespace-nowrap"
            :class="activeSubTab === tab.value
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'"
          >
            <span>{{ tab.label }}</span>
            <span
              v-if="activeSubTab === tab.value"
              class="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            />
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>

    <div class="min-h-[400px] mt-20">
      <transition name="fade" mode="out-in">
        <div v-if="activeSubTab === 'participants'" key="participants">
          <div class="bg-[#1e2330] p-6 rounded-md border border-white/5 min-h-[400px]">
            <ParticipantsTab
              :tournament="tournamentData"
              :participants="tournamentData.mix_pools || []"
              :tournament-status="tournamentData.status"
              @open-add-player="openAddModal"
              @open-auto-search="showNotifyModal = true"
              @edit-pool="handleEditPool"
              @toggle-captain="handleToggleCaptain"
              @remove-player="handleRemovePlayer($event)"
            />
          </div>
        </div>

        <div v-else-if="activeSubTab === 'matches'" key="matches">
          <div class="bg-[#1e2330] flex flex-col gap-10 md:p-20 p-10 rounded-md border border-white/5">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-bold text-white">Відкриті матчі</h3>
              <el-tooltip placement="top" content="Оновити матчі">
                <el-button type="primary" class="rounded-sm px-10" @click="async () => await mixStore.getOpenMatches(tournamentData.id)">
                  <el-icon :size="20" class="mr-1"><Refresh /></el-icon>
                </el-button>
              </el-tooltip>
            </div>

            <el-table
              :data="mixStore.openMatches[tournamentData.id]"
              row-key="id"
              class="h-[350px] overflow-auto border rounded-md"
              empty-text="Немає активних матчів"
            >
              <!-- Команда 1 -->
              <el-table-column label="Команда 1" min-width="200">
                <template #header>
                  <div class="flex items-center gap-20 py-10 pl-20">Команда 1</div>
                </template>
                <template #default="{ row }">
                  <div class="flex items-center gap-20 py-10">
                    <el-avatar
                      :src="row.team1?.img_url ? `${apiPublicUrl}${row.team1.img_url}` : ''"
                      class="ring-2 ring-gray-800 shadow-md transition-all duration-300"
                    >
                      <template #default>
                        <PhUsers size="28" weight="bold" class="text-blue-400/70" />
                      </template>
                    </el-avatar>
                    <span class="text-sm font-bold text-blue-400">
                      {{ row.team1?.team_name || `Team #${row.team1_id}` }}
                    </span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column>
                vs
              </el-table-column>

              <!-- Команда 2 -->
              <el-table-column label="Команда 2" min-width="200">
                <template #header>
                  <div class="flex items-center gap-20 py-10 pl-20">Команда 2</div>
                </template>
                <template #default="{ row }">
                  <div class="flex items-center gap-20 py-10">
                    <el-avatar
                      :src="row.team2?.img_url ? `${apiPublicUrl}${row.team2.img_url}` : ''"
                      class="ring-2 ring-gray-800 shadow-md transition-all duration-300"
                    >
                      <template #default>
                        <PhUsers size="28" weight="bold" class="text-red-400/70" />
                      </template>
                    </el-avatar>
                    <span class="text-sm font-bold text-red-400">
                      {{ row.team2?.team_name || `Team #${row.team2_id}` }}
                    </span>
                  </div>
                </template>
              </el-table-column>

              <!-- Раунд -->
              <el-table-column label="Раунд" prop="round" width="100" align="center">
                <template #header>
                  <div class="text-center py-10">Раунд</div>
                </template>
                <template #default="{ row }">
                  <div class="text-center text-gray-200 font-medium">{{ row.round }}</div>
                </template>
              </el-table-column>

              <!-- Дії -->
              <el-table-column label="" align="right" width="220">
                <template #header>
                  <div class="text-center py-10">Дії</div>
                </template>
                <template #default="{ row }">
                  <div class="flex justify-end px-20 gap-10">
                    <el-button
                      type="primary"
                      @click="openMatchResultModal(row)"
                    >
                      Вказати результат
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div v-else-if="activeSubTab === 'status'" key="status">
          <div class="bg-[#111827] border border-white/5 rounded-xl p-20 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div class="flex items-center gap-10 relative z-10">
              <div class="w-26 h-26 rounded-xl flex items-center justify-center shrink-0 border bg-white/5 backdrop-blur-sm" :class="statusIconBorder">
                <svg v-if="tournamentData.status === 'pre-registration'" xmlns="http://www.w3.org/2000/svg" class="w-20 h-20 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <svg v-else-if="tournamentData.status === 'registration'" xmlns="http://www.w3.org/2000/svg" class="w-20 h-20 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                <svg v-else-if="tournamentData.status === 'team-creation'" xmlns="http://www.w3.org/2000/svg" class="w-20 h-20 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <svg v-else-if="tournamentData.status === 'in-progress'" xmlns="http://www.w3.org/2000/svg" class="w-20 h-20 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              </div>

              <div>
                <div class="flex items-center gap-10">
                  <span class="text-gray-400 text-xs font-bold uppercase tracking-widest">Поточний етап</span>
                  <span class="text-[10px] font-bold px-10 min-w-50 flex justify-center items-center py-0.5 rounded border uppercase tracking-wider" :class="statusBadgeStyles">
                    {{ tournamentActions?.[tournamentData?.status as ETournamentStatus]?.label }}
                  </span>
                </div>
              </div>
            </div>

            <div class="w-full md:w-auto shrink-0 relative z-10">
              <el-button
                v-if="currentAction"
                type="primary"
                class="w-full md:w-auto flex items-center justify-center gap-3 rounded-lg px-20 py-3.5"
                :disabled="mixStore.isLoading || tournamentData.status === ETournamentStatus.Ended"
                @click="updateStatus(currentAction.nextStatus as ETournamentStatus)"
              >
                Наступний етап
              </el-button>

              <div v-else class="px-6 py-3 border border-white/5 rounded-xl text-gray-500 text-sm bg-white/[0.02] font-mono">
                Дії недоступні
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <el-dialog
      v-model="showAddModal"

      title="Додати гравця на турнір"
      width="600px"
    >
      <div class="flex flex-col gap-20">
        <div class="flex gap-10">
          <el-input
            v-model="searchQuery"
            placeholder="Пошук по ніку"
            clearable
            size="large"
            class="flex-1 min-w-[60%]"
          >
            <template #prefix>
              <PhMagnifyingGlass />
            </template>
          </el-input>
        </div>

        <div class="w-full !h-[400px] overflow-hidden">
          <RecycleScroller
            :items="filteredPlayers"
            key-field="id"
            :buffer="1000"
            class="w-full !max-h-[400px] rounded-xl overflow-auto"
            :item-size="85"
          >
            <template #default="{ item: row }">
              <div class="flex justify-between items-center border-b !h-80 border-white/20 hover:bg-white/5 transition p-10">
                <!-- Гравець -->
                <div class="flex items-center gap-10">
                  <el-avatar :src="getAvatarUrl(row.avatar_url)" class="size-50" />
                  <div class="flex flex-col leading-tight">
                    <span class="font-bold text-gray-200">
                      {{ row.steam_name }}
                    </span>
                    <span v-if="row.user_name" class="text-xs text-gray-500">
                      @{{ row.user_name }}
                    </span>
                  </div>
                </div>

                <!-- Дії -->
                <div class="flex justify-end">
                  <el-button
                    type="primary"
                    size="small"
                    :disabled="isPlayerAlreadyIn(row.id)"
                    @click.stop="addPlayer(row)"
                  >
                    {{ isPlayerAlreadyIn(row.id) ? 'Уже в турнірі' : 'Додати' }}
                  </el-button>
                </div>
              </div>
            </template>
          </RecycleScroller>

          <!-- Порожній стан -->
          <div
            v-if="!filteredPlayers.length"
            class="text-center py-10 text-gray-500 text-sm"
          >
            Гравців не знайдено
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="showPoolDialog"
      title="Змінити пул гравця"
      width="400px"
      class="custom-dialog"
    >
      <div v-if="poolPlayer" class="flex flex-col gap-5">
        <div class="flex items-center gap-4 bg-white/5 p-4 rounded-lg border border-white/5">
          <el-avatar
            :size="40"
            :src="getAvatarUrl(poolPlayer.player?.avatar_url)"
            class="shrink-0"
          />
          <div class="overflow-hidden">
            <div class="font-bold text-gray-200 truncate">
              {{ poolPlayer.player?.steam_name || 'Unknown' }}
            </div>
            <div class="text-xs text-gray-500 truncate">
              {{ poolPlayer.player?.user_name }}
            </div>
          </div>
        </div>

        <div class="flex flex-col">
          <div class="mb-2 text-sm text-gray-400">Вкажіть пул гравця (1 - слабий, 5 - сильний):</div>
          <el-input-number
            v-model="poolValue"
            :min="1"
            :max="5"
            class="w-max"
            size="default"
          />
        </div>

        <div class="flex justify-end gap-3 mt-2">
          <el-button @click="showPoolDialog = false">Скасувати</el-button>
          <el-button
            type="primary"
            @click="submitPool"
          >
            Зберегти
          </el-button>
        </div>
      </div>
    </el-dialog>

    <RewardMixWinnerModal
      v-model="showRewardModal"
      :tournament-id="tournamentData.id"
      :teams
      :participants="tournamentData.mix_pools || []"
    />

    <MatchResultModal
      v-if="selectedMatch"
      v-model="showMatchResultModal"
      :tournament-id="tournamentData.id"
      :match="selectedMatch"
      @success="handleMatchResultSuccess"
    />
    <NotifyMixPlayersModal
      v-model="showNotifyModal"
      :tournament-id="tournamentData.id"
    />
  </div>
</template>

<script setup lang="ts">
import RewardMixWinnerModal from '../modals/RewardMixWinnerModal.vue'
import MatchResultModal from '../modals/MatchResultModal.vue'
import NotifyMixPlayersModal from '../modals/NotifyMixPlayersModal.vue'
import { PhUsers, PhMagnifyingGlass } from '@phosphor-icons/vue'
import { searchPlayer } from '@/core/helpers'

const props = defineProps<{
  tournamentData: TMixTournament
  teams: TMixTeam[]
}>()

enum ETournamentStatus {
  PreRegistration = 'pre-registration',
  Registration = 'registration',
  TeamCreation = 'team-creation',
  InProgress = 'in-progress',
  Ended = 'ended'
}

const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const tabs = [
  { value: 'status', label: 'Етапи турніру' },
  { value: 'matches', label: 'Управління матчами' },
  { value: 'participants', label: 'Управління учасниками' }
]

const tournamentActions: Record<ETournamentStatus, ITournamentAction> = {
  [ETournamentStatus.PreRegistration]: { label: 'Незабаром', nextStatus: ETournamentStatus.Registration },
  [ETournamentStatus.Registration]: { label: 'Реєстрація', nextStatus: ETournamentStatus.TeamCreation },
  [ETournamentStatus.TeamCreation]: { label: 'Створення команд', nextStatus: ETournamentStatus.InProgress },
  [ETournamentStatus.InProgress]: { label: 'Live', nextStatus: ETournamentStatus.Ended },
  [ETournamentStatus.Ended]: { label: 'Турнір завершено', nextStatus: null }
}

const mixStore = useMixTournamentStore()
const playerStore = usePlayersStore()

const activeSubTab = ref('status')
const showRewardModal = ref(false)
const showNotifyModal = ref(false)

const showMatchResultModal = ref(false)

const showAddModal = ref(false)
const searchQuery = ref('')

const showPoolDialog = ref(false)
const poolPlayer = ref<any>(null)
const poolValue = ref(1)

const selectedMatch = ref<TMixOpenMatch | null>(null)

const openMatchResultModal = (match: any) => {
  selectedMatch.value = match
  showMatchResultModal.value = true
}

const currentAction = computed(() => {
  const status = props.tournamentData?.status as ETournamentStatus
  return status ? tournamentActions[status] : null
})

const statusIconBorder = computed(() => {
  const map: Record<string, string> = {
    'pre-registration': 'border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    registration: 'border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]',
    'team-creation': 'border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]',
    'in-progress': 'border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    ended: 'border-white/10'
  }
  return map[props.tournamentData?.status] || 'border-white/10'
})

const statusBadgeStyles = computed(() => {
  const map: Record<string, string> = {
    'pre-registration': 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    registration: 'border-green-500/30 bg-green-500/10 text-green-400',
    'team-creation': 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    'in-progress': 'border-red-500/30 bg-red-500/10 text-red-400',
    ended: 'border-gray-600 bg-gray-700/50 text-gray-400'
  }
  return map[props.tournamentData?.status] || 'border-gray-600 text-gray-400'
})

async function handleMatchResultSuccess () {
  // TODO
}

async function updateStatus (nextStatus: string) {
  if (nextStatus === 'ended') {
    showRewardModal.value = true
    return
  }

  let confirmMsg = `Змінити статус на "${nextStatus}"?`

  if (nextStatus === 'team-creation') {
    confirmMsg = 'Сформувати пули та перейти до створення команд? Ця дія автоматично розподілить гравців.'
  }
  if (nextStatus === 'in-progress') {
    confirmMsg = 'Сформувати сітку для MIX CUP?'
  }

  if (!confirm(confirmMsg)) return

  try {
    if (nextStatus === 'team-creation') {
      await mixStore.distributePools(props.tournamentData.id)
    }
    if (nextStatus === 'in-progress') {
      await mixStore.startMixBracket(props.tournamentData.id)
    }
  } catch (e) {
    console.error(e)
  }
}

const filteredPlayers = computed(() => {
  if (!searchQuery.value) {
    return playerStore.players?.filter(player => filterPlayers(player))
  }

  return playerStore.players?.filter(player =>
    filterPlayers(player) && searchPlayer(player, searchQuery.value.trim())
  )
})

function filterPlayers (player: TPlayer) {
  return playerStore.isVerified(player) && !isPlayerAlreadyIn(player.id)
}

const openAddModal = () => {
  searchQuery.value = ''
  showAddModal.value = true
}

function isPlayerAlreadyIn (playerId: number) {
  const pools = props.tournamentData.mix_pools || []

  return !!pools.find((p) => p.player_id === playerId)
}

function getAvatarUrl (path: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${apiPublicUrl}${path}`
}

async function addPlayer (player: TPlayer) {
  await mixStore.addPlayerToMix(player, props.tournamentData.id)
}

async function handleRemovePlayer (player: TMixPoolEntry) {
  await mixStore.removePlayerFromMix(props.tournamentData, player.player_id)
}

function handleEditPool (entry: any) {
  poolPlayer.value = entry
  poolValue.value = entry.pool || 0
  showPoolDialog.value = true
}

async function submitPool () {
  await mixStore.setPlayerPoll(
    props.tournamentData.id,
    poolPlayer.value.player_id,
    poolValue.value
  )

  showPoolDialog.value = false
}

async function handleToggleCaptain (entry: any) {
  const newStatus = !entry.is_cap

  try {
    await mixStore.toggleCapitanPlayer(
      props.tournamentData.id,
      entry.player_id,
      newStatus
    )
  } catch (e) {
    console.error(e)
  }
}

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

:deep(.custom-dialog) {
  background-color: #1e2330;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
:deep(.custom-dialog .el-dialog__title) {
  color: #fff;
}
:deep(.custom-dialog .el-dialog__body) {
  padding-top: 10px;
}
</style>
