<template>
  <FilterDialog
    v-model="modelValue"
    title="Гравці шукають"
    :active-count="activeCount"
    @open="onOpen"
    @reset="onReset"
    @apply="onApply"
  >
    <FilterSection
      label="Рейтинг"
      hint="MMR"
      :icon="PhChartBar"
      :active="filters.ratingFrom != null || filters.ratingTo != null"
      @clear="clearRating"
    >
      <FilterRange
        v-model:from="filters.ratingFrom"
        v-model:to="filters.ratingTo"
        :max="MAX_RATING"
        unit="MMR"
        aria-label="Рейтинг"
      />
    </FilterSection>

    <FilterSection
      label="Ранг"
      :icon="PhMedal"
      :active="filters.ranks.length > 0"
      @clear="filters.ranks = []"
    >
      <FilterChips v-model="filters.ranks" :options="rankOptions" />
    </FilterSection>

    <FilterSection
      label="Позиції"
      :icon="PhTarget"
      :active="filters.positions.length > 0"
      @clear="filters.positions = []"
    >
      <FilterChips v-model="filters.positions" :options="positionChipOptions" />
    </FilterSection>

    <FilterSection
      label="Формат"
      hint="Хоче грати"
      :icon="PhGameController"
      :active="filters.formats.length > 0"
      @clear="clearFormats"
    >
      <div class="flex flex-col gap-10">
        <FilterChips v-model="filters.formats" :options="formatChipOptions" />

        <div v-if="wantsLan" class="flex flex-col gap-6">
          <label for="find-filter-lan-cities" class="text-xs text-gray-400">Міста для LAN-турнірів</label>
          <el-select
            id="find-filter-lan-cities"
            v-model="filters.lanCities"
            :loading="citiesLoading"
            :filter-method="onLanCityFilter"
            multiple
            filterable
            :reserve-keyword="false"
            clearable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            placeholder="Оберіть міста"
            class="w-full"
            @visible-change="onLanCityVisibleChange"
          >
            <el-option v-for="city in visibleLanCityOptions" :key="city" :label="city" :value="city" />
          </el-select>
        </div>
      </div>
    </FilterSection>
  </FilterDialog>
</template>

<script setup lang="ts">
import { PhChartBar, PhGameController, PhMedal, PhTarget } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { getPlayerRankImageSrc, replaceQueryKeys } from '@/core/helpers'
import { MAX_RATING, positionOptions, wantToPlayOptions } from '@/components/player-tags/player.enums'
import { useLocations } from '@/composables/use-locations'
import { RANK_TIER_OPTIONS } from '@/views/players/players-filters.utils'
import type { IFilterChipOption } from '@/components/filters/filters.d'
import type { TTournamentFormat } from '@/api/types/api.types'
import type { IFindPlayersFilters } from '@/views/find/find.d'
import {
  FIND_PLAYERS_FILTER_QUERY_KEYS,
  buildFindPlayersFilterQuery,
  countActiveFindPlayersFilters,
  createEmptyFindPlayersFilters,
  parseFindPlayersFilters
} from '@/views/find/find-filters.utils'

const modelValue = defineModel<boolean>({ default: false })

const router = useRouter()
const route = useRoute()

const filters = ref<IFindPlayersFilters>(createEmptyFindPlayersFilters())

const rankOptions: IFilterChipOption<number>[] = RANK_TIER_OPTIONS.map(opt => ({
  ...opt,
  image: getPlayerRankImageSrc(opt.value * 10 + 1)
}))

const positionChipOptions: IFilterChipOption<number>[] = positionOptions.map(pos => ({
  value: pos.value,
  label: pos.label,
  icon: pos.icon,
  hint: String(pos.value)
}))

const formatChipOptions: IFilterChipOption<TTournamentFormat>[] = wantToPlayOptions.map(opt => ({
  value: opt.value,
  label: opt.label,
  icon: opt.icon
}))

// ─── LAN-міста (той самий довідник UA, що й у фільтрі гравців) ───────────────
const LAN_COUNTRY_CODE = 'UA'
const CITY_RENDER_LIMIT = 200

const { citiesLoading, loadCities, citiesOf } = useLocations()

const wantsLan = computed(() => filters.value.formats.includes('LAN'))

watch(wantsLan, (on) => {
  if (on) loadCities(LAN_COUNTRY_CODE).catch(() => { /* тост уже показав locationsService */ })
}, { immediate: true })

const lanCityQuery = ref('')

function onLanCityFilter (query: string) {
  lanCityQuery.value = query
}

function onLanCityVisibleChange (visible: boolean) {
  if (!visible) lanCityQuery.value = ''
}

const visibleLanCityOptions = computed<string[]>(() => {
  const all = citiesOf(LAN_COUNTRY_CODE)
  const q = lanCityQuery.value.trim().toLowerCase()
  const head = (q ? all.filter(name => name.toLowerCase().includes(q)) : all).slice(0, CITY_RENDER_LIMIT)
  if (!q) {
    for (const selected of filters.value.lanCities) {
      if (!head.includes(selected)) head.unshift(selected)
    }
  }
  return head
})

function clearFormats () {
  filters.value.formats = []
  filters.value.lanCities = []
}

function clearRating () {
  filters.value.ratingFrom = null
  filters.value.ratingTo = null
}

const activeCount = computed(() => countActiveFindPlayersFilters(filters.value))

function onOpen () {
  filters.value = parseFindPlayersFilters(route.query)
}

function onReset () {
  filters.value = createEmptyFindPlayersFilters()
}

function onApply () {
  router.push({
    name: routeNames.find,
    query: replaceQueryKeys(route.query, FIND_PLAYERS_FILTER_QUERY_KEYS, buildFindPlayersFilterQuery(filters.value))
  })
  modelValue.value = false
}
</script>
