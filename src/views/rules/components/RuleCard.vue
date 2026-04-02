<template>
  <div
    class="bg-slate-800/50 border border-slate-700 rounded-xl p-24 hover:border-blue-500
     hover:bg-slate-800/70 transition-all duration-300 cursor-pointer group"
    @click="emit('click')"
  >
    <div class="flex items-start gap-20">
      <div class="w-56 h-56 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-400">
        <slot name="icon">
          <component :is="icon" v-if="icon" class="w-28 h-28" />
        </slot>
      </div>

      <div class="flex-1">
        <h3 class="text-2xl font-bold text-white mb-12 group-hover:text-blue-400 transition-colors">
          <slot name="title">
            {{ title }}
          </slot>
        </h3>
        <p class="text-gray-400 leading-relaxed mb-16">
          <slot name="description">
            {{ description }}
          </slot>
        </p>

        <div class="flex items-center gap-8 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="text-sm font-medium">Детальніше</span>
          <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

const emit = defineEmits<{
  (event: 'click'): void
}>()

defineProps<{
  title?: string
  description?: string
  icon?: Component | null
}>()
</script>
