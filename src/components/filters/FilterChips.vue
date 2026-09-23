<template>
  <div class="filter-chips" role="group">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="filter-chip"
      :class="{ 'is-on': isOn(opt.value) }"
      :aria-pressed="isOn(opt.value)"
      @click="toggle(opt.value)"
    >
      <img
        v-if="opt.image"
        :src="opt.image"
        alt=""
        class="filter-chip__img"
        width="22"
        height="22"
        loading="lazy"
        draggable="false"
      >
      <component
        :is="opt.icon"
        v-else-if="opt.icon"
        :size="14"
        weight="bold"
        class="filter-chip__icon"
        aria-hidden="true"
      />
      <span class="filter-chip__label">{{ opt.label }}</span>
      <span v-if="opt.hint" class="filter-chip__hint">{{ opt.hint }}</span>
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number | boolean">
import type { IFilterChipOption } from '@/components/filters/filters.d'

interface IProps {
  options: readonly IFilterChipOption<T>[]
  /** Кілька значень одночасно (типово) чи лише одне. */
  multiple?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  multiple: true
})

const model = defineModel<T[]>({ default: () => [] })

function isOn (value: T) {
  return model.value.includes(value)
}

function toggle (value: T) {
  if (isOn(value)) {
    model.value = model.value.filter(v => v !== value)
    return
  }
  model.value = props.multiple ? [...model.value, value] : [value]
}
</script>

<style scoped lang="scss">
// Toggle chips: dark wells at rest, lit cyan when selected. Each one is a
// real <button> with aria-pressed, so the group is keyboard and screen-reader
// friendly without any extra wiring.
.filter-chips {
  @apply flex flex-wrap gap-6;
}

.filter-chip {
  @apply inline-flex h-34 items-center gap-6 rounded-lg border px-10;
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.7);
  border-color: rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.08);
  transition: color var(--ds-duration-fast) ease, border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease, box-shadow var(--ds-duration-base) ease;

  &.is-on {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    background: rgba(var(--ds-primary-rgb), 0.12);
    box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.35), inset 0 0 8px rgba(var(--ds-primary-rgb), 0.12);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

.filter-chip__icon {
  color: rgba(255, 255, 255, 0.5);
  transition: color var(--ds-duration-fast) ease;

  .is-on & {
    color: var(--ds-primary);
  }
}

.filter-chip__img {
  @apply size-22 shrink-0 select-none object-contain;
  filter: saturate(0.4) brightness(0.85);
  transition: filter var(--ds-duration-base) ease;

  .is-on & {
    filter: none;
  }
}

// Secondary number in a tiny keycap: the box, not the glyph, is what gets
// centred against the label, so the digit never looks like it sank to the
// baseline.
.filter-chip__hint {
  @apply inline-flex h-16 min-w-16 items-center justify-center rounded px-4;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  color: var(--ds-text-faint);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  transition: color var(--ds-duration-fast) ease, border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease;

  .is-on & {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.4);
    background: rgba(var(--ds-primary-rgb), 0.12);
  }
}

@media (hover: hover) and (pointer: fine) {
  .filter-chip:hover {
    color: #fff;
    border-color: rgba(var(--ds-primary-rgb), 0.4);

    .filter-chip__icon {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .filter-chip.is-on:hover {
    color: var(--ds-primary);
  }
}
</style>
