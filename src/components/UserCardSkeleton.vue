<template>
  <!--
    Скелет UserCard: аватар + два рядки імені, HUD-смуга з рангом/MMR і пʼятьма
    піпами позицій, два теги внизу. Ті ж відступи і структура, що в UserCard,
    тому картка після завантаження стає точно на місце.
  -->
  <div
    class="user-card-skeleton neon-card hud-corners pointer-events-none relative flex w-full flex-col gap-16
           overflow-hidden rounded-2xl px-18 py-20"
    :style="{ maxWidth: `${width}px` }"
    aria-hidden="true"
  >
    <!-- Ідентичність -->
    <div class="flex items-center gap-12">
      <span class="skeleton-bone skeleton-bone--round size-60 shrink-0" />
      <div class="flex min-w-0 flex-1 flex-col gap-6 pr-20">
        <span class="skeleton-bone h-8 w-[44px]" />
        <span class="skeleton-bone h-16 w-[72%]" />
        <span class="skeleton-bone h-12 w-[48%]" />
      </div>
    </div>

    <!-- HUD-смуга: ранг + MMR | позиції -->
    <div class="user-card-skeleton__stats skeleton-bone skeleton-bone--well grid overflow-hidden">
      <div class="flex min-h-[76px] items-center gap-8 px-10 py-10">
        <span class="skeleton-bone h-36 w-[48px] shrink-0" />
        <div class="flex flex-col gap-6">
          <span class="skeleton-bone h-20 w-[56px]" />
          <span class="skeleton-bone h-8 w-[28px]" />
        </div>
      </div>
      <div class="user-card-skeleton__positions flex flex-col items-center justify-center gap-8 px-12 py-10">
        <div class="flex items-center gap-5">
          <span v-for="n in 5" :key="n" class="skeleton-bone size-20 !rounded-sm" />
        </div>
        <span class="skeleton-bone h-8 w-[44px]" />
      </div>
    </div>

    <!-- Теги: команда | роль -->
    <div class="grid grid-cols-2 gap-8">
      <span class="skeleton-bone skeleton-bone--round h-28 w-full" />
      <span class="skeleton-bone skeleton-bone--round h-28 w-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: number
}>(), {
  width: 210
})
</script>

<style scoped lang="scss">
// Skeletons rest at the card's dim state: the neon shell without the halo,
// so the loaded cards feel like they "switch on".
.user-card-skeleton {
  box-shadow: var(--ds-elevation-3);
}

.user-card-skeleton__stats {
  grid-template-columns: minmax(0, 1fr) auto;
}

.user-card-skeleton__positions {
  border-left: 1px solid rgba(var(--ds-primary-rgb), 0.1);
}
</style>
