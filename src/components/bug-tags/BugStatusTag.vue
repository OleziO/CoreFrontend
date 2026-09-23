<template>
  <el-tag
    v-if="isValidStatus"
    :class="statusClass"
    disable-transitions
  >
    {{ statusLabel }}
  </el-tag>

  <el-tag
    v-else
    class="tag-tone-neutral"
    disable-transitions
  >
    Невідомий статус
  </el-tag>
</template>

<script setup lang="ts">
import {
  ERequestStatus,
  requestStatusClassMap,
  requestStatusLabelMap
} from './status.enums'

const props = defineProps<{
  status?: string | null
}>()

// Проверяем валидность статуса
const isValidStatus = computed(() => {
  return props.status && requestStatusClassMap[props.status as ERequestStatus]
})

// Вычисляем CSS классы
const statusClass = computed(() => {
  if (!props.status) return ''
  return requestStatusClassMap[props.status as ERequestStatus] || ''
})

// Вычисляем текст
const statusLabel = computed(() => {
  if (!props.status) return ''
  return requestStatusLabelMap[props.status as ERequestStatus] || props.status
})
</script>
