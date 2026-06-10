<template>
  <div class="flex flex-col gap-12 lg:gap-16 animate-fade-in-up">
    <h1
      class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white
       tracking-tight leading-[1.05] drop-shadow-2xl lg:mb-2"
    >
      {{ tournament?.name }}
    </h1>

    <div class="flex md:flex-nowrap flex-wrap items-stretch gap-8 lg:gap-10 max-w-lg">
      <TournamentStatusTag
        :status="tournament?.tournamentStatus"
        class="shadow-lg flex-1 shadow-black/20 justify-center"
      />
      <DivisionTag
        :division="tournament?.division"
        variant="hero"
        class="shrink-0 self-center shadow-lg shadow-black/25"
      />
    </div>

    <!-- Meta: prize / participants / start — icon + label hierarchy -->
    <div class="flex flex-wrap items-center gap-x-16 gap-y-8 text-small">
      <span class="inline-flex items-center gap-6 font-semibold text-gold">
        <PhTrophy :size="18" weight="fill" />
        {{ prizeLabel }}
      </span>
      <span class="inline-flex items-center gap-6 text-white/80">
        <PhUsersThree :size="18" weight="bold" />
        {{ participantsLabel }}
      </span>
      <span v-if="startLabel" class="inline-flex items-center gap-6 text-white/80">
        <PhCalendarBlank :size="18" weight="bold" />
        {{ startLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import DivisionTag from '@/components/team-tags/DivisionTag.vue'
import { PhTrophy, PhUsersThree, PhCalendarBlank } from '@phosphor-icons/vue'
import { formatTournamentPrizeUah } from '@/core/utils/formatters'

interface IProps {
  tournament: TTournament | null
}

const props = defineProps<IProps>()

const prizeLabel = computed(() => formatTournamentPrizeUah(props.tournament?.prizePool))

const participantsLabel = computed(() => {
  const count = props.tournament?.teams?.length ?? 0
  const slots = props.tournament?.tournamentSlots
  return slots ? `${count}/${slots} команд` : `${count} команд`
})

const startLabel = computed(() => {
  const starts = props.tournament?.tournamentStartsAt
  if (!starts) return ''
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(starts))
})
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}
</style>
