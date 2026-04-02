<template>
  <el-tag
    v-if="isValidType"
    class="w-full flex justify-center !h-auto"
    :class="typeClass"
    disable-transitions
  >
    {{ typeLabel }}
  </el-tag>

  <el-tag
    v-else
    class="px-10 py-4 w-full max-w-40 rounded-lg text-[12px] font-medium tracking-wide !border
      !border-white/5 !bg-white/5 !text-gray-500 !h-auto flex justify-center"
    disable-transitions
  >
    {{ type || 'Тип невідомий' }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
