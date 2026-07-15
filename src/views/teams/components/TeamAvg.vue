<template>
  <el-tooltip :content="`AVG Rating: ${teamAvg}`">
    <button disabled class="rounded-full w-max">
      <PhInfo color="white" class="cursor-pointer" weight="duotone" :size="20" />
    </button>
  </el-tooltip>
</template>

<script setup lang="ts">
import { PhInfo } from '@phosphor-icons/vue'
import { computeTeamAvgRatingRounded } from '@/components/tournaments-tags/tournament.constants'

const props = defineProps<{ team: TTeam | undefined | null }>()

// Основа без запасних — так само, як рахує бекенд (`avgRating`) і як показують
// картка та профіль команди.
const teamAvg = computed(() =>
  props.team?.avgRating ?? computeTeamAvgRatingRounded(props.team?.mainPlayers)
)
</script>
