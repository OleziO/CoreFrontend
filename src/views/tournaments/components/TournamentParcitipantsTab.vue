<template>
  <div
    v-if="tournament?.teams?.length"
    class="flex py-20 flex-wrap gap-24 justify-center items-center"
  >
    <TeamCard
      v-for="team in tournament?.teams"
      :key="team.id"
      :team="team"
    />
  </div>

  <div
    v-else class="py-20 mt-20 flex items-center justify-center flex-col text-center
   border border-dashed border-white/10 rounded-xl bg-white/5"
  >
    <PhTrophy :size="40" class="text-gray-600 mb-3" />
    <p class="text-gray-400">
      {{ emptyTeamsMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhTrophy } from '@phosphor-icons/vue'
import type { TTournament as Tournament } from '@/api/types/api.types'

const props = defineProps<{ tournament: Tournament | null | undefined }>()

const emptyTeamsMessage = computed(() => {
  const end = props.tournament?.tournamentEndsAt
  if (end && Date.parse(end) < Date.now()) return 'Турнір завершено'
  return 'Поки немає команд серед учасників'
})
</script>
