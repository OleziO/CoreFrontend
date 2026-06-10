<template>
  <button
    type="button"
    class="relative size-30 flex flex-col justify-center gap-6 z-[100] cursor-pointer
           bg-transparent border-0 outline-none rounded-md
           focus-visible:ring-2 focus-visible:ring-primary/40"
    :class="{'hidden': window.width.value > 1024}"
    :aria-label="togglerStore.showMobileMenu ? 'Закрити меню' : 'Відкрити меню'"
    :aria-expanded="togglerStore.showMobileMenu"
    aria-haspopup="dialog"
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
  </button>
</template>

<script setup lang="ts">
const window = useWindowSize()
const togglerStore = useTogglerStore()
</script>
