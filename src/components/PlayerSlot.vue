<template>
  <RouterLink :to="{name: routeNames.player, params: {id: player.id}}">
    <div
      class="relative flex min-h-64 justify-between items-center bg-dark-800 shadow-sm p-10
    w-full"
    >
      <div class="flex gap-10 items-center">
        <h1 class="text-sm text-white pr-10 border-r border-white">
          ID: {{ player.id }}
        </h1>
        <div>
          <el-avatar
            :size="30"
            :src="getImageUrl(player.avatar_url)"
          />
        </div>

        <h1 class="text-sm text-white uppercase pr-10 border-r border-white">
          {{ player.steam_name }}
        </h1>
        <h2 v-if="player.team?.team_name" class="text-sm text-white uppercase pr-10 border-r border-white">
          {{ player.team?.team_name }}
        </h2>
        <div>
          <el-tooltip
            v-if="player.rang?.stop_mmr || player.rang?.start_mmr"
            :content="String(player.rang?.stop_mmr || player.rang.start_mmr) as string"
          >
            <el-image :src="rank" class="max-w-30" />
          </el-tooltip>
          <el-image v-else :src="rank" class="max-w-35" />
        </div>
      </div>

      <div class="flex gap-10">
        <div v-if="player.is_cap">
          <el-tag effect="plain" type="warning">
            Капітан
          </el-tag>
        </div>
        <el-tooltip :content="isVerified ? 'Верифікований' : 'Не верифікований'">
          <div :class="isVerified ? 'text-green-500' : 'text-yellow-400'">
            <component :is="isVerified ? ShieldCheck : ShieldX" :size="24" />
          </div>
        </el-tooltip>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import checkRoles, { getImageUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { ERole } from '@/types/general.types'
import { ShieldCheck, ShieldX } from 'lucide-vue-next'
const props = defineProps<{ player: TPlayer }>()
const isVerified = checkRoles(props.player.roles || [], ERole.PLAYER)
const rank = computed(() => {
  return `/images/ranks/${props.player.rang?.img_url}`
})
</script>
