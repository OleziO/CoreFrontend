<template>
  <FilterDialog
    v-model="modelValue"
    title="Команди шукають"
    :active-count="activeCount"
    @open="onOpen"
    @reset="onReset"
    @apply="onApply"
  >
    <FilterSection
      label="Доступні мені"
      :icon="PhUserCheck"
      :active="filters.eligible"
      @clear="filters.eligible = false"
    >
      <FilterChips v-model="eligibleModel" :options="ELIGIBLE_OPTIONS" />
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
      label="MMR"
      hint="входить у діапазон"
      :icon="PhChartBar"
      :active="filters.mmr != null"
      @clear="filters.mmr = null"
    >
      <el-input-number
        v-model="mmrModel"
        :min="0"
        :max="FIND_MMR_MAX"
        :step="100"
        :controls="false"
        placeholder="Напр. 4500"
        class="!w-full"
        aria-label="MMR"
      />
    </FilterSection>

    <FilterSection
      label="Верифікація"
      :icon="PhSealCheck"
      :active="filters.verified"
      @clear="filters.verified = false"
    >
      <FilterChips v-model="verifiedModel" :options="VERIFIED_OPTIONS" />
    </FilterSection>

    <FilterSection
      label="Формат"
      :icon="PhGameController"
      :active="filters.formats.length > 0"
      @clear="filters.formats = []"
    >
      <FilterChips v-model="filters.formats" :options="formatChipOptions" />
    </FilterSection>
  </FilterDialog>
</template>

<script setup lang="ts">
import { PhChartBar, PhGameController, PhSealCheck, PhTarget, PhUserCheck } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { replaceQueryKeys } from '@/core/helpers'
import { positionOptions, wantToPlayOptions } from '@/components/player-tags/player.enums'
import type { IFilterChipOption } from '@/components/filters/filters.d'
import type { TTournamentFormat } from '@/api/types/api.types'
import type { IFindTeamsFilters } from '@/views/find/find.d'
import { FIND_MMR_MAX } from '@/views/find/find.utils'
import {
  FIND_TEAMS_FILTER_QUERY_KEYS,
  buildFindTeamsFilterQuery,
  countActiveFindTeamsFilters,
  createEmptyFindTeamsFilters,
  parseFindTeamsFilters
} from '@/views/find/find-filters.utils'

const ELIGIBLE_OPTIONS: IFilterChipOption<boolean>[] = [{ value: true, label: 'Лише куди можу подати заявку' }]
const VERIFIED_OPTIONS: IFilterChipOption<boolean>[] = [{ value: true, label: 'Лише верифіковані команди' }]

const modelValue = defineModel<boolean>({ default: false })

const router = useRouter()
const route = useRoute()

const filters = ref<IFindTeamsFilters>(createEmptyFindTeamsFilters())

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

/** Перемикачі — одиничний чип: масив `[true]` ↔ `true`. */
const eligibleModel = computed<boolean[]>({
  get: () => (filters.value.eligible ? [true] : []),
  set: (next) => { filters.value.eligible = next.includes(true) }
})
const verifiedModel = computed<boolean[]>({
  get: () => (filters.value.verified ? [true] : []),
  set: (next) => { filters.value.verified = next.includes(true) }
})

/** el-input-number віддає `undefined` для порожнього поля. */
const mmrModel = computed<number | undefined>({
  get: () => filters.value.mmr ?? undefined,
  set: (next) => { filters.value.mmr = next ?? null }
})

const activeCount = computed(() => countActiveFindTeamsFilters(filters.value))

function onOpen () {
  filters.value = parseFindTeamsFilters(route.query)
}

function onReset () {
  filters.value = createEmptyFindTeamsFilters()
}

function onApply () {
  router.push({
    name: routeNames.find,
    query: replaceQueryKeys(route.query, FIND_TEAMS_FILTER_QUERY_KEYS, buildFindTeamsFilterQuery(filters.value))
  })
  modelValue.value = false
}
</script>
