<template>
  <el-tooltip :content="`AVG: ${teamAvg} ММР`">
    <button disabled class="rounded-full w-max">
      <PhInfo color="white" class="cursor-pointer" weight="duotone" :size="20" />
    </button>
  </el-tooltip>
</template>

<script setup lang="ts">
import { PhInfo } from '@phosphor-icons/vue'
const props = defineProps<{team: TTeam | undefined | null}>()

const teamAvg = computed(() => {
  if (!props.team) return null
  return props.team?.players.reduce((acc, curr) => acc + (curr.mmr as number), 0) / 5
})
</script>
