<template>
  <el-dialog
    v-model="modelValue"
    class="filter-dialog"
    :width="dialogWidth"
    destroy-on-close
    align-center
    :show-close="false"
    @open="emit('open')"
    @close="emit('close')"
  >
    <template #header="{ close }">
      <div class="filter-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Фільтри</span>
          <h2 class="filter-dialog__title">{{ title }}</h2>
        </div>

        <div class="flex shrink-0 items-center gap-10">
          <span
            class="filter-dialog__counter"
            :class="{ 'is-on': activeCount > 0 }"
            :aria-label="`Активних фільтрів: ${activeCount}`"
          >
            {{ counterLabel }}
          </span>
          <button
            type="button"
            class="filter-dialog__close"
            aria-label="Закрити"
            @click="close"
          >
            <PhX :size="16" weight="bold" />
          </button>
        </div>
      </div>
    </template>

    <div class="filter-dialog__sections">
      <slot />
    </div>

    <template #footer>
      <div class="filter-dialog__foot">
        <p v-if="matchCount != null" class="filter-dialog__matches">
          <span class="sys-label sys-label--muted !text-[9px]">Збігів</span>
          <span class="filter-dialog__matches-value">{{ matchCount }}</span>
        </p>

        <div class="ml-auto flex items-center gap-8">
          <el-button :disabled="!activeCount" @click="emit('reset')">
            <PhArrowCounterClockwise :size="14" weight="bold" />
            <span>Очистити</span>
          </el-button>
          <el-button type="primary" class="filter-dialog__apply" @click="emit('apply')">
            <PhMagnifyingGlass :size="14" weight="bold" />
            <span>Застосувати</span>
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhArrowCounterClockwise, PhMagnifyingGlass, PhX } from '@phosphor-icons/vue'

interface IProps {
  /** Що фільтруємо — «Гравці», «Команди», «Турніри». */
  title: string
  /** Кількість заповнених секцій у поточному стані форми. */
  activeCount?: number
  /** Live-лічильник збігів; `null` — не показувати. */
  matchCount?: number | null
}

const props = withDefaults(defineProps<IProps>(), {
  activeCount: 0,
  matchCount: null
})

const emit = defineEmits<{
  open: []
  close: []
  apply: []
  reset: []
}>()

const modelValue = defineModel<boolean>({ default: false })

/**
 * el-dialog емітить `open` лише з watcher-а на modelValue. Async-модалка з реєстру
 * монтується вже відкритою (перше відкриття після перезавантаження) — watcher не
 * спрацьовує, і форма не підхоплює фільтри з query. Дублюємо подію на mount.
 */
onMounted(() => {
  if (modelValue.value) emit('open')
})

const { width } = useWindowSize()

// One column on phones, a fixed console width elsewhere.
const dialogWidth = computed(() => (width.value < 640 ? 'calc(100vw - 24px)' : 620))

const counterLabel = computed(() => String(props.activeCount).padStart(2, '0'))
</script>

<style lang="scss">
// Filter console. The dialog chrome comes from element-reset/_dialog.scss;
// this block only shapes the header / footer rails and the section stack.
// Not scoped: `.el-dialog` renders outside this component's root.
.el-dialog.filter-dialog {
  // Same frosted glass as every modal (blur comes from `glass-panel`), but the
  // tint is dark instead of white so the chip wells and lit cyan states have
  // contrast to work against. Alpha stays low enough for the page to bleed
  // through the blur.
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  // The dialog reset kills every focus ring inside modals; pressable filter
  // controls get theirs back so keyboard users can see where they are.
  .filter-chip:focus-visible,
  .filter-dialog__close:focus-visible,
  .filter-section__clear:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.filter-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.filter-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

// Two-digit readout of how many sections are set.
.filter-dialog__counter {
  @apply inline-flex h-28 min-w-40 items-center justify-center rounded-md border px-8;
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.4);
  border-color: rgba(var(--ds-primary-rgb), 0.14);
  background: rgba(0, 0, 0, 0.3);
  transition: color var(--ds-duration-base) ease, border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease;

  &.is-on {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    box-shadow: var(--ds-glow-primary-soft);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

.filter-dialog__close {
  @apply inline-flex size-28 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.filter-dialog__sections {
  @apply flex flex-col;
}

.filter-dialog__foot {
  @apply flex flex-wrap items-center gap-12;

  // EP wraps button children in one inner <span>; give it the icon/text gap.
  .el-button > span {
    @apply inline-flex items-center gap-8;
  }
}

.filter-dialog__matches {
  @apply m-0 flex items-baseline gap-8;
}

.filter-dialog__matches-value {
  font-family: var(--ds-font-mono);
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

@media (hover: hover) and (pointer: fine) {
  .filter-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
