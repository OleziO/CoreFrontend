<template>
  <div
    class="relative group flex flex-col items-center overflow-hidden
          rounded-2xl border !h-[390px] !w-[280px]
          bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
          p-20 pt-15 cursor-pointer
          shadow-[0_10px_30px_rgba(0,0,0,0.55)]
          transition-all duration-300 ease-out"
    :class="isVerified
      ? 'border-green-800/70 hover:shadow-[0_0_35px_rgba(34,197,94,0.35)]'
      : 'border-red-800/70 hover:shadow-[0_0_35px_rgba(239,68,68,0.35)]'"
    @click="goToTeamPage(team.id)"
  >
    <!-- CONTENT -->
    <div class="flex w-full flex-col items-center">
      <!-- AVATAR -->
      <div
        class="relative overflow-hidden rounded-lg
            ring-white/10 ring-2 ring-gray-800 shadow-md transition-all duration-300"
      >
        <el-avatar
          shape="square"
          class="h-180 w-228"
          fit="cover"
          :src="getImageUrl(team.avatar_url)"
        >
          <PhUsersFour size="60" />
        </el-avatar>
      </div>

      <!-- INFO -->
      <div class="mt-12 flex w-full flex-col items-center text-center">
        <el-tooltip placement="top" :content="team.team_name">
          <h1
            class="max-w-full truncate
                  text-base mb-5 font-semibold tracking-wide
                  text-gray-100"
          >
            {{ team.team_name }}
          </h1>
        </el-tooltip>

        <span
          class="text-xs mt-1 flex gap-4 items-center
             text-gray-500/80 hover:text-primary
             transition-all duration-300 cursor-pointer"
          @click.stop="team.dota_team_id && copyDotaTeamID(team.dota_team_id)"
        >
          {{ team.dota_team_id || '-' }}
          <PhCopy v-if="team.dota_team_id" size="14" />
        </span>

        <div
          class="mt-10 flex w-full gap-10 border-t border-dashed py-16"
          :class="isVerified
            ? 'border-green-800/60'
            : 'border-red-800/60'"
        >
          <StatusTag :status="team.status" />
          <DivisionTag :divisionName="(team.calculated_division?.name as EDivision)" />
        </div>
      </div>

      <!-- DIVIDER -->
      <!-- <div
        class="my-18 h-px w-2/3
              bg-gradient-to-r from-transparent via-gray-600 to-transparent"
      /> -->

      <!-- ACTIONS -->
      <div class="flex w-full flex-1 mt-4">
        <el-badge
          :value="computedPlayers.main.length"
          :hidden="!computedPlayers.main"
          :offset="[-6, 3]"
          class="flex-1"
          type="primary"
        >
          <el-button
            type="primary"
            class="w-full"
            @click.stop="openTeamDrawer(team)"
          >
            <PhUsersThree size="16" weight="bold" class="text-white/70" />
            <span class="ml-8">Учасники</span>
          </el-button>
        </el-badge>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { getImageUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { PhUsersThree, PhCopy, PhUsersFour } from '@phosphor-icons/vue'
import type { EDivision } from './team-tags/team.constants'

const props = defineProps<{
  team: TTeam
  width?: number
}>()

const { copy } = useClipboard({ legacy: true })
const router = useRouter()
const { open } = useAppModals()

const isVerified = computed(() => {
  return props.team.status === 'approved'
})

const computedPlayers = computed(() => {
  return {
    main: props.team.players
  }
})

function openTeamDrawer (team: TTeam) {
  open('TeamsPlayersDrawer', { team })
}

function copyDotaTeamID (id: number) {
  if (!id) return
  copy(String(id))
  ElMessage.success('Dota id скопійовано')
}

function goToTeamPage (id: number) {
  router.push({ name: routeNames.team, params: { id } })
}
</script>
