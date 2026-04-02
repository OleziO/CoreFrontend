<template>
  <el-tag
    v-if="divisionName"
    class="px-10 py-8 w-full h-auto flex items-center justify-center flex-1 rounded-lg
     md:text-[12px] text-xs font-medium"
    :class="divisionClass"
    disable-transitions
  >
    {{ divisionLabels[divisionName] }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { divisionClassMap, divisionLabels } from './team.constants' // Verify path

const props = defineProps<{
  divisionName?: string
}>()

const divisionClass = computed(() => {
  if (!props.divisionName) return ''

  // Debugging: Check if the name exists in the map
  const style = divisionClassMap[props.divisionName]

  // Return the style, or a 'default' style if the key is missing (helps identify typos)
  return style || '!border !border-red-500 !text-red-500' // Temporary debug style
})
</script>
