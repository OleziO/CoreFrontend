<template>
  <div
    class="rounded-xl border border-white/10 shadow-elevation-2
     bg-surface flex relative flex-col w-full flex-1 gap-20 lg:self-stretch min-h-0 p-20 2xs:min-w-[400px]
     overflow-y-auto"
  >
    <div class="grid min-h-0 h-fit grid-cols-1 gap-20 2sm:grid-cols-2">
      <!-- MAIN ROSTER -->
      <div class="flex-1 h-fit w-full min-w-0">
        <h3 class="text-xl text-center font-semibold flex items-center justify-center gap-8">
          <span>Основа</span>
          <el-tooltip
            placement="top"
            effect="dark"
            :content="mainRosterAvgRatingTooltip"
          >
            <span
              class="inline-flex cursor-default text-gray-500 outline-none transition-colors hover:text-white/75"
              tabindex="0"
              role="img"
              aria-label="Середній рейтинг основи"
            >
              <PhInfo :size="20" weight="bold" />
            </span>
          </el-tooltip>
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
            <template v-if="showRemoveButton(player)">
              <el-popconfirm
                v-if="hasActiveTournaments"
                width="320"
                placement="top-end"
                :title="tournamentRemovePlayerWarning"
                confirm-button-text="Видалити"
                cancel-button-text="Скасувати"
                @confirm="emit('remove-player', player.id)"
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
                @click.stop="confirmAndRemovePlayer(player.id)"
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
              @click="emit('add-player', 'main')"
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
            <template v-if="showRemoveButton(player)">
              <el-popconfirm
                v-if="hasActiveTournaments"
                width="320"
                placement="top-end"
                :title="tournamentRemovePlayerWarning"
                confirm-button-text="Видалити"
                cancel-button-text="Скасувати"
                @confirm="emit('remove-player', player.id)"
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
                @click.stop="confirmAndRemovePlayer(player.id)"
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
              @click="emit('add-player', 'reserved')"
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

        <!-- COACH -->
        <div
          v-if="team?.coach || canEditTeamRoster"
          class="mt-20"
        >
          <h3 class="text-xl text-center font-semibold">Тренер</h3>
          <el-divider class="mt-15" />

          <div class="rounded-xl bg-gray-800/30 p-16 flex flex-col gap-20 min-h-0">
            <div
              v-if="team?.coach"
              class="relative overflow-visible rounded-2xl"
            >
              <PlayerCard :player="team.coach" />
              <button
                v-if="canEditTeamRoster"
                type="button"
                class="player-remove-from-team-btn"
                :disabled="removeCoachLoading"
                aria-label="Прибрати тренера"
                @click.stop="confirmAndRemoveCoach()"
              >
                <PhX :size="14" weight="bold" class="pointer-events-none" />
              </button>
            </div>

            <button
              v-else-if="canEditTeamRoster"
              class="h-48 rounded-lg border border-dashed
               border-gray-600 text-gray-400 hover:border-primary hover:text-primary"
              @click="emit('add-player', 'coach')"
            >
              + Додати тренера
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { PhInfo, PhX } from '@phosphor-icons/vue'

const props = defineProps<{
  team: TTeam | null
  canEditTeamRoster: boolean
  isAdmin: boolean
  removePlayerLoadingId: string | null
  removeCoachLoading: boolean
}>()

const emit = defineEmits<{
  'remove-player': [playerId: string]
  'remove-coach': []
  'add-player': [slot: 'main' | 'reserved' | 'coach']
}>()

const hasActiveTournaments = computed(() => !!props.team?.tournaments?.length)

const tournamentRemovePlayerWarning =
  'Гравець бере участь у турнірі. Після виходу він втратить 70% зароблених очок у цьому турнірі. Продовжити?'

const mainSlotCounts = computed(() => {
  const count = props.team?.mainPlayers?.length ?? 0
  return Math.max(0, 5 - count)
})

const reserveSlotCounts = computed(() => {
  const count = props.team?.reservedPlayers?.length ?? 0
  return Math.max(0, 3 - count)
})

const mainRosterAvgRatingRounded = computed(() => {
  const mains = props.team?.mainPlayers ?? []
  if (!mains.length) return null
  const sum = mains.reduce((acc, p) => acc + (Number(p.rating) || 0), 0)
  return Math.round(sum / mains.length)
})

const mainRosterAvgRatingTooltip = computed(() => {
  const avg = mainRosterAvgRatingRounded.value
  if (avg == null) return 'У складі основи поки немає гравців'
  return `Середній рейтинг основи: ${avg}`
})

function showRemoveButton (player: { id: string }) {
  if (!props.canEditTeamRoster) return false
  if (props.isAdmin) return true
  const capId = props.team?.captain?.id
  if (!capId) return true
  return player.id !== capId
}

async function confirmAndRemovePlayer (playerId: string) {
  const confirmed = await ElMessageBox.confirm(
    'Гравця буде прибрано зі складу цієї команди.',
    'Прибрати з команди?',
    {
      confirmButtonText: 'Прибрати',
      cancelButtonText: 'Скасувати',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(() => true).catch(() => false)
  if (confirmed) emit('remove-player', playerId)
}

async function confirmAndRemoveCoach () {
  const confirmed = await ElMessageBox.confirm(
    'Тренера буде прибрано з команди.',
    'Прибрати тренера?',
    {
      confirmButtonText: 'Прибрати',
      cancelButtonText: 'Скасувати',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(() => true).catch(() => false)
  if (confirmed) emit('remove-coach')
}
</script>

<style scoped>
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
