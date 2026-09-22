<template>
  <div
    v-if="tournament?.teams?.length"
    class="flex flex-wrap justify-center gap-x-12 gap-y-16 px-10 py-20"
  >
    <div
      v-for="team in tournament?.teams"
      :key="team.id"
      class="w-[300px] max-w-full shrink-0"
    >
      <TeamCard
        :team="team"
      />
    </div>
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
import { PhTrophy } from '@phosphor-icons/vue'

const props = defineProps<{ tournament: TTournament | null | undefined }>()

const emptyTeamsMessage = computed(() => {
  const end = props.tournament?.tournamentEndsAt
  if (end && Date.parse(end) < Date.now()) return 'Турнір завершено'
  return 'Поки немає команд серед учасників'
})
</script>
