<template>
  <div
    v-if="tournament?.teams?.length"
    class="flex py-20 flex-wrap gap-16 justify-center"
  >
    <TeamCard
      v-for="team in tournament?.teams"
      :key="team.id"
      :team="team"
      class="w-full md:w-[calc(50%-18px)] max-w-[300px] lg:w-[calc(25%-16px)]"
    />
  </div>

  <div
    v-else class="py-20 mt-20 flex items-center justify-center flex-col text-center
   border border-dashed border-white/10 rounded-xl bg-white/5"
  >
    <PhTrophy :size="40" class="text-gray-600 mb-3" />
    <p class="text-gray-400">
      {{ tournament?.tournamentStatus === 'COMPLETED'
        ? 'Турнір завершено' : 'Ще немає зареєстрованих команд' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { PhTrophy } from '@phosphor-icons/vue'
import type { TTournament as Tournament } from '@/api/types/api.types'

defineProps<{tournament: Tournament | null | undefined}>()
</script>
