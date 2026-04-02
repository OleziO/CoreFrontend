<template>
  <el-dialog
    :model-value="modelValue"

    destroy-on-close
    width="600"
    title="Фільтри команд"
    @open="initFilters"
    @close="onReset"
  >
    <el-form label-position="top" class="flex flex-col" @submit.prevent>
      <el-form-item label="Дивізіон">
        <el-select
          v-model="localFilters.divisions"
          multiple
          collapse-tags
          :show-arrow="false"
          collapse-tags-tooltip
          :max-collapse-tags="3"
          placeholder="Оберіть дивізіони"
          class="w-full"
          :loading="isLoading"
        >
          <el-option
            v-for="div in divisionOptions"
            :key="div.key"
            :label="div.label"
            :value="div.key"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Статус команди">
        <el-select
          v-model="localFilters.status"
          placeholder="Всі статуси"
          class="w-full"
          multiple
          clearable
        >
          <el-option
            v-for="item in teamStatus"
            :key="item.key"
            :label="item.label"
            :value="item.key"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-12 pt-12">
        <el-button @click.stop="() => onReset(false)">
          <span class="text-sm font-medium">Очистити</span>
        </el-button>
        <el-button type="primary" @click.stop="onApply">
          <PhMagnifyingGlass size="14" weight="bold" />
          <span class="ml-5 text-sm font-medium">Застосувати</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhMagnifyingGlass } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { parseQueryArray } from '@/core/helpers'
import { useGetDivisions } from '@/composables/query/use-divisions'
import { teamStatus } from '@/constants/teams'

const modelValue = defineModel<boolean>({ default: false })
const router = useRouter()
const route = useRoute()

// Данные для селектов
const { data: divisions, isLoading } = useGetDivisions()
const divisionOptions = computed(() => {
  if (!divisions.value) return []
  return divisions.value.map(item => ({ key: item.name, label: item.name }))
})

const localFilters = ref<{
  divisions: string[]
  status: string[]
}>({
  divisions: [],
  status: []
})

function onReset (withClose = true) {
  localFilters.value.divisions = []
  localFilters.value.status = []

  if (withClose) modelValue.value = false
}

function onApply () {
  const { divisions, status } = localFilters.value

  const query = {
    ...route.query,
    divisions: divisions?.length ? divisions.join(',') : undefined,
    status: status?.length ? status.join(',') : undefined
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleanQuery = Object.fromEntries(Object.entries(query).filter(([_, v]) => v != null))

  router.push({ name: routeNames.teams, query: cleanQuery })
  modelValue.value = false
}

function initFilters () {
  const query = route.query
  localFilters.value.divisions = parseQueryArray(query.divisions)
  localFilters.value.status = parseQueryArray(query.status)
}

onMounted(initFilters)
</script>
