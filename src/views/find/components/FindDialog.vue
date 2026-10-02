<template>
  <el-dialog
    v-model="modelValue"
    class="find-dialog"
    :width="dialogWidth"
    align-center
    destroy-on-close
    append-to-body
    :show-close="false"
    @open="emit('open')"
    @closed="emit('closed')"
  >
    <template #header="{ close }">
      <div class="find-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// {{ label }}</span>
          <h2 class="find-dialog__title">{{ title }}</h2>
        </div>
        <button type="button" class="find-dialog__close" aria-label="Закрити" @click="close">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <slot />

    <template v-if="$slots.footer" #footer>
      <div class="find-dialog__foot">
        <slot name="footer" />
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhX } from '@phosphor-icons/vue'

/** Оболонка модалок сторінки «Пошук команди»: шапка з підписом, тіло, футер з кнопками. */
const props = withDefaults(defineProps<{
  title: string
  /** Системний підпис над заголовком («Команда», «Заявка»…). */
  label: string
  width?: number
}>(), {
  width: 520
})

const emit = defineEmits<{
  open: []
  closed: []
}>()

const modelValue = defineModel<boolean>({ default: false })

/** Async-модалка з реєстру монтується вже відкритою — el-dialog тоді не емітить `open`. */
onMounted(() => {
  if (modelValue.value) emit('open')
})

const { width: windowWidth } = useWindowSize()
const dialogWidth = computed(() => (windowWidth.value < 640 ? 'calc(100vw - 24px)' : props.width))
</script>

<style lang="scss">
// Not scoped: `.el-dialog` renders outside this component's root.
.el-dialog.find-dialog {
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .find-dialog__close:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.find-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.find-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

.find-dialog__close {
  @apply inline-flex size-28 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.find-dialog__foot {
  @apply flex flex-wrap items-center justify-end gap-10;

  .el-button {
    margin-left: 0 !important;
  }

  .el-button > span {
    @apply inline-flex items-center gap-8;
  }
}

// Shared bits of the find modals' bodies.
.find-field {
  @apply flex flex-col gap-8;
}

.find-field__label {
  @apply flex items-center justify-between gap-12 text-xs;
  color: var(--ds-text-muted);
}

.find-field__hint {
  @apply m-0 text-xs leading-relaxed;
  color: var(--ds-text-faint);
}

.find-note {
  @apply m-0 flex items-start gap-10 rounded-xl border p-12 text-sm leading-relaxed;
  color: var(--ds-text-muted);
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.35);

  > svg {
    margin-top: 2px;
    flex-shrink: 0;
    color: var(--ds-primary);
  }

  &.is-warning > svg {
    color: var(--ds-gold);
  }
}

@media (hover: hover) and (pointer: fine) {
  .find-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
