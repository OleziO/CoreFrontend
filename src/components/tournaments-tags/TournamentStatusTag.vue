<template>
  <el-tag
    v-if="isValidStatus"
    class="flex justify-center items-center !h-auto
           relative overflow-hidden rounded-lg border border-white/10"
    :class="statusClass"
  >
    <div
      class="absolute inset-0
             bg-gradient-to-b from-black/15 to-black/35
             backdrop-blur-sm
             pointer-events-none rounded-lg transition-all duration-300"
    />

    <span class="relative z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-xs font-medium">
      {{ statusLabel }}
    </span>
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  TOURNAMENT_STATUS_VALUES,
  tournamentStatusClassMap,
  tournamentStatusLabelMap,
  type TTournamentStatusValue
} from './tournament.constants'

const props = defineProps<{
  status?: string | null
}>()

function isTournamentStatus (s: string): s is TTournamentStatusValue {
  return (TOURNAMENT_STATUS_VALUES as readonly string[]).includes(s)
}

const isValidStatus = computed(() =>
  !!props.status && isTournamentStatus(props.status)
)

const statusClass = computed(() =>
  props.status && isTournamentStatus(props.status)
    ? tournamentStatusClassMap[props.status]
    : ''
)

const statusLabel = computed(() => {
  if (!props.status) return ''
  return isTournamentStatus(props.status)
    ? tournamentStatusLabelMap[props.status]
    : props.status
})
</script>
