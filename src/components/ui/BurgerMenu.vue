<template>
  <button
    class="burger"
    :class="{ open: togglerStore.showMobileMenu }"
    aria-label="Toggle menu"
    @click="toggle"
  >
    <span />
    <span />
    <span />
  </button>
</template>

<script setup lang="ts">
const togglerStore = useTogglerStore()

function toggle () {
  togglerStore.showMobileMenu = !togglerStore.showMobileMenu
}
</script>

<style scoped>
.burger {
  @apply
    relative
    flex flex-col justify-center gap-[6px]
    w-[44px] h-[44px]
    rounded-xl
    transition-all duration-200 ease-out
    cursor-pointer
    select-none;
}

.burger:hover {
  @apply bg-white/10 border-white/25;
}

.burger:active {
  transform: scale(0.96);
}

.burger span {
  @apply
    block
    h-[2px]
    w-[20px]
    mx-auto
    z-50
    bg-white
    rounded-full
    transition-all duration-300 ease-in-out;
}

/* OPEN STATE */
.burger.open span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.burger.open span:nth-child(2) {
  opacity: 0;
}

.burger.open span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* DESKTOP */
@media (min-width: 1024px) {
  .burger {
    display: none;
  }
}
</style>
