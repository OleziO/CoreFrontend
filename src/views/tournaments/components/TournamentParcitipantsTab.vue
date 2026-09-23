<template>
  <!-- Сітка команд: 4 у ряд на широких екранах, краї збігаються з контейнером сторінки -->
  <div
    v-if="tournament?.teams?.length"
    class="grid grid-cols-1 gap-12 py-20 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  >
    <div
      v-for="team in tournament?.teams"
      :key="team.id"
      class="min-w-0 w-full"
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
