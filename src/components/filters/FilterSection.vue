<template>
  <section
    class="filter-section"
    :class="{ 'is-active': active }"
    role="group"
    :aria-labelledby="labelId"
  >
    <header class="filter-section__head">
      <component
        :is="icon"
        v-if="icon"
        :size="13"
        weight="bold"
        class="filter-section__icon"
        aria-hidden="true"
      />
      <span :id="labelId" class="filter-section__label">{{ label }}</span>
      <span v-if="hint" class="filter-section__hint">{{ hint }}</span>

      <button
        type="button"
        class="filter-section__clear"
        :class="{ 'is-shown': active }"
        :aria-label="`Скинути фільтр «${label}»`"
        :aria-hidden="!active"
        :tabindex="active ? 0 : -1"
        @click="emit('clear')"
      >
        <PhX :size="10" weight="bold" />
        <span>Скинути</span>
      </button>
    </header>

    <div class="filter-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { PhX } from '@phosphor-icons/vue'

interface IProps {
  label: string
  icon?: Component
  /** Одиниця виміру чи коротка підказка після назви. */
  hint?: string
  /** Секція має значення — підсвічуємо назву і показуємо «Скинути». */
  active?: boolean
}

defineProps<IProps>()

const emit = defineEmits<{ clear: [] }>()

const labelId = `filter-section-${Math.random().toString(36).slice(2, 8)}`
</script>

<style scoped lang="scss">
// One filter group: mono system label on the left, an inline "reset" on the
// right once the group holds a value, and a hairline between neighbours.
.filter-section {
  @apply flex flex-col gap-10 py-14;

  & + & {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.08);
  }
}

// Fixed height: the reset button lives here permanently (faded out when idle),
// so toggling a value never reflows the section.
.filter-section__head {
  @apply flex h-20 items-center gap-8;
}

.filter-section__icon {
  color: rgba(var(--ds-primary-rgb), 0.55);
  transition: color var(--ds-duration-base) ease, filter var(--ds-duration-base) ease;

  .is-active & {
    color: var(--ds-primary);
    filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.6));
  }
}

.filter-section__label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  transition: color var(--ds-duration-base) ease;

  .is-active & {
    color: #fff;
  }
}

.filter-section__hint {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ds-text-faint);
}

.filter-section__clear {
  @apply ml-auto inline-flex h-20 items-center gap-4 rounded border-0 bg-transparent px-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  opacity: 0;
  pointer-events: none;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease,
    opacity var(--ds-duration-base) ease;

  &.is-shown {
    opacity: 1;
    pointer-events: auto;
  }
}

@media (hover: hover) and (pointer: fine) {
  .filter-section__clear:hover {
    color: var(--ds-primary);
    background: rgba(var(--ds-primary-rgb), 0.08);
  }
}
</style>
