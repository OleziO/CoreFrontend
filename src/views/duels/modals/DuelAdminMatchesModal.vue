<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="dadmin-dialog"
    width="1040"
    destroy-on-close
  >
    <template #header>
      <div class="flex min-w-0 flex-col gap-4 pr-28">
        <span class="sys-label sys-label--muted">// Адмін</span>
        <h2 class="dadmin-dialog__title">Усі дуелі</h2>
        <p class="dadmin-dialog__subtitle">
          Стан обробки результату, дії адміна та видалення — поштучно або кількох одразу.
        </p>
      </div>
    </template>

    <div class="dadmin-dialog__body">
      <DuelAdminList @deleted="onDeleted" />
    </div>

    <template #footer>
      <div class="flex justify-end">
        <el-button @click="close">Закрити</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import DuelAdminList from '@/views/duels/components/DuelAdminList.vue'

/** Модалка «Усі дуелі» на сторінці дуелей — лише для адміна (ендпоінт закритий AdminGuard). */
const emit = defineEmits<{
  /** Хоча б одну дуель видалено — сторінка перечитує «мої дуелі» та статус. */
  deleted: [ids: string[]]
}>()

const modelValue = defineModel<boolean>({ default: false })

function onDeleted (ids: string[]) {
  emit('deleted', ids)
}

function close () {
  modelValue.value = false
}
</script>

<!-- Not scoped: el-dialog is teleported to <body>. -->
<style lang="scss">
.el-dialog.dadmin-dialog {
  margin: 0 auto;
  max-width: calc(100vw - 32px);
  background: rgba(12, 15, 30, 0.82);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .dadmin-dialog__title {
    margin: 0;
    font-family: var(--ds-font-display);
    font-size: 22px;
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #fff;
    text-shadow: var(--ds-neon-text-subtle);
  }

  .dadmin-dialog__subtitle {
    margin: 0;
    font-size: 12px;
    color: var(--ds-text-muted);
  }

  /* Список прокручується всередині; діалог не виростає вище екрана */
  .dadmin-dialog__body {
    display: flex;
    flex-direction: column;
    height: min(70vh, 720px);
    min-height: 320px;
  }
}
</style>
