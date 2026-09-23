<template>
  <FilterDialog
    v-model="modelValue"
    title="Турніри"
    :active-count="activeCount"
    :match-count="matchCount"
    @open="onOpen"
    @reset="onReset"
    @apply="onApply"
  >
    <FilterSection
      label="Статус"
      :icon="PhFlagCheckered"
      :active="filters.status.length > 0"
      @clear="filters.status = []"
    >
      <FilterChips v-model="filters.status" :options="TOURNAMENT_STATUS_FILTER_OPTIONS" />
    </FilterSection>

    <FilterSection
      label="Дата початку"
      :icon="PhCalendarBlank"
      :active="Boolean(filters.startsFrom || filters.startsTo)"
      @clear="clearDates"
    >
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        class="w-full"
        popper-class="core-date-picker-popper"
        format="DD.MM.YYYY"
        value-format="YYYY-MM-DD"
        range-separator="—"
        start-placeholder="Від"
        end-placeholder="До"
        unlink-panels
      />
    </FilterSection>

    <FilterSection
      label="Формат"
      :icon="PhTreeStructure"
      :active="filters.qualification.length > 0"
      @clear="filters.qualification = []"
    >
      <FilterChips v-model="filters.qualification" :options="TOURNAMENT_QUALIFICATION_OPTIONS" />
    </FilterSection>

    <FilterSection
      label="Призовий фонд"
      :icon="PhCoins"
      :active="filters.prize.length > 0"
      @clear="filters.prize = []"
    >
      <FilterChips v-model="filters.prize" :options="TOURNAMENT_PRIZE_OPTIONS" />
    </FilterSection>

    <FilterSection
      label="Слоти команд"
      :icon="PhUsersThree"
      :active="filters.slots.length > 0"
      @clear="filters.slots = []"
    >
      <FilterChips v-model="filters.slots" :options="TOURNAMENT_SLOTS_OPTIONS" />
    </FilterSection>
  </FilterDialog>
</template>

<script setup lang="ts">
import { PhCalendarBlank, PhCoins, PhFlagCheckered, PhTreeStructure, PhUsersThree } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { replaceQueryKeys } from '@/core/helpers'
import { useTournamentStore } from '@/views/tournaments/tournaments.store'
import {
  type ITournamentsFilters,
  TOURNAMENT_PRIZE_OPTIONS,
  TOURNAMENT_QUALIFICATION_OPTIONS,
  TOURNAMENT_SLOTS_OPTIONS,
  TOURNAMENT_STATUS_FILTER_OPTIONS,
  TOURNAMENTS_FILTER_QUERY_KEYS,
  buildTournamentsFilterQuery,
  countActiveTournamentsFilters,
  createEmptyTournamentsFilters,
  parseTournamentsFilters,
  tournamentMatchesFilters
} from '@/views/tournaments/tournaments-filters.utils'

const modelValue = defineModel<boolean>({ default: false })

const router = useRouter()
const route = useRoute()
const tournamentStore = useTournamentStore()

const filters = ref<ITournamentsFilters>(createEmptyTournamentsFilters())

// el-date-picker працює з парою [від, до]; у фільтрах вони зберігаються окремо.
const dateRange = computed<string[] | null>({
  get: () => (filters.value.startsFrom && filters.value.startsTo
    ? [filters.value.startsFrom, filters.value.startsTo]
    : null),
  set: (value: string[] | null) => {
    filters.value.startsFrom = value?.[0] ?? null
    filters.value.startsTo = value?.[1] ?? null
  }
})

const activeCount = computed(() => countActiveTournamentsFilters(filters.value))

/** Live-лічильник: скільки турнірів пройде поточний стан форми. */
const matchCount = computed(() =>
  tournamentStore.tournamentsData.filter(t => tournamentMatchesFilters(t, filters.value)).length
)

function onOpen () {
  filters.value = parseTournamentsFilters(route.query)
}

function clearDates () {
  filters.value.startsFrom = null
  filters.value.startsTo = null
}

function onReset () {
  filters.value = createEmptyTournamentsFilters()
}

function onApply () {
  router.push({
    name: routeNames.tournaments,
    query: replaceQueryKeys(route.query, TOURNAMENTS_FILTER_QUERY_KEYS, buildTournamentsFilterQuery(filters.value))
  })
  modelValue.value = false
}
</script>
