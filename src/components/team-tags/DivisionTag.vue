<template>
  <el-tooltip
    v-if="divisionKey && showTooltip"
    placement="bottom"
    effect="dark"
    :show-after="180"
    :disabled="!mmrHint"
  >
    <template #content>
      <span class="max-w-[260px] text-xs leading-relaxed">{{ mmrHint }}</span>
    </template>
    <span
      class="inline-flex cursor-default items-center justify-center rounded-lg outline-none backdrop-blur-sm transition-all duration-300"
      :class="[divisionShellClass, sizeClass]"
    >
      <span
        class="pointer-events-none absolute inset-0 rounded-[inherit]
               bg-gradient-to-b from-white/[0.08] to-black/35 opacity-95"
      />
      <span class="relative z-10 whitespace-nowrap font-semibold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
        {{ divisionLabel }}
      </span>
    </span>
  </el-tooltip>
  <span
    v-else-if="divisionKey"
    class="inline-flex cursor-default items-center justify-center rounded-lg outline-none backdrop-blur-sm transition-all duration-300"
    :class="[divisionShellClass, sizeClass]"
  >
    <span
      class="pointer-events-none absolute inset-0 rounded-[inherit]
             bg-gradient-to-b from-white/[0.08] to-black/35 opacity-95"
    />
    <span class="relative z-10 whitespace-nowrap font-semibold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
      {{ divisionLabel }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  TOURNAMENT_DIVISION_VALUES,
  tournamentDivisionLabelMap,
  tournamentDivisionMmrHintMap,
  tournamentDivisionTagClassMap,
  type TTournamentDivisionValue
} from '@/components/tournaments-tags/tournament.constants'

const props = withDefaults(
  defineProps<{
    division?: string | null
    /** Великий тег поруч із TournamentStatusTag. */
    variant?: 'hero' | 'card'
    showTooltip?: boolean
  }>(),
  {
    variant: 'hero',
    showTooltip: true
  }
)

function isDivisionKey (v: string): v is TTournamentDivisionValue {
  return (TOURNAMENT_DIVISION_VALUES as readonly string[]).includes(v)
}

const divisionKey = computed((): TTournamentDivisionValue | null => {
  const d = props.division
  return d && isDivisionKey(d) ? d : null
})

const divisionLabel = computed(() =>
  divisionKey.value ? tournamentDivisionLabelMap[divisionKey.value] : ''
)

const mmrHint = computed(() =>
  divisionKey.value ? tournamentDivisionMmrHintMap[divisionKey.value] : ''
)

const divisionShellClass = computed(() =>
  divisionKey.value ? tournamentDivisionTagClassMap[divisionKey.value] : ''
)

const sizeClass = computed(() =>
  props.variant === 'card'
    ? 'relative overflow-hidden px-10 py-5 text-[10px] uppercase tracking-[0.12em]'
    : 'relative overflow-hidden px-14 py-8 text-[12px]'
)
</script>
