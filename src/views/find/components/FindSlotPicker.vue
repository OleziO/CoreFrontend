<template>
  <div role="radiogroup" aria-label="Роль у команді" class="slot-grid">
    <button
      v-for="option in FIND_SLOT_OPTIONS"
      :key="option.value"
      type="button"
      role="radio"
      class="slot-pick"
      :class="{ 'is-selected': modelValue === option.value }"
      :aria-checked="modelValue === option.value"
      :disabled="!!disabledReasons[option.value]"
      :title="disabledReasons[option.value] || undefined"
      @click="modelValue = option.value"
    >
      <span class="slot-pick__well">
        <component :is="option.icon" :size="18" weight="fill" />
      </span>
      <span class="slot-pick__label">{{ option.label }}</span>
      <span class="slot-pick__hint">{{ disabledReasons[option.value] || option.hint }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { FIND_SLOT_OPTIONS } from '@/views/find/find.utils'
import type { TTeamMemberSlot } from '@/api/types/api.types'

withDefaults(defineProps<{
  /** Слот → чому недоступний (заповнений, турнір…); відсутній ключ = доступний. */
  disabledReasons?: Partial<Record<TTeamMemberSlot, string>>
}>(), {
  disabledReasons: () => ({})
})

const modelValue = defineModel<TTeamMemberSlot>({ required: true })
</script>

<style scoped lang="scss">
.slot-grid {
  @apply grid gap-8;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
}

.slot-pick {
  @apply relative flex flex-col items-center gap-6 overflow-hidden rounded-xl border px-8 py-12 text-center;
  color: inherit;
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.45);
  cursor: pointer;
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    opacity var(--ds-duration-base) ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 2px;
    background: var(--ds-primary);
    box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);
    opacity: 0;
    transition: opacity var(--ds-duration-base) ease;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7) !important;
    outline-offset: 2px;
  }

  &.is-selected {
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    background: rgba(var(--ds-primary-rgb), 0.07);
    box-shadow: 0 0 18px rgba(var(--ds-primary-rgb), 0.14);

    &::before {
      opacity: 1;
    }

    .slot-pick__well {
      color: var(--ds-primary);
      border-color: rgba(var(--ds-primary-rgb), 0.5);
      background: rgba(var(--ds-primary-rgb), 0.12);
    }

    .slot-pick__label {
      color: #fff;
    }
  }
}

.slot-pick__well {
  @apply inline-flex size-36 items-center justify-center rounded-lg border;
  color: var(--ds-text-muted);
  border-color: var(--ds-border-neutral);
  background: rgba(255, 255, 255, 0.04);
}

.slot-pick__label {
  @apply font-display text-[12px] uppercase leading-tight tracking-wide;
  color: var(--ds-text-muted);
}

.slot-pick__hint {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--ds-text-faint);
}

@media (hover: hover) and (pointer: fine) {
  .slot-pick:not(:disabled):not(.is-selected):hover {
    border-color: rgba(var(--ds-primary-rgb), 0.4);
    background: rgba(255, 255, 255, 0.03);
  }
}
</style>
