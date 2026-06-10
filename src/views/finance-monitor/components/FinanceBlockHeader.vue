<template>
  <div
    class="flex flex-col gap-12 px-20 py-16 border-b border-white/10 shrink-0
           bg-gradient-to-b from-white/[0.04] to-transparent
           lg:flex-row lg:items-center lg:justify-between"
  >
    <div class="flex items-center gap-12 min-w-0">
      <div
        class="shrink-0 w-36 h-36 rounded-xl flex items-center justify-center
               bg-blue-500/15 border border-blue-400/20 text-blue-200"
      >
        <component
          :is="icon"
          size="20"
        />
      </div>

      <div class="min-w-0">
        <h2 class="text-lg font-semibold text-white leading-tight">
          {{ title }}
        </h2>
        <p
          v-if="subtitle"
          class="text-xs text-gray-500 mt-1"
        >
          {{ subtitle }}
        </p>
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
// Shared block header for the Finance Monitor page: a blue icon tile + title and
// optional subtitle, with an optional right-side slot for controls. Keeps every
// card header visually identical.
defineProps<{
  icon: Component
  title: string
  subtitle?: string
}>()
</script>
