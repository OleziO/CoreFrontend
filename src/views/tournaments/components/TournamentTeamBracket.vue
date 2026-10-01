<template>
  <div
    v-if="tournament?.tournamentGridUrl &&
      (tournament.tournamentStatus === ETournamentStatus.PLAYOFF || isEndedBySchedule(tournament))"
    class="w-full h-full"
  >
    <iframe
      :src="getBracketUrl(tournament.tournamentGridUrl)"
      width="100%"
      height="500"
      frameborder="0"
      scrolling="auto"
      allowtransparency="true"
      class="sm:h-[600px] rounded-lg border-0"
    />
  </div>
  <div v-else class="flex flex-col items-center gap-4 text-gray-500">
    <el-icon :size="40"><Trophy /></el-icon>
    <p>Сітка турніру недоступна</p>
  </div>
</template>

<script setup lang="ts">
import { Trophy } from '@element-plus/icons-vue'
import { ETournamentStatus } from '@/components/tournaments-tags/tournament.constants'

defineProps<{ tournament: TTournament | undefined }>()

function isEndedBySchedule (t: TTournament): boolean {
  if (!t.tournamentEndsAt) return false
  return Date.parse(t.tournamentEndsAt) < Date.now()
}

function getBracketUrl (url: string) {
  if (!url) return ''
  const moduleParams = 'match_width_multiplier=1.6&multiplier=1.2&show_tournament_name=1'

  if (url.includes('/module')) {
    return url.includes('?') ? url : `${url}?${moduleParams}`
  }

  const challongePattern = /^(https?:\/\/challonge\.com\/)(.+)$/
  const match = url.match(challongePattern)

  if (match) {
    const [, baseUrl, id] = match
    const langPrefix = id.startsWith('uk/') ? '' : 'uk/'
    return `${baseUrl}${langPrefix}${id}/module?${moduleParams}?
    multiplier=3?allowtransparency=true?allowRoundCollapsing=false`
  }

  return url
}
</script>
