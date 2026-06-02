<template>
  <el-tag
    v-if="isValidStatus"
    class="w-full flex justify-center !h-auto border-0"
    :class="statusClass"
    disable-transitions
  >
    {{ statusLabel }}
  </el-tag>

  <el-tag
    v-else
    class="px-8 py-4 w-full rounded-lg text-[11px] font-medium tracking-wide !border
      !border-white/5 !bg-white/5 !text-gray-500 !h-auto flex justify-center"
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
