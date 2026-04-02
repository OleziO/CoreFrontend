<template>
  <div
    class="relative group flex w-full flex-col items-center overflow-hidden
           rounded-2xl border border-gray-800
           bg-gradient-to-br from-gray-900 via-[#13151b] to-gray-950
           p-15 cursor-default
           shadow-[0_10px_30px_rgba(0,0,0,0.4)]
           transition-all duration-300 ease-out
           hover:border-primary/30"
  >
    <div class="flex w-full flex-col items-center">
      <el-tooltip v-if="avgMmr > 0" content="Середній рейтинг команди" placement="top">
        <div
          class="flex items-center gap-2 border-2 text-white text-xs font-medium
           border-yellow-500 rounded-lg p-8 absolute right-20 shadow-2xl top-20 z-10
           bg-yellow-600/90"
        >
          <PhTrophy />
          <span class="drop-shadow-lg">{{ avgMmr }} MMP</span>
        </div>
      </el-tooltip>

      <div
        class="relative overflow-hidden rounded-xl w-full h-[180px]
               ring-white/5 ring-2 ring-offset-2 ring-offset-gray-900 shadow-md"
      >
        <el-image
          v-if="team?.img_url"
          class="w-full h-full object-cover"
          fit="cover"
          :src="apiPublicUrl ? apiPublicUrl + team.img_url : team.img_url"
        >
          <template #error>
            <div class="flex items-center justify-center w-full h-full bg-[#151a23] text-gray-600">
              <Users :size="48" stroke-width="1.5" />
            </div>
          </template>
        </el-image>

        <div
          v-else
          class="flex flex-col items-center justify-center w-full
          h-full bg-gradient-to-br from-[#1c2029] to-[#0f1219] text-white/10"
        >
          <span class="text-xs uppercase tracking-widest font-bold mb-1">Team</span>
          <span class="text-2xl font-mono font-bold text-white/20">#{{ teamId }}</span>
        </div>
      </div>

      <div class="flex w-full flex-col items-center text-center mt-20">
        <div>
          <el-tooltip placement="top" :disabled="!!team?.team_name" :content="team?.team_name || ''">
            <h1
              class="max-w-full truncate
                   text-base mb-2 font-semibold tracking-wide
                   text-gray-100"
            >
              {{ team?.team_name || `Team Stack #${teamId}` }}
            </h1>
          </el-tooltip>
        </div>

        <div class="flex items-center gap-3 text-xs text-gray-500 font-medium">
          <span
            class="text-xs mt-1 flex gap-4 items-center
             text-gray-500/80 hover:text-primary
             transition-all duration-300 cursor-pointer"
            @click.stop="team?.dota_team_id && copyDotaTeamID(team.dota_team_id)"
          >
            {{ team?.dota_team_id || '-' }}
            <PhCopy v-if="team?.dota_team_id" size="14" />
          </span>

          <span class="w-1 h-1 rounded-full bg-gray-700" />
        </div>

        <div class="my-4 w-1/2 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      </div>

      <div class="flex w-full flex-1 mt-30">
        <el-badge
          :value="filledSlotsCount"
          :hidden="filledSlotsCount === 0"
          :offset="[-5, 5]"
          class="flex-1 w-full"
          type="primary"
        >
          <el-button
            type="primary"
            class="!w-full !rounded-lg !bg-white/5 !border-none hover:!bg-primary
             hover:!text-white transition-all duration-300 cursor-pointer"
            @click="showDrawer = true"
          >
            <div class="flex items-center justify-center py-10 gap-2 opacity-80 hover:opacity-100">
              <PhUsersThree :size="16" weight="bold" />
              <span class="font-medium">Учасники</span>
            </div>
          </el-button>
        </el-badge>
      </div>
    </div>
  </div>

  <el-drawer
    v-model="showDrawer"
    direction="rtl"
    :title="team?.team_name || ''"
    :size="450"
    class="!bg-[#0b0e14] !border-l !border-white/10"
  >
    <div class="flex flex-col h-full relative">
      <div
        v-if="avgMmr > 0" class="flex w-max items-center gap-2 border text-white text-xs font-medium
             border-gray-400/40 rounded-full px-8 py-2 bg-gray-400/40"
      >
        <span># {{ teamId }}</span>
      </div>

      <div class="flex-1 py-15 flex flex-col gap-4">
        <div class="flex flex-col gap-8">
          <template v-for="(slot, index) in slots" :key="`slot-${index}`">
            <div
              v-if="isPlayerSlot(slot)"
              class=" rounded-xl p-1 shadow-sm"
            >
              <PlayerCard
                v-if="playersMap.get(slot.player_id || 0)"
                :player="playersMap.get(slot.player_id!) || null"
                skip-team-fetch
                :show-regular-cap="false"
                :is-mix-cap="!!tournament?.mix_pools?.find(p => p.player_id === slot.player_id)?.is_cap"
                class="!bg-transparent !shadow-none !border-none"
                @remove-player="(pid) => emit('removePlayer', pid)"
              />
            </div>

            <template v-else-if="isPoolSlot(slot)">
              <AddPlayerCardButton
                v-if="isAdmin && slot?.pool_info"
                :freeSlot="slot.pool_info"
                clickable
                @click="handleAddPlayerClick(slot)"
              >
                <template #title>
                  <span>Додати гравця</span>
                </template>

                <template #icon>
                  <PhUserPlus :size="20" weight="bold" />
                </template>
              </AddPlayerCardButton>

              <AddPlayerCardButton
                v-else-if="slot.pool_info"
                :freeSlot="slot.pool_info"
              >
                <template #title>
                  Гравця немає
                </template>

                <template #icon>
                  <PhProhibit :size="20" weight="bold" />
                </template>
              </AddPlayerCardButton>
            </template>
          </template>
        </div>

        <div v-if="slots.length === 0" class="flex flex-col items-center justify-center py-10 opacity-30">
          <Users :size="48" />
          <span class="mt-2 text-sm">Слотів не знайдено</span>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { Users } from 'lucide-vue-next'
import checkRoles from '@/core/helpers'
import { ERole } from '@/types/general.types'
import { PhUsersThree, PhTrophy, PhCopy, PhUserPlus, PhProhibit } from '@phosphor-icons/vue'

const { open } = useAppModals()
const authStore = useAuthStore()

const showDrawer = ref(false)
const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const props = defineProps<{
  teamId: string | number
  players: number[]
  team?: TMixTeam
  tournament?: TMixTournament
}>()

const emit = defineEmits(['removePlayer'])

const playersStore = usePlayersStore()

const playersMap = computed(() => {
  return new Map(playersStore.players.map(p => [p.id, p]))
})

const slots = computed(() => {
  if (props.team?.slots && Array.isArray(props.team.slots)) {
    return props.team.slots
  }

  return props.players.map(id => {
    return {
      player_id: id,
      pool_info: null
    }
  })
})

const filledSlotsCount = computed(() => {
  return slots.value.filter(isPlayerSlot).length
})

const isAdmin = computed(() => {
  return checkRoles(authStore.user?.roles || [], ERole.ADMIN) ||
         checkRoles(authStore.user?.roles || [], ERole.MODERATOR)
})

const avgMmr = computed(() => {
  const playerSlots = slots.value.filter(isPlayerSlot)

  if (!playerSlots.length) return 0

  const total = playerSlots.reduce((acc: number, curr: any) => acc + (curr.mmr || 0), 0)

  return Math.floor(total / playerSlots.length)
})

const isPlayerSlot = (slot: any) => {
  return slot && slot.player_id && !slot.pool_info
}

const isPoolSlot = (slot: any) => {
  return slot && slot.pool_info
}

const handleAddPlayerClick = (slot: any) => {
  if (!props.tournament?.id) {
    console.error('Tournament ID is required')
    return
  }

  open('AddPlayerToMixTeamModal', {
    tournament: props.tournament,
    teamId: Number(props.teamId),
    poolInfo: {
      pool: slot.pool_info.pool,
      min_mmr: slot.pool_info.min_mmr,
      max_mmr: slot.pool_info.max_mmr
    }
  })
}
const { copy } = useClipboard({ legacy: true })

function copyDotaTeamID (id: number) {
  if (!id) return
  copy(String(id))
  ElMessage.success('Dota id скопійовано')
}
</script>
