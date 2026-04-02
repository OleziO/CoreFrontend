<template>
  <div
    class="relative size-30 flex flex-col justify-center gap-6 z-[100] cursor-pointer"
    :class="{'hidden': window.width.value > 1024}"
    @click="togglerStore.showMobileMenu = !togglerStore.showMobileMenu"
  >
    <span
      class="block w-30 h-1 bg-white rounded-full
           transition-all duration-300 ease-in-out
           origin-center"
      :class="togglerStore.showMobileMenu
        ? 'translate-y-7 rotate-45'
        : ''"
    />

    <span
      class="block w-30 h-1 bg-white rounded-full
           transition-all duration-200 ease-in-out"
      :class="togglerStore.showMobileMenu
        ? 'opacity-0 scale-x-0'
        : 'opacity-100 scale-x-100'"
    />

    <span
      class="block w-30 h-1 bg-white rounded-full
           transition-all duration-300 ease-in-out
           origin-center"
      :class="togglerStore.showMobileMenu
        ? '-translate-y-7 -rotate-45'
        : ''"
    />
  </div>
</template>

<script setup lang="ts">
const window = useWindowSize()
const togglerStore = useTogglerStore()
</script>
