<template>
  <div class="filter-range">
    <label class="filter-range__field">
      <span class="filter-range__tag">від</span>
      <input
        class="filter-range__input"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :value="from ?? ''"
        :placeholder="String(min)"
        :aria-label="`${ariaLabel}: від`"
        @input="onInput('from', $event)"
      >
      <span v-if="unit" class="filter-range__unit">{{ unit }}</span>
    </label>

    <span class="filter-range__sep" aria-hidden="true" />

    <label class="filter-range__field">
      <span class="filter-range__tag">до</span>
      <input
        class="filter-range__input"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :value="to ?? ''"
        :placeholder="String(max)"
        :aria-label="`${ariaLabel}: до`"
        @input="onInput('to', $event)"
      >
      <span v-if="unit" class="filter-range__unit">{{ unit }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
interface IProps {
  min?: number
  max?: number
  /** Одиниця праворуч у полі («MMR», «грн»). */
  unit?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<IProps>(), {
  min: 0,
  max: 99999,
  unit: '',
  ariaLabel: 'Діапазон'
})

const from = defineModel<number | null>('from', { default: null })
const to = defineModel<number | null>('to', { default: null })

// Digits only, clamped to `max`; the DOM value is written back so a stray
// letter never lingers in the field.
function onInput (side: 'from' | 'to', event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D+/g, '')
  const next = digits === '' ? null : Math.min(Number(digits), props.max)

  if (side === 'from') from.value = next
  else to.value = next

  input.value = next == null ? '' : String(next)
}
</script>

<style scoped lang="scss">
// Numeric range: two HUD wells joined by a short cyan hairline. Values sit
// in the mono register with tabular digits; the unit stays faint.
.filter-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 14px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.filter-range__field {
  @apply flex h-42 min-w-0 cursor-text items-center gap-8 rounded-[10px] border px-12;
  border-color: rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.1);
  transition: border-color var(--ds-duration-base) ease, box-shadow var(--ds-duration-base) ease;

  &:focus-within {
    border-color: rgba(var(--ds-primary-rgb), 0.7);
    box-shadow: var(--ds-glow-primary-soft), inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.1);
  }
}

.filter-range__tag,
.filter-range__unit {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  flex-shrink: 0;
}

.filter-range__input {
  @apply min-w-0 flex-1 border-0 bg-transparent p-0 text-white outline-none;
  font-family: var(--ds-font-mono);
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;

  &::placeholder {
    color: rgba(255, 255, 255, 0.22);
    font-weight: 500;
  }
}

.filter-range__sep {
  height: 1px;
  background: rgba(var(--ds-primary-rgb), 0.35);
}

@media (hover: hover) and (pointer: fine) {
  .filter-range__field:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.35);
  }
}
</style>
