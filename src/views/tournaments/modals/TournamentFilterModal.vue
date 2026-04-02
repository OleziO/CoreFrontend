<template>
  <el-dialog
    :model-value="modelValue"

    destroy-on-close
    width="600"
    title="Фільтри турнірів"
    @open="getFiltersFromQuery"
    @close="onReset"
  >
    <el-form
      :model="filters"
      label-position="top"
      class="flex flex-col"
    >
      <!-- Status -->
      <el-form-item label="Статус турніру">
        <el-select
          v-model="filters.status"
          placeholder="Оберіть статус турніру"
          clearable
          multiple
          class="w-full"
        >
          <el-option
            v-for="statusOption in tournamentStatuses"
            :key="statusOption.key"
            :label="statusOption.label"
            :value="statusOption.key"
          />
        </el-select>
      </el-form-item>

      <!-- Division -->
      <el-form-item label="Дивізіон">
        <el-select
          v-model="filters.division"
          placeholder="Оберіть дивізіон турніру"
          clearable
          multiple
          class="w-full"
        >
          <el-option
            v-for="divisionOption in divisionArr"
            :key="divisionOption.key"
            :value="divisionOption.key"
            :label="divisionOption.label"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-12 pt-12">
        <el-button @click.stop="() => onReset(false)">
          <span class="text-sm font-medium">Очистити</span>
        </el-button>

        <el-button
          type="primary"
          @click.stop="onApply"
        >
          <PhMagnifyingGlass size="14" weight="bold" />
          <span class="ml-5 text-sm font-medium">Застосувати</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { parseQueryArray } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { tournamentStatuses } from '@/utils/formatters'
import { PhMagnifyingGlass } from '@phosphor-icons/vue'

const DEFAULT_TOURNAMENT_FILTERS: ITournamentFilters = {
  status: [],
  division: []
}
const modelValue = defineModel<boolean>({ default: false })
const router = useRouter()
const route = useRoute()
const tournamentStore = useTournamentStore()
const filters = ref<ITournamentFilters>({ ...DEFAULT_TOURNAMENT_FILTERS })

const divisionArr = computed(() => {
  if (!tournamentStore.divisionsData?.length) return []
  return tournamentStore.divisionsData.map((item) => ({
    key: item.name,
    label: item.name
  }))
})

function onReset (withClose = true) {
  filters.value = { ...DEFAULT_TOURNAMENT_FILTERS }

  if (withClose) {
    modelValue.value = false
  } else {
    // Очищаем query параметры
    router.push({ name: routeNames.tournaments, query: {} })
  }
}

function onApply () {
  const { status, division } = filters.value

  const query = Object.fromEntries(
    Object.entries({
      status: status?.length ? status.join(',') : undefined,
      division: division?.length ? division.join(',') : undefined
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }).filter(([_, value]) => value != null && value !== '')
  )

  router.push({ name: routeNames.tournaments, query })
  modelValue.value = false
}

function getFiltersFromQuery () {
  const query = route.query

  filters.value = {
    status: parseQueryArray(query.status),
    division: parseQueryArray(query.division)
  }
}

onMounted(() => {
  getFiltersFromQuery()
})
</script>
