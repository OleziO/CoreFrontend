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
  </FilterDialog>
</template>

<script setup lang="ts">
import {
  PhChartBar,
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
import { MAX_RATING, positionOptions, teamStatusOptions, verificationOptions } from '@/components/player-tags/player.enums'
import { ERole } from '@/types/general.enums'
import type { IFilterChipOption } from '@/components/filters/filters.d'
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
