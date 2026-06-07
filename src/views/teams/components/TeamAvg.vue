<template>
  <el-tooltip :content="`AVG Rating: ${teamAvg}`">
    <button disabled class="rounded-full w-max">
      <PhInfo color="white" class="cursor-pointer" weight="duotone" :size="20" />
    </button>
  </el-tooltip>
</template>

<script setup lang="ts">
import { PhInfo } from '@phosphor-icons/vue'

const props = defineProps<{ team: TTeam | undefined | null }>()

const teamAvg = computed(() => {
  if (!props.team) return null
  const allPlayers = [...(props.team.mainPlayers || []), ...(props.team.reservedPlayers || [])]
  if (!allPlayers.length) return 0
  return Math.round(allPlayers.reduce((acc, curr) => acc + (curr.rating ?? 0), 0) / allPlayers.length)
})
</script>
