<template>
  <el-tag
    v-if="isValidType"
    :class="typeClass"
    disable-transitions
  >
    {{ typeLabel }}
  </el-tag>

  <el-tag
    v-else
    class="tag-tone-neutral"
    disable-transitions
  >
    {{ type || 'Тип невідомий' }}
  </el-tag>
</template>

<script setup lang="ts">
import {
  requestTypeClassMap,
  requestTypeLabelMap
} from './requests.constants' // вкажіть правильний шлях

const props = defineProps<{
  type?: string | null
}>()

const isValidType = computed(() => {
  // Перевіряємо, чи є стиль для цього типу
  return props.type && requestTypeClassMap[props.type]
})

const typeClass = computed(() => {
  if (!props.type) return ''
  return requestTypeClassMap[props.type] || ''
})

const typeLabel = computed(() => {
  if (!props.type) return ''
  return requestTypeLabelMap[props.type] || props.type
})
</script>
