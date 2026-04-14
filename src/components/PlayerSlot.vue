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
            :src="player.avatarUrl"
          />
        </div>

        <h1 class="text-sm text-white uppercase pr-10 border-r border-white">
          {{ player.discordName }}
        </h1>
      </div>

      <div class="flex gap-10">
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
import { routeNames } from '@/router/route-names'
import { ShieldCheck, ShieldX } from 'lucide-vue-next'
import type { TPlayer as Player } from '@/api/types/api.types'

const props = defineProps<{ player: Player }>()
const isVerified = computed(() => !!props.player.verifiedAt)
</script>
