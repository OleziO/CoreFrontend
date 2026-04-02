<template>
  <el-dialog
    :model-value="modelValue"

    destroy-on-close
    width="600"
    title="Фільтри мікс турнірів"
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
import { routeNames } from '@/router/route-names'
import { tournamentStatuses } from '@/utils/formatters'
import { PhMagnifyingGlass } from '@phosphor-icons/vue'

const modelValue = defineModel<boolean>({ default: false })

interface IMixTournamentFilters {
  status: string | null
  division: string | null
}

const DEFAULT_MIX_TOURNAMENT_FILTERS: IMixTournamentFilters = {
  status: null,
  division: null
}

const router = useRouter()
const route = useRoute()

const filters = ref<IMixTournamentFilters>({ ...DEFAULT_MIX_TOURNAMENT_FILTERS })

function onReset (withClose = true) {
  filters.value = { ...DEFAULT_MIX_TOURNAMENT_FILTERS }

  if (withClose) {
    modelValue.value = false
  } else {
    // Очищаем query параметры
    router.push({ name: routeNames.mixTournaments, query: {} })
  }
}

function onApply () {
  const { status, division } = filters.value

  const query = Object.fromEntries(
    Object.entries({
      status: status || undefined,
      division: division || undefined
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }).filter(([_, value]) => value != null && value !== '')
  )

  router.push({ name: routeNames.mixTournaments, query })

  modelValue.value = false
}

function getFiltersFromQuery () {
  const query = route.query

  filters.value = {
    status: query.status ? String(query.status) : null,
    division: query.division ? String(query.division) : null
  }
}

onMounted(() => {
  getFiltersFromQuery()
})
</script>
