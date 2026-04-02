<template>
  <div class="w-full flex justify-between gap-10 items-center">
    <div class="flex gap-10">
      <div
        v-for="(entity, index) in filteredRoles"
        :key="index"
      >
        <el-tag
          v-if="checkRoles(playersStore.player?.roles as TRole[],
                           entity.value as unknown as EUserRoles)" type="primary"
        >
          {{ entity.label }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import checkRoles from '@/core/helpers'
import { playersRolesArr } from '@/constants/players'
import type { EUserRoles } from '@/components/player-tags/player.constants'

const playersStore = usePlayersStore()

const filteredRoles = computed(() => {
  return playersRolesArr.filter(el => {
    return checkRoles(playersStore.player?.roles, el.value as unknown as EUserRoles)
  })
})

</script>
