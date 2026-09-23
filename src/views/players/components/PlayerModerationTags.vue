<template>
  <div v-if="tags.length" class="flex flex-wrap items-center gap-6">
    <span
      v-for="tag in tags"
      :key="tag.id"
      class="inline-flex h-24 items-center whitespace-nowrap rounded-md border
        border-amber-400/30 bg-amber-400/[0.18] px-10 text-[11px] font-semibold
        uppercase tracking-[0.06em] text-amber-200"
    >
      {{ tag.title }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { TTag } from '@/services/tags.types'

defineProps<{ tags: TTag[] }>()
</script>
