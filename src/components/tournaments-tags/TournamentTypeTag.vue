<template>
  <el-tag
    v-if="isValidType"
    :class="typeClass"
    disable-transitions
  >
    {{ typeLabel }}
  </el-tag>
</template>

<script setup lang="ts">
import { tournamentTypeClassMap, tournamentTypeLabelMap } from './tournament.constants' // Вкажіть правильний шлях

const props = defineProps<{
  type?: string | null // 'mix' | 'team'
}>()

const isValidType = computed(() => {
  return props.type && tournamentTypeClassMap[props.type]
})

const typeClass = computed(() => {
  if (!props.type) return ''
  return tournamentTypeClassMap[props.type] || ''
})

const typeLabel = computed(() => {
  if (!props.type) return ''
  return tournamentTypeLabelMap[props.type] || props.type
})
</script>
