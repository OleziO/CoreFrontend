<template>
  <el-tag
    v-if="isValidType"
    class="w-full text-xs relative flex flex-1 justify-center !h-auto"
    :class="typeClass"
    disable-transitions
  >
    <!-- ПОКРАЩЕНЕ ЗАТЕМНЕННЯ -->
    <div
      class="absolute inset-0
             bg-gradient-to-b from-black/15 to-black/35
             backdrop-blur-sm
             pointer-events-none rounded-lg transition-all duration-300"
    />

    <span class="relative z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-xs font-medium">
      {{ typeLabel }}
    </span>
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
