<template>
  <div v-if="tags.length" class="flex flex-wrap items-center gap-6">
    <span
      v-for="tag in tags"
      :key="tag.id"
      class="inline-flex items-center whitespace-nowrap rounded-lg border
        border-amber-400/20 bg-amber-400/[0.07] px-8 py-3
        text-xs font-medium text-amber-200/80"
    >
      {{ tag.title }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { TTag } from '@/services/tags.types'

defineProps<{ tags: TTag[] }>()
</script>
