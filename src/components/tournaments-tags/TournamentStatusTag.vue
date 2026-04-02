<template>
  <el-tag
    v-if="isValidStatus"
    class="flex justify-center items-center !h-auto
           relative overflow-hidden rounded-lg border border-white/10"
    :class="statusClass"
  >
    <!-- ПОКРАЩЕНЕ ЗАТЕМНЕННЯ -->
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
  ETournamentStatus,
  tournamentStatusClassMap,
  tournamentStatusLabelMap
} from './tournament.constants'

const props = defineProps<{
  status?: ETournamentStatus | null
}>()

const isValidStatus = computed(() =>
  props.status && tournamentStatusClassMap[props.status as ETournamentStatus]
)

const statusClass = computed(() =>
  props.status ? tournamentStatusClassMap[props.status as ETournamentStatus] || '' : ''
)

const statusLabel = computed(() =>
  props.status ? tournamentStatusLabelMap[props.status as ETournamentStatus] || props.status : ''
)
</script>
