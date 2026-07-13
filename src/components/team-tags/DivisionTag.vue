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
      :class="[
        fullWidth ? 'flex w-full min-w-0' : 'inline-flex',
        'relative cursor-default items-center justify-center outline-none backdrop-blur-sm transition-all duration-300',
        divisionShellClass,
        sizeClass
      ]"
    >
      <span
        v-if="variant !== 'tournamentCard'"
        class="pointer-events-none absolute inset-0 rounded-[inherit]
               bg-gradient-to-b from-white/[0.08] to-black/35 opacity-95"
      />
      <span
        :class="variant === 'tournamentCard'
          ? 'relative z-10 whitespace-nowrap text-[13px] font-semibold uppercase leading-snug tracking-wide'
          : 'relative z-10 whitespace-nowrap font-semibold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]'
        "
      >
        {{ divisionLabel }}
      </span>
    </span>
  </el-tooltip>
  <span
    v-else-if="divisionKey"
    :class="[
      fullWidth ? 'flex w-full min-w-0' : 'inline-flex',
      'relative cursor-default items-center justify-center outline-none backdrop-blur-sm transition-all duration-300',
      divisionShellClass,
      sizeClass
    ]"
  >
    <span
      v-if="variant !== 'tournamentCard'"
      class="pointer-events-none absolute inset-0 rounded-[inherit]
             bg-gradient-to-b from-white/[0.08] to-black/35 opacity-95"
    />
    <span
      :class="variant === 'tournamentCard'
        ? 'relative z-10 whitespace-nowrap text-[13px] font-semibold uppercase leading-snug tracking-wide'
        : 'relative z-10 whitespace-nowrap font-semibold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]'
      "
    >
      {{ divisionLabel }}
    </span>
  </span>
</template>

<script setup lang="ts">
import {
  normalizeTournamentDivision,
  tournamentDivisionCardChipClassMap,
  tournamentDivisionLabelMap,
  tournamentDivisionMmrHintMap,
  tournamentDivisionTagClassMap,
  type TTournamentDivisionValue
} from '@/components/tournaments-tags/tournament.constants'

const props = withDefaults(
  defineProps<{
    division?: string | null
    /**
     * hero — великий тег поруч із TournamentStatusTag;
     * card — компактний чіп; profile — акцентний бейдж на картці профілю команди;
     * tournamentCard — чіп у картці турніру.
     */
    variant?: 'hero' | 'card' | 'profile' | 'tournamentCard'
    showTooltip?: boolean
    /** На всю ширину батька (наприклад, картка команди). */
    fullWidth?: boolean
  }>(),
  {
    variant: 'hero',
    showTooltip: true,
    fullWidth: false
  }
)

const divisionKey = computed((): TTournamentDivisionValue | null =>
  normalizeTournamentDivision(props.division)
)

const divisionLabel = computed(() =>
  divisionKey.value ? tournamentDivisionLabelMap[divisionKey.value] : ''
)

const mmrHint = computed(() =>
  divisionKey.value ? tournamentDivisionMmrHintMap[divisionKey.value] : ''
)

const divisionShellClass = computed(() => {
  const key = divisionKey.value
  if (!key) return ''
  return props.variant === 'tournamentCard'
    ? tournamentDivisionCardChipClassMap[key]
    : tournamentDivisionTagClassMap[key]
})

const sizeClass = computed(() => {
  if (props.variant === 'tournamentCard') {
    return 'relative flex min-w-0 items-center justify-center overflow-hidden rounded-xl px-12 py-10'
  }
  if (props.variant === 'card') {
    return 'relative overflow-hidden rounded-lg px-12 py-6 text-[10px] uppercase tracking-[0.14em]'
  }
  if (props.variant === 'profile') {
    return 'relative overflow-hidden rounded-xl px-16 py-8 text-[15px] uppercase tracking-[0.16em]'
  }
  return 'relative overflow-hidden rounded-lg px-14 py-8 text-[12px] uppercase'
})
</script>
