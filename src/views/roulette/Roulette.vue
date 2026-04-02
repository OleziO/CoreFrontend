<template>
  <div class="roulette-page flex flex-col items-center justify-center w-full min-h-full py-20">
    <RouletteComponent />
  </div>
</template>

<script setup lang="ts">
import RouletteComponent from '@/components/roulette/roulette.vue'
</script>

<style scoped>
.roulette-page {
  background: transparent;
}
</style>
