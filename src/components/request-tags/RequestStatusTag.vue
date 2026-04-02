<template>
  <el-tag
    v-if="isValidStatus"
    class="w-full flex justify-center !h-auto"
    :class="statusClass"
    disable-transitions
  >
    {{ statusLabel }}
  </el-tag>

  <el-tag
    v-else
    class="px-10 py-4 w-full rounded-lg text-[12px] font-medium tracking-wide !border
      !border-white/5 !bg-white/5 !text-gray-500 !h-auto flex justify-center"
    disable-transitions
  >
    Статус невідомий
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ERequestStatus,
  requestStatusClassMap,
  requestStatusLabelMap
} from './requests.constants' // вкажіть правильний шлях

const props = defineProps<{
  status?: string | null // string, бо з беку може прийти просто рядок
}>()

const isValidStatus = computed(() => {
  return props.status && requestStatusClassMap[props.status as ERequestStatus]
})

const statusClass = computed(() => {
  if (!props.status) return ''
  return requestStatusClassMap[props.status as ERequestStatus] || ''
})

const statusLabel = computed(() => {
  if (!props.status) return ''
  return requestStatusLabelMap[props.status as ERequestStatus] || props.status
})
</script>
