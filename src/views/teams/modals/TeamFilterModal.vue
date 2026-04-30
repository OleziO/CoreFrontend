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
import { teamStatus } from '@/constants/teams'

const modelValue = defineModel<boolean>({ default: false })
const router = useRouter()
const route = useRoute()

const localFilters = ref<{
  status: string[]
}>({
  status: []
})

function onReset (withClose = true) {
  localFilters.value.status = []

  if (withClose) modelValue.value = false
}

function onApply () {
  const { status } = localFilters.value

  const query = { ...(route.query as Record<string, string | string[] | undefined>) }
  delete query.divisions
  query.status = status?.length ? status.join(',') : undefined

  const cleanQuery = Object.fromEntries(
    Object.entries(query).filter(([_, v]) => v != null && v !== '')
  ) as Record<string, string>

  router.push({ name: routeNames.teams, query: cleanQuery })
  modelValue.value = false
}

function initFilters () {
  localFilters.value.status = parseQueryArray(route.query.status)
}

onMounted(initFilters)
</script>
