<template>
  <div
    class="relative group flex flex-col items-center overflow-hidden
          rounded-2xl border !h-[390px] !w-[280px]
          bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
          p-20 pt-15 cursor-pointer
          shadow-[0_10px_30px_rgba(0,0,0,0.55)]
          transition-all duration-300 ease-out"
    :class="team.isVerified
      ? 'border-green-800/70 hover:shadow-[0_0_35px_rgba(34,197,94,0.35)]'
      : 'border-red-800/70 hover:shadow-[0_0_35px_rgba(239,68,68,0.35)]'"
    @click="goToTeamPage(team.id)"
  >
    <!-- CONTENT -->
    <div class="flex w-full flex-col items-center">
      <!-- INFO -->
      <div class="mt-12 flex w-full flex-col items-center text-center">
        <el-tooltip placement="top" :content="team.name">
          <h1
            class="max-w-full truncate
                  text-base mb-5 font-semibold tracking-wide
                  text-gray-100"
          >
            {{ team.name }}
          </h1>
        </el-tooltip>

        <div
          class="mt-10 flex w-full gap-10 border-t border-dashed py-16"
          :class="team.isVerified
            ? 'border-green-800/60'
            : 'border-red-800/60'"
        >
          <el-tag :type="team.isVerified ? 'success' : 'danger'" size="small">
            {{ team.isVerified ? 'Верифікована' : 'Не верифікована' }}
          </el-tag>
        </div>
      </div>

      <!-- ACTIONS -->
      <div class="flex w-full flex-1 mt-4">
        <el-badge
          :value="computedPlayersCount"
          :hidden="!computedPlayersCount"
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
import { routeNames } from '@/router/route-names'
import { PhUsersThree } from '@phosphor-icons/vue'
import type { TTeam as Team } from '@/api/types/api.types'

const props = defineProps<{
  team: Team
  width?: number
}>()

const router = useRouter()
const { open } = useAppModals()

const computedPlayersCount = computed(() => {
  return (props.team.mainPlayers?.length ?? 0) + (props.team.reservedPlayers?.length ?? 0)
})

function openTeamDrawer (team: Team) {
  open('TeamsPlayersDrawer', { team })
}

function goToTeamPage (id: string) {
  router.push({ name: routeNames.team, params: { id } })
}
</script>
