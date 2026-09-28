<template>
  <section
    class="analytics-panel neon-card hud-corners rounded-2xl"
    :style="{ '--panel-delay': `${delay}ms` }"
  >
    <header class="analytics-panel__head">
      <div class="flex min-w-0 flex-col gap-4">
        <span class="sys-label sys-label--muted">{{ code }}</span>
        <h2 class="analytics-panel__title">{{ title }}</h2>
        <p v-if="subtitle" class="analytics-panel__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.aside" class="shrink-0">
        <slot name="aside" />
      </div>
    </header>

    <div class="analytics-panel__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** Моно-індекс секції у стилі HUD, напр. `// 03`. */
  code: string
  title: string
  subtitle?: string
  /** Затримка появи (мс) — секції каскадом виїжджають одна за одною. */
  delay?: number
}>(), {
  subtitle: '',
  delay: 0
})
</script>

<style scoped>
.analytics-panel {
  --hud-corner-inset: 8px;

  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  overflow: hidden;
}

@media (min-width: 768px) {
  .analytics-panel {
    padding: 24px;
  }
}

.analytics-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.analytics-panel__title {
  font-family: var(--ds-font-display);
  font-size: 17px;
  line-height: 1.25;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
}

.analytics-panel__subtitle {
  font-size: 13px;
  line-height: 1.45;
  color: var(--ds-text-muted);
}

.analytics-panel__body {
  min-width: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .analytics-panel {
    animation: analytics-panel-in 640ms var(--ds-ease-out) both;
    animation-delay: var(--panel-delay);
  }

  @keyframes analytics-panel-in {
    from {
      opacity: 0;
      transform: translateY(14px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
