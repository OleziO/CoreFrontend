<template>
  <FilterDialog
    v-model="modelValue"
    title="Команди"
    :active-count="activeCount"
    :match-count="matchCount"
    @open="onOpen"
    @reset="onReset"
    @apply="onApply"
  >
    <FilterSection
      label="Верифікація"
      :icon="PhSealCheck"
      :active="filters.status.length > 0"
      @clear="filters.status = []"
    >
      <FilterChips v-model="filters.status" :options="statusChipOptions" />
    </FilterSection>

    <FilterSection
      label="Середній рейтинг"
      hint="MMR основи"
      :icon="PhChartBar"
      :active="filters.ratingFrom != null || filters.ratingTo != null"
      @clear="clearRating"
    >
      <FilterRange
        v-model:from="filters.ratingFrom"
        v-model:to="filters.ratingTo"
        :max="MAX_RATING"
        unit="MMR"
        aria-label="Середній рейтинг"
      />
    </FilterSection>

    <FilterSection
      label="Склад"
      :icon="PhUsersThree"
      :active="filters.roster.length > 0"
      @clear="filters.roster = []"
    >
      <FilterChips v-model="filters.roster" :options="TEAM_ROSTER_OPTIONS" />
    </FilterSection>

    <FilterSection
      label="Тренер"
      :icon="PhStrategy"
      :active="filters.coach.length > 0"
      @clear="filters.coach = []"
    >
      <FilterChips v-model="filters.coach" :options="TEAM_COACH_OPTIONS" />
    </FilterSection>

    <FilterSection
      label="Активність"
      :icon="PhTrophy"
      :active="filters.playing.length > 0"
      @clear="filters.playing = []"
    >
      <FilterChips v-model="filters.playing" :options="TEAM_ACTIVITY_OPTIONS" />
    </FilterSection>
  </FilterDialog>
</template>

<script setup lang="ts">
import { PhChartBar, PhSealCheck, PhSealWarning, PhStrategy, PhTrophy, PhUsersThree } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { replaceQueryKeys } from '@/core/helpers'
import { MAX_RATING } from '@/components/player-tags/player.enums'
import { teamStatus } from '@/views/teams/teams.enums'
import type { IFilterChipOption } from '@/components/filters/filters.d'
import {
  type ITeamsFilters,
  TEAM_ACTIVITY_OPTIONS,
  TEAM_COACH_OPTIONS,
  TEAM_ROSTER_OPTIONS,
  TEAMS_FILTER_QUERY_KEYS,
  buildTeamsFilterQuery,
  countActiveTeamsFilters,
  createEmptyTeamsFilters,
  parseTeamsFilters,
  teamMatchesFilters
} from '@/views/teams/teams-filters.utils'

const modelValue = defineModel<boolean>({ default: false })

const router = useRouter()
const route = useRoute()
const teamsStore = useTeamsStore()

const filters = ref<ITeamsFilters>(createEmptyTeamsFilters())

const statusChipOptions: IFilterChipOption<string>[] = teamStatus.map(item => ({
  value: item.key,
  label: item.label,
  icon: item.key === 'approved' ? PhSealCheck : PhSealWarning
}))

const activeCount = computed(() => countActiveTeamsFilters(filters.value))

/** Live-лічильник: скільки команд пройде поточний стан форми. */
const matchCount = computed(() => teamsStore.teams.filter(team => teamMatchesFilters(team, filters.value)).length)

function onOpen () {
  filters.value = parseTeamsFilters(route.query)
}

function clearRating () {
  filters.value.ratingFrom = null
  filters.value.ratingTo = null
}

function onReset () {
  filters.value = createEmptyTeamsFilters()
}

function onApply () {
  router.push({
    name: routeNames.teams,
    query: replaceQueryKeys(route.query, TEAMS_FILTER_QUERY_KEYS, buildTeamsFilterQuery(filters.value))
  })
  modelValue.value = false
}
</script>
