<template>
  <span class="card-marks" role="list" aria-label="Приймаємо картки">
    <svg class="card-marks__mark" viewBox="0 0 64 40" role="listitem" aria-label="Visa">
      <rect width="64" height="40" rx="6" class="fill-white" />
      <text
        x="32"
        y="26.5"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="17"
        font-weight="700"
        font-style="italic"
        letter-spacing="0.5"
        class="fill-blue-900"
      >VISA</text>
    </svg>
    <svg class="card-marks__mark" viewBox="0 0 64 40" role="listitem" aria-label="Mastercard">
      <rect width="64" height="40" rx="6" class="fill-white" />
      <circle cx="26" cy="20" r="11" class="fill-red-600" />
      <circle cx="38" cy="20" r="11" class="fill-yellow-500" />
      <path d="M32 10.78A11 11 0 0 1 32 29.22A11 11 0 0 1 32 10.78Z" class="fill-orange-500" />
    </svg>
  </span>
</template>

<script setup lang="ts">
/**
 * Знаки Visa / Mastercard біля цін і у футері (вимога WayForPay). Спрощені
 * інлайн-марки з кольорами з токенів; ті самі, що на статичних юридичних
 * сторінках (`vite.config.legal.ts`). Офіційні SVG можна підставити тут.
 */
</script>

<style scoped>
.card-marks {
  @apply inline-flex flex-wrap items-center gap-8;
}

.card-marks__mark {
  @apply block h-28 w-[45px] shrink-0;
}
</style>
