<template>
  <RouterLink v-if="player" :to="{ name: routeNames.player, params: { id: player.id } }">
    <div
      class="relative flex items-center justify-between py-10 px-10 rounded-2xl
             bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
             border shadow-[0_0_20px_rgba(0,0,0,0.5)]
             transition-all duration-300 ease-out cursor-pointer
             hover:border-primary/60"
      :class="isVerified
        ? 'border-green-800 hover:shadow-green-800'
        : 'border-red-800 hover:shadow-red-800'"
    >
      <div class="flex items-center gap-10 z-10 justify-between w-full">
        <div class="flex items-center justify-between w-full gap-10">
          <div class="relative truncate flex items-center gap-15">
            <el-avatar
              :src="player.avatarUrl ?? ''"
              class="border-2 relative min-w-50 size-50 border-gray-700 shadow-sm transition-all duration-300"
            />

            <div class="flex truncate flex-col">
              <div>
                <h3
                  class="text-white truncate font-semibold leading-tight
                         group-hover:text-primary transition-colors duration-300 flex gap-5 items-center"
                >
                  <el-tooltip :content="player.discordName || '-'" placement="top">
                    <span class="max-w-[100px] truncate">{{ player.discordName }}</span>
                  </el-tooltip>
                </h3>

                <el-tooltip :content="player.discordUsername || ''">
                  <span
                    class="text-xs text-gray-500 hover:text-primary animate-pulse
                           transition-colors duration-300 truncate block max-w-100 md:max-w-200"
                    @click.prevent="player.discordUsername && getCopy(player.discordUsername, 'Discord скопійовано')"
                  >
                    {{ player.discordUsername ? `@${player.discordUsername}` : '-' }}
                  </span>
                </el-tooltip>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-10">
            <el-tooltip
              :content="`${player.rating?.toString()} Rating`"
              effect="dark"
              placement="top"
            >
              <span class="text-sm text-white/70">{{ player.rating }}</span>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router'
import { routeNames } from '@/router/route-names'
import { getCopy } from '@/core/helpers'
import type { TPlayer } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  player: TPlayer | null
  showStatusGlow?: boolean
  showRegularCap?: boolean
  skipTeamFetch?: boolean
  isMixCap?: boolean
}>(), {
  showStatusGlow: true,
  showRegularCap: true,
  skipTeamFetch: false
})
// const emit = defineEmits(['removePlayer'])

const isVerified = computed(() => {
  return !!props.player?.verifiedAt
})

// function kickFromTeam () {
//   emit('removePlayer', props.player?.id)
// }
</script>
