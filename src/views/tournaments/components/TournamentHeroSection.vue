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

    <!-- tournament.description not in new API schema -->
  </div>
</template>

<script setup lang="ts">
import TournamentStatusTag from '@/components/tournaments-tags/TournamentStatusTag.vue'
import DivisionTag from '@/components/team-tags/DivisionTag.vue'

interface IProps {
  tournament: TTournament | null
}

defineProps<IProps>()
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
