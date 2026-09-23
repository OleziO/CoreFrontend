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
    Статус невідомий
  </el-tag>
</template>

<script setup lang="ts">
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
