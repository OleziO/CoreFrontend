<template>
  <el-tag
    v-if="isValidStatus"
    :class="statusClass"
    disable-transitions
  >
    {{ statusLabel }}
  </el-tag>
</template>

<script setup lang="ts">
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
