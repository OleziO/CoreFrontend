<template>
  <el-tag
    v-if="statusLabel"
    :class="statusClass"
    disable-transitions
  >
    {{ statusLabel }}
  </el-tag>
</template>

<script setup lang="ts">
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
