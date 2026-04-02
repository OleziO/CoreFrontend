<template>
  <el-tag
    v-if="isValidType"
    class="w-full flex justify-center !h-auto border-0"
    :class="typeClass"
    disable-transitions
  >
    {{ typeLabel }}
  </el-tag>

  <el-tag
    v-else
    class="px-8 py-4 w-full rounded-lg text-[11px] font-medium tracking-wide !border
      !border-white/5 !bg-white/5 !text-gray-500 !h-auto flex justify-center"
    disable-transitions
  >
    Тип невідомий
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ERequestType,
  requestTypeClassMap,
  requestTypeLabelMap
} from './mail.constants' // <-- Вкажіть правильний шлях до файлу з константами

const props = defineProps<{
  type?: string | null // string, бо з беку enum часто приходить як рядок
}>()

// Перевіряємо, чи є такий тип у нашому мапінгу класів
const isValidType = computed(() => {
  return props.type && requestTypeClassMap[props.type as ERequestType]
})

// Обчислюємо класи (кольори, бордери, тіні)
const typeClass = computed(() => {
  if (!props.type) return ''
  return requestTypeClassMap[props.type as ERequestType] || ''
})

// Обчислюємо текст (назва типу українською)
const typeLabel = computed(() => {
  if (!props.type) return ''
  return requestTypeLabelMap[props.type as ERequestType] || props.type
})
</script>
