<template>
  <el-drawer
    v-model="modelValue"
    direction="rtl"
    :size="450"
    @close="close"
  >
    <template #header>
      <div class="flex flex-col gap-4">
        <h1 class="text-xl font-semibold text-white tracking-wide">
          {{ displayTeam.name }}
        </h1>
      </div>
    </template>

    <div class="flex flex-col h-full relative justify-between overflow-auto">
      <div class="flex flex-col gap-20 relative pb-16">
        <h2 class="text-md font-bold text-gray-300">
          Основний склад
        </h2>
        <div class="bg-[rgba(24,24,27,0.6)] rounded-xl text-white p-16 border border-[rgba(255,255,255,0.08)]">
          <div class="flex flex-col gap-12">
            <PlayerCard
              v-for="player in displayTeam.mainPlayers"
              :key="player.id"
              :player="player"
              :is-captain="player.id === displayTeam.captain?.id"
              @player-updated="onPlayerVerificationUpdated"
            />
            <div v-for="index in mainSlotCounts" :key="index">
              <button
                v-if="isAdmin"
                class="flex items-center justify-center gap-8 w-full h-48
                   rounded-lg border border-dashed border-gray-600
                   text-sm font-medium text-gray-400
                   transition-all duration-200
                   hover:border-primary
                   hover:text-primary
                   hover:bg-gray-800/50"
                @click="onAddPlayerClick(true)"
              >
                <Plus :size="16" />
                Додати гравця
              </button>

              <button
                v-else
                disabled
                class="flex items-center justify-center gap-8 w-full h-48
                   rounded-lg border border-dashed border-gray-700
                   text-sm text-gray-600 cursor-not-allowed"
              >
                Відсутній
              </button>
            </div>
          </div>
        </div>

        <h3 class="text-md mt-10 font-bold text-[rgba(161,161,170,1)] pl-1">
          Запас
        </h3>
        <div class="bg-[rgba(24,24,27,0.2)] rounded-xl text-white p-16 border border-[rgba(255,255,255,0.04)]">
          <div class="flex flex-col gap-12">
            <PlayerCard
              v-for="player in displayTeam.reservedPlayers"
              :key="player.id"
              :player="player"
              :is-captain="player.id === displayTeam.captain?.id"
              @player-updated="onPlayerVerificationUpdated"
            />

            <div v-for="index in reserveSlotCounts" :key="index">
              <button
                v-if="isAdmin"
                class="flex items-center justify-center gap-8 w-full h-48
                   rounded-lg border border-dashed border-gray-600
                   text-sm font-medium text-gray-400
                   transition-all duration-200
                   hover:border-primary
                   hover:text-primary
                   hover:bg-gray-800/50"
                @click="onAddPlayerClick(false)"
              >
                <Plus :size="16" />
                Додати гравця
              </button>

              <button
                v-else
                disabled
                class="flex items-center justify-center gap-8 w-full h-48
                   rounded-lg border border-dashed border-gray-700
                   text-sm text-gray-600 cursor-not-allowed"
              >
                Відсутній
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { TTeam as Team, TPlayer } from '@/api/types/api.types'
import { hydrateTeamPlayersRanks, shallowSnapshotTeamForHydrate } from '@/views/teams/team-roster-hydrate'

const props = defineProps<{
  team: Team
}>()

const modelValue = defineModel<boolean>({ default: false })

const displayTeam = ref<Team>(props.team)

const { open } = useAppModals()
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator)

watch(
  () => props.team,
  () => {
    displayTeam.value = props.team
    if (modelValue.value) {
      void loadHydratedRoster()
    }
  }
)

watch(modelValue, (open) => {
  if (open) {
    void loadHydratedRoster()
  } else {
    displayTeam.value = props.team
  }
})

async function loadHydratedRoster () {
  displayTeam.value = await hydrateTeamPlayersRanks(
    shallowSnapshotTeamForHydrate(props.team)
  )
}

function onAddPlayerClick (isMain: boolean) {
  open('PlayerAddToTeamModal', {
    team: props.team,
    isMain
  })
}

function applyVerificationToRoster (t: Team, updated: TPlayer) {
  for (const key of ['mainPlayers', 'reservedPlayers'] as const) {
    const list = t[key]
    if (!list?.length) continue
    const ix = list.findIndex(p => p.id === updated.id)
    if (ix !== -1) {
      list.splice(ix, 1, updated)
      break
    }
  }
}

function onPlayerVerificationUpdated (updated: TPlayer) {
  applyVerificationToRoster(props.team, updated)
  const d = displayTeam.value
  if (d !== props.team) {
    applyVerificationToRoster(d, updated)
  }
}

const mainSlotCounts = computed(() => {
  return Math.max(0, 5 - (props.team.mainPlayers?.length ?? 0))
})

const reserveSlotCounts = computed(() => {
  return Math.max(0, 3 - (props.team.reservedPlayers?.length ?? 0))
})

function close () {
  modelValue.value = false
}
</script>