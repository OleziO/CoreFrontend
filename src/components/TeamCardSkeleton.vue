<template>
  <!--
    Скелет TeamCard: логотип 8/7 у рамці з HUD-кутниками, назва, панель даних на
    два рядки (мітка · значення · чіп), волосяна лінія і суцільна кнопка «Учасники».
  -->
  <div
    class="team-card-skeleton neon-card pointer-events-none flex w-full flex-col overflow-hidden rounded-2xl"
    :style="{ maxWidth: `${width}px` }"
    aria-hidden="true"
  >
    <!-- Логотип -->
    <div class="shrink-0 px-12 pt-12">
      <div class="team-card-skeleton__logo-wrap hud-corners hud-corners--fade relative">
        <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0 z-[2]" aria-hidden="true" />
        <span class="skeleton-bone block aspect-[8/7] w-full !rounded-xl" />
      </div>
    </div>

    <!-- Назва -->
    <div class="flex shrink-0 justify-center px-12 pt-10">
      <span class="skeleton-bone h-14 w-[64%]" />
    </div>

    <!-- Панель даних -->
    <div class="mt-10 shrink-0 px-12">
      <div class="skeleton-bone skeleton-bone--well flex w-full flex-col overflow-hidden">
        <div
          v-for="row in 2"
          :key="row"
          class="team-card-skeleton__row grid min-h-[38px] items-center gap-8 px-10"
        >
          <span class="skeleton-bone h-8 w-[56px]" />
          <span class="skeleton-bone h-12 w-[44px] justify-self-end" />
          <span class="skeleton-bone size-28" />
        </div>
      </div>
    </div>

    <span class="hud-line mx-12 mt-10 shrink-0 opacity-50" aria-hidden="true" />

    <!-- Кнопка «Учасники» -->
    <div class="shrink-0 px-12 pb-12 pt-10">
      <span class="skeleton-bone skeleton-bone--primary block h-32 w-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: number
}>(), {
  width: 300
})
</script>

<style scoped lang="scss">
// Same shell as the loaded card but dimmed: no halo, neutral (not yet
// verified/unverified) corner brackets at a lower alpha.
.team-card-skeleton {
  box-shadow: var(--ds-elevation-3);
}

.team-card-skeleton__logo-wrap {
  --hud-corner-inset: 0px;
  --hud-corner-size: 34px;
  --hud-corner-radius: 10px;
  --hud-corner-weight: 3px;
  --hud-corner-color: rgba(var(--ds-primary-rgb), 0.35);
}

.team-card-skeleton__row {
  grid-template-columns: auto minmax(0, 1fr) 28px;

  & + & {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.1);
  }
}
</style>
