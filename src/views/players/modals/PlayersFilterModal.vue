<template>
  <FilterDialog
    v-model="modelValue"
    title="Гравці"
    :active-count="activeCount"
    :match-count="matchCount"
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
      label="Ролі"
      :icon="PhUserGear"
      :active="filters.roles.length > 0"
      @clear="filters.roles = []"
    >
      <el-select
        v-model="filters.roles"
        :loading="rolesLoading"
        multiple
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="3"
        placeholder="Оберіть ролі"
        class="w-full"
      >
        <el-option
          v-for="role in playersStore.userRolesCatalog"
          :key="role.id"
          :label="role.name"
          :value="role.name"
        />
      </el-select>
    </FilterSection>

    <FilterSection
      label="Команда"
      :icon="PhUsersThree"
      :active="filters.teamStatus.length > 0"
      @clear="filters.teamStatus = []"
    >
      <FilterChips v-model="filters.teamStatus" :options="teamStatusChipOptions" />
    </FilterSection>

    <FilterSection
      label="Верифікація"
      :icon="PhSealCheck"
      :active="filters.verificationStatus.length > 0"
      @clear="filters.verificationStatus = []"
    >
      <FilterChips v-model="filters.verificationStatus" :options="verificationChipOptions" />
    </FilterSection>

    <FilterSection
      label="Steam"
      :icon="PhSteamLogo"
      :active="filters.steam.length > 0"
      @clear="filters.steam = []"
    >
      <FilterChips v-model="filters.steam" :options="STEAM_LINK_OPTIONS" />
    </FilterSection>

    <FilterSection
      label="Формат"
      hint="Хочу грати"
      :icon="PhGameController"
      :active="filters.formats.length > 0"
      @clear="clearFormats"
    >
      <div class="flex flex-col gap-10">
        <FilterChips v-model="filters.formats" :options="formatChipOptions" />

        <!-- LAN: міста України, куди гравець готовий приїхати -->
        <div v-if="wantsLan" class="flex flex-col gap-6">
          <label for="players-filter-lan-cities" class="text-xs text-gray-400">
            Міста для LAN-турнірів
          </label>
          <el-select
            id="players-filter-lan-cities"
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
            <el-option
              v-for="city in visibleLanCityOptions"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
        </div>
      </div>
    </FilterSection>
  </FilterDialog>
</template>

<script setup lang="ts">
import {
  PhChartBar,
  PhGameController,
  PhMedal,
  PhSealCheck,
  PhSealWarning,
  PhSteamLogo,
  PhTarget,
  PhUserGear,
  PhUsersThree
} from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { getPlayerRankImageSrc, replaceQueryKeys } from '@/core/helpers'
import {
  MAX_RATING,
  positionOptions,
  teamStatusOptions,
  verificationOptions,
  wantToPlayOptions
} from '@/components/player-tags/player.enums'
import { ERole } from '@/types/general.enums'
import { useLocations } from '@/composables/use-locations'
import type { IFilterChipOption } from '@/components/filters/filters.d'
import type { TTournamentFormat } from '@/api/types/api.types'
import {
  type IPlayersFilters,
  PLAYERS_FILTER_QUERY_KEYS,
  RANK_TIER_OPTIONS,
  STEAM_LINK_OPTIONS,
  buildPlayersFilterQuery,
  countActivePlayersFilters,
  createEmptyPlayersFilters,
  parsePlayersFilters,
  playerMatchesFilters
} from '@/views/players/players-filters.utils'

const modelValue = defineModel<boolean>({ default: false })

const router = useRouter()
const route = useRoute()
const playersStore = usePlayersStore()

const filters = ref<IPlayersFilters>(createEmptyPlayersFilters())
const rolesLoading = ref(false)

// Медаль першої зірки кожного тиру як піктограма чипа.
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

const teamStatusChipOptions: IFilterChipOption<boolean>[] = teamStatusOptions.map(opt => ({
  value: opt.value,
  label: opt.label
}))

const verificationChipOptions: IFilterChipOption<string>[] = verificationOptions.map(opt => ({
  value: opt.value,
  label: opt.label,
  icon: opt.value === ERole.PLAYER ? PhSealCheck : PhSealWarning
}))

const formatChipOptions: IFilterChipOption<TTournamentFormat>[] = wantToPlayOptions.map(opt => ({
  value: opt.value,
  label: opt.label,
  icon: opt.icon
}))

// ─── LAN-міста ───────────────────────────────────────────────────────────────
/** LAN-турніри проходять в Україні — міста беремо з довідника UA (як у редакторі профілю). */
const LAN_COUNTRY_CODE = 'UA'
/** Класичний селект рендерить усі опції в DOM — показуємо лише перші збіги. */
const CITY_RENDER_LIMIT = 200

const { citiesLoading, loadCities, citiesOf } = useLocations()

const wantsLan = computed(() => filters.value.formats.includes('LAN'))

watch(wantsLan, (on) => {
  if (on) loadCities(LAN_COUNTRY_CODE).catch(() => { /* тост уже показав locationsService */ })
})

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
  const matched = q ? all.filter((name) => name.toLowerCase().includes(q)) : all
  const head = matched.slice(0, CITY_RENDER_LIMIT)
  if (!q) {
    // Обрані міста (у т.ч. з query) завжди в списку, інакше теги не матимуть підписів.
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

const activeCount = computed(() => countActivePlayersFilters(filters.value))

/** Live-лічильник: скільки гравців пройде поточний стан форми. */
const matchCount = computed(() =>
  (playersStore.players ?? []).filter(p => playerMatchesFilters(p, filters.value, playersStore.userRolesCatalog)).length
)

async function onOpen () {
  filters.value = parsePlayersFilters(route.query)
  rolesLoading.value = true
  try {
    await playersStore.fetchUserRoles({ force: true })
  } catch {
    /* помилка вже в playersService */
  } finally {
    rolesLoading.value = false
  }
}

function clearRating () {
  filters.value.ratingFrom = null
  filters.value.ratingTo = null
}

function onReset () {
  filters.value = createEmptyPlayersFilters()
}

function onApply () {
  router.push({
    name: routeNames.players,
    query: replaceQueryKeys(route.query, PLAYERS_FILTER_QUERY_KEYS, buildPlayersFilterQuery(filters.value))
  })
  modelValue.value = false
}
</script>
