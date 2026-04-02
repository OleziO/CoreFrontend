<template>
  <el-tag
    v-if="statusLabel"
    class="px-10 py-0 h-auto w-full flex items-center justify-center flex-1 rounded-lg
     md:text-[12px] text-xs font-medium"
    :class="statusClass"
    disable-transitions
  >
    {{ statusLabel }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
// Убедитесь, что импортируете именно НОВЫЕ мапы
import { teamStatusClassMap, teamStatusLabelMap } from './team.constants'

const props = defineProps<{
  status?: string | null
}>()

// Получаем текст (Схвалена / Заявлена)
const statusLabel = computed(() => {
  if (!props.status) return ''
  return teamStatusLabelMap[props.status]
})

// Получаем классы цветов
const statusClass = computed(() => {
  if (!props.status) return ''
  return teamStatusClassMap[props.status] || ''
})
</script>
