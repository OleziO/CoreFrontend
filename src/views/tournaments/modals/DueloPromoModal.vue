<template>
  <el-dialog
    :model-value="modelValue"
    :show-close="false"
    :close-on-click-modal="!locked"
    :close-on-press-escape="!locked"
    :width="1200"
    align-center
    class="duelo-promo-dialog"
    @update:model-value="onDialogUpdate"
  >
    <a
      href="https://duelo.gg/uk/join/oreleague?t=duelo-king-1-mox5htyp"
      target="_blank"
      rel="noopener noreferrer"
      class="block w-full"
    >
      <img
        :src="dueloBanner"
        alt="Duelo — приєднуйся до OreLeague"
        class="block w-full h-auto object-contain select-none"
      >
    </a>

    <template #footer>
      <div class="flex justify-end items-center gap-12 px-16 pb-16 pt-12">
        <el-button
          size="large"
          :disabled="locked"
          @click.stop="closeModal"
        >
          <span class="text-base font-medium">
            <template v-if="locked">Закрити ({{ secondsLeft }})</template>
            <template v-else>Закрити</template>
          </span>
        </el-button>

        <el-button
          type="primary"
          size="large"
          tag="a"
          href="https://duelo.gg/uk/join/oreleague?t=duelo-king-1-mox5htyp"
          target="_blank"
          rel="noopener noreferrer"
          class="!px-32"
          @click.stop="closeModal"
        >
          <span class="text-base font-semibold">Грати на Duelo</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import dueloBanner from '@/assets/images/core-duelo-ad.webp'

const LOCK_SECONDS = 5

const modelValue = defineModel<boolean>({ default: false })

const locked = ref(true)
const secondsLeft = ref(LOCK_SECONDS)
let timer: ReturnType<typeof setInterval> | null = null

function clearLock () {
  if (timer != null) {
    clearInterval(timer)
    timer = null
  }
}

function startLock () {
  clearLock()
  locked.value = true
  secondsLeft.value = LOCK_SECONDS
  timer = setInterval(() => {
    secondsLeft.value -= 1
    if (secondsLeft.value <= 0) {
      locked.value = false
      clearLock()
    }
  }, 1000)
}

function closeModal () {
  if (locked.value) return
  modelValue.value = false
}

/** el-dialog can request close (overlay / ESC) — block it while locked. */
function onDialogUpdate (next: boolean) {
  if (!next && locked.value) return
  modelValue.value = next
}

/**
 * The modal is opened via the registry by flipping model-value to true while the
 * component is already mounted, so el-dialog's `@open` may never fire. Drive the
 * lock timer off the model value instead — start it whenever the modal opens.
 */
watch(modelValue, (open) => {
  if (open) startLock()
  else clearLock()
}, { immediate: true })

onBeforeUnmount(clearLock)
</script>

<!-- Not scoped: el-dialog is teleported to <body>, so :deep() from a scoped block
     would not reach it. The unique `.duelo-promo-dialog` class keeps these rules
     confined to this modal only. -->
<style>
.duelo-promo-dialog.el-dialog {
  max-width: 94vw;
  padding: 0;
  overflow: hidden;
}

.duelo-promo-dialog .el-dialog__header {
  display: none;
}

.duelo-promo-dialog .el-dialog__body {
  padding: 0;
}

.duelo-promo-dialog .el-dialog__footer {
  padding: 0;
}
</style>
