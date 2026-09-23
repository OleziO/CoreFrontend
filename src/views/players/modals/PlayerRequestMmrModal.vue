<template>
  <el-dialog
    align-center
    class="mmr-dialog"
    :model-value="modelValue"
    destroy-on-close
    width="520"
    :show-close="false"
    @close="onClose"
  >
    <!-- Header: register label, title, close -->
    <template #header>
      <div class="mmr-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Рейтинг</span>
          <h2 class="mmr-dialog__title">Змінити MMR</h2>
        </div>
        <button type="button" class="mmr-dialog__close" aria-label="Закрити" @click="onClose">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <el-form
      :model="form"
      label-position="top"
      class="mmr-form"
      @submit.prevent="onSubmit"
    >
      <!-- Readout: current → new → delta -->
      <div
        class="mmr-readout"
        :class="{ 'is-up': delta !== null && delta > 0, 'is-down': delta !== null && delta < 0 }"
        aria-live="polite"
      >
        <div class="mmr-readout__cell">
          <span class="mmr-readout__label">Поточний</span>
          <span class="mmr-readout__value">{{ formatMmr(currentMmr) }}</span>
        </div>

        <PhArrowRight :size="14" weight="bold" class="mmr-readout__arrow" />

        <div class="mmr-readout__cell mmr-readout__cell--new">
          <span class="mmr-readout__label">Новий</span>
          <span class="mmr-readout__value">{{ formatMmr(newMmr) }}</span>
        </div>

        <div class="mmr-readout__cell mmr-readout__cell--delta">
          <span class="mmr-readout__label">Зміна</span>
          <span class="mmr-readout__value">{{ deltaLabel }}</span>
        </div>
      </div>

      <!-- MMR input -->
      <el-form-item label="Новий MMR" :error="mmrError">
        <el-input
          v-model="form.mmr"
          type="text"
          inputmode="numeric"
          maxlength="5"
          placeholder="0 – 22000"
          autofocus
          @input="onMmrInput"
        >
          <template #suffix>
            <span class="mmr-form__unit">MMR</span>
          </template>
        </el-input>
        <p class="mmr-form__hint">
          Значення від 0 до 22 000 — як у профілі клієнта Dota 2.
        </p>
      </el-form-item>

      <!-- Proof upload -->
      <div class="mmr-form__group">
        <div class="mmr-form__group-head">
          <span class="mmr-form__label">Підтвердження</span>
          <span class="mmr-form__counter" :class="{ 'is-done': proofFiles.length > 0 }">
            {{ proofFiles.length }}/{{ MAX_PROOFS }}
          </span>
        </div>
        <p class="mmr-form__hint">
          Скріншот рейтингу з клієнта Dota 2. До {{ MAX_PROOFS }} зображень, кадр 16:9.
        </p>

        <div class="proof-grid">
          <!-- Thumbnails -->
          <div
            v-for="(thumb, idx) in thumbnails"
            :key="thumb"
            class="proof-tile proof-tile--filled"
          >
            <img
              :src="thumb"
              alt=""
              class="proof-tile__img"
            >
            <span class="proof-tile__index">{{ String(idx + 1).padStart(2, '0') }}</span>
            <button
              type="button"
              class="proof-tile__remove"
              :aria-label="`Видалити скріншот ${idx + 1}`"
              @click="removeImage(idx)"
            >
              <PhX :size="12" weight="bold" />
            </button>
          </div>

          <!-- Add tile (while slots remain) -->
          <button
            v-if="proofFiles.length < MAX_PROOFS"
            type="button"
            class="proof-tile proof-tile--add"
            @click="triggerFileInput"
          >
            <span class="proof-tile__plus">
              <PhPlus :size="16" weight="bold" />
            </span>
            <span class="proof-tile__add-label">Додати</span>
          </button>

          <!-- Ghost slots — show how many more can be attached -->
          <span
            v-for="n in ghostSlots"
            :key="`ghost-${n}`"
            class="proof-tile proof-tile--ghost"
            aria-hidden="true"
          />
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileSelected"
        >
      </div>
    </el-form>

    <template #footer>
      <div class="mmr-dialog__foot">
        <span class="mmr-dialog__foot-hint" :class="{ 'is-ready': isValid }">
          {{ footHint }}
        </span>
        <div class="flex shrink-0 items-center gap-10">
          <el-button @click="onClose">
            Скасувати
          </el-button>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!isValid"
            @click="onSubmit"
          >
            <PhPaperPlaneTilt v-if="!submitting" :size="16" weight="bold" class="mr-8 shrink-0" />
            Надіслати запит
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>

  <!-- Cropper overlay -->
  <el-dialog
    v-model="cropperVisible"
    align-center
    class="mmr-dialog"
    width="640"
    append-to-body
    destroy-on-close
    :show-close="false"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="mmr-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Кадр 16:9</span>
          <h2 class="mmr-dialog__title">Вибір зображення</h2>
        </div>
        <button type="button" class="mmr-dialog__close" aria-label="Закрити" @click="cancelCrop">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <div class="mmr-cropper">
      <Cropper
        v-if="pendingImageSrc"
        ref="cropperRef"
        class="size-full"
        :src="pendingImageSrc"
        :stencil-props="{ aspectRatio: 16 / 9 }"
      />
    </div>

    <template #footer>
      <div class="mmr-dialog__foot">
        <span class="mmr-dialog__foot-hint">Виділіть область із рейтингом</span>
        <div class="flex shrink-0 items-center gap-10">
          <el-button @click="cancelCrop">
            Скасувати
          </el-button>
          <el-button type="primary" @click="confirmCrop">
            <PhCheck :size="16" weight="bold" class="mr-8 shrink-0" />
            Підтвердити
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { PhX, PhPlus, PhArrowRight, PhPaperPlaneTilt, PhCheck } from '@phosphor-icons/vue'
import { ElMessage } from 'element-plus'
import type { CropperResult } from 'vue-advanced-cropper'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const MAX_PROOFS = 3
const MMR_MAX = 22000

const { close } = useAppModals()
const authStore = useAuthStore()

const form = reactive({ mmr: '' })
const mmrError = ref('')
const submitting = ref(false)

const proofFiles = ref<File[]>([])
const thumbnails = ref<string[]>([])

const fileInputRef = ref<HTMLInputElement | null>(null)
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)
const cropperVisible = ref(false)
const pendingImageSrc = ref<string | null>(null)

// ─── Readout ────────────────────────────────────────────────────────────────
const currentMmr = computed<number | null>(() => authStore.user?.rating ?? null)

const newMmr = computed<number | null>(() => {
  if (form.mmr === '') return null
  const n = Number(form.mmr)
  return Number.isFinite(n) && n >= 0 && n <= MMR_MAX ? n : null
})

const delta = computed<number | null>(() => {
  if (newMmr.value === null || currentMmr.value === null) return null
  return newMmr.value - currentMmr.value
})

const mmrNumberFormat = new Intl.NumberFormat('uk-UA')

function formatMmr (value: number | null): string {
  return value === null ? '—' : mmrNumberFormat.format(value)
}

const deltaLabel = computed(() => {
  if (delta.value === null) return '—'
  if (delta.value === 0) return '0'
  const sign = delta.value > 0 ? '+' : '−'
  return `${sign}${mmrNumberFormat.format(Math.abs(delta.value))}`
})

const ghostSlots = computed(() => {
  // one slot is taken by the "add" tile while it is shown
  const used = proofFiles.value.length + (proofFiles.value.length < MAX_PROOFS ? 1 : 0)
  return Math.max(0, MAX_PROOFS - used)
})

const isValid = computed(() => newMmr.value !== null && proofFiles.value.length > 0)

const footHint = computed(() => {
  if (form.mmr === '') return 'Вкажіть новий MMR'
  if (newMmr.value === null) return `MMR має бути від 0 до ${mmrNumberFormat.format(MMR_MAX)}`
  if (proofFiles.value.length === 0) return 'Додайте хоча б один скріншот'
  return 'Запит перевірить адміністрація'
})

// ─── Input ──────────────────────────────────────────────────────────────────
function onMmrInput () {
  const raw = form.mmr.replace(/\D/g, '')
  form.mmr = raw
  const num = Number(raw)
  if (raw === '') {
    mmrError.value = ''
  } else if (num < 0 || num > MMR_MAX) {
    mmrError.value = `MMR має бути від 0 до ${MMR_MAX}`
  } else {
    mmrError.value = ''
  }
}

// ─── Proofs ─────────────────────────────────────────────────────────────────
function triggerFileInput () {
  fileInputRef.value?.click()
}

function onFileSelected (event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!fileInputRef.value) return
  fileInputRef.value.value = ''
  if (!file) return
  pendingImageSrc.value = URL.createObjectURL(file)
  cropperVisible.value = true
}

function cancelCrop () {
  cropperVisible.value = false
  if (pendingImageSrc.value) {
    URL.revokeObjectURL(pendingImageSrc.value)
    pendingImageSrc.value = null
  }
}

async function confirmCrop () {
  if (!cropperRef.value) return
  const result: CropperResult = cropperRef.value.getResult()
  const canvas = result.canvas
  if (!canvas) return

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) return

  const file = new File([blob], `proof-${Date.now()}.jpg`, { type: 'image/jpeg' })
  const thumbUrl = URL.createObjectURL(blob)

  proofFiles.value.push(file)
  thumbnails.value.push(thumbUrl)

  cropperVisible.value = false
  if (pendingImageSrc.value) {
    URL.revokeObjectURL(pendingImageSrc.value)
    pendingImageSrc.value = null
  }
}

function removeImage (idx: number) {
  URL.revokeObjectURL(thumbnails.value[idx])
  thumbnails.value.splice(idx, 1)
  proofFiles.value.splice(idx, 1)
}

// ─── Submit / close ─────────────────────────────────────────────────────────
async function onSubmit () {
  if (!isValid.value || submitting.value || newMmr.value === null) return
  submitting.value = true
  try {
    await mmrRequestsService.createRequest(newMmr.value, proofFiles.value)
    ElMessage.success('Запит надіслано')
    close('PlayerRequestMmrModal')
  } catch (err: unknown) {
    const beMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    ElMessage.error(beMessage || 'Не вдалося надіслати запит')
  } finally {
    submitting.value = false
  }
}

function onClose () {
  thumbnails.value.forEach((url) => URL.revokeObjectURL(url))
  if (pendingImageSrc.value) URL.revokeObjectURL(pendingImageSrc.value)

  form.mmr = ''
  mmrError.value = ''
  submitting.value = false
  proofFiles.value = []
  thumbnails.value = []
  cropperVisible.value = false
  pendingImageSrc.value = null

  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.mmr-form {
  @apply flex flex-col gap-18;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    margin-bottom: 6px;
    line-height: 1.25;
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }

  :deep(.el-form-item__content) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  // Big, tabular digits in the MMR field — it is a number readout, not prose.
  :deep(.el-input__inner) {
    font-family: var(--ds-font-mono);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.06em;
    font-variant-numeric: tabular-nums;
  }
}

.mmr-form__unit {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--ds-text-faint);
  padding-right: 4px;
}

.mmr-form__label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.mmr-form__hint {
  @apply m-0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ds-text-faint);
}

.mmr-form__group {
  @apply flex flex-col gap-6;
}

.mmr-form__group-head {
  @apply flex items-center justify-between gap-10;
  line-height: 1.25;
}

.mmr-form__counter {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;

  &.is-done {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

// ─── Readout strip ──────────────────────────────────────────────────────────
// Three HUD cells on a hatched dark plate: what the admin will see as
// oldMmr → newMmr, plus the signed delta.
.mmr-readout {
  @apply grid items-center gap-12 rounded-xl border px-14 py-10;
  grid-template-columns: 1fr auto 1fr auto;
  border-color: rgba(var(--ds-primary-rgb), 0.18);
  background:
    repeating-linear-gradient(-45deg, rgba(var(--ds-primary-rgb), 0.04) 0 1px, transparent 1px 10px),
    rgba(7, 8, 15, 0.45);
}

.mmr-readout__cell {
  @apply flex min-w-0 flex-col gap-4;
}

.mmr-readout__label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.mmr-readout__value {
  font-family: var(--ds-font-display);
  font-size: 20px;
  line-height: 1;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.72);
  transition: color var(--ds-duration-base) ease, text-shadow var(--ds-duration-base) ease;
}

.mmr-readout__cell--new .mmr-readout__value {
  color: #fff;
}

.mmr-readout__cell--delta {
  @apply items-end text-right;
  min-width: 64px;
}

.mmr-readout__arrow {
  color: rgba(var(--ds-primary-rgb), 0.55);
}

.mmr-readout.is-up .mmr-readout__cell--delta .mmr-readout__value {
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.mmr-readout.is-down .mmr-readout__cell--delta .mmr-readout__value {
  color: var(--ds-pink);
  text-shadow: var(--ds-neon-text-pink);
}

// ─── Proof grid ─────────────────────────────────────────────────────────────
.proof-grid {
  @apply mt-4 grid gap-10;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.proof-tile {
  @apply relative block w-full overflow-hidden rounded-xl border p-0;
  aspect-ratio: 16 / 9;
  border-color: rgba(var(--ds-primary-rgb), 0.22);
  background: rgba(7, 8, 15, 0.45);
}

.proof-tile--filled {
  border-style: solid;
  box-shadow: var(--ds-glow-primary-soft);
}

.proof-tile__img {
  @apply size-full object-cover;
  display: block;
}

.proof-tile__index {
  @apply absolute bottom-6 left-8;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--ds-primary);
  text-shadow: 0 0 6px rgba(7, 8, 15, 0.9), var(--ds-neon-text-subtle);
}

// Always visible (touch has no hover), small dark chip in the corner.
.proof-tile__remove {
  @apply absolute right-6 top-6 inline-flex size-22 items-center justify-center rounded-md border-0 p-0;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(7, 8, 15, 0.7);
  backdrop-filter: blur(6px);
  transition: background-color var(--ds-duration-fast) ease, color var(--ds-duration-fast) ease;
}

.proof-tile--add {
  @apply flex flex-col items-center justify-center gap-6;
  border-style: dashed;
  color: var(--ds-text-faint);
  cursor: pointer;
  background:
    repeating-linear-gradient(-45deg, rgba(var(--ds-primary-rgb), 0.04) 0 1px, transparent 1px 10px),
    rgba(7, 8, 15, 0.45);
  transition:
    border-color var(--ds-duration-base) ease,
    color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.proof-tile__plus {
  @apply inline-flex size-28 items-center justify-center rounded-lg;
  color: var(--ds-primary);
  background: rgba(var(--ds-primary-rgb), 0.08);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.35);
  transition: background-color var(--ds-duration-base) ease, color var(--ds-duration-base) ease;
}

.proof-tile__add-label {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.proof-tile--ghost {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.08);
  background: transparent;
}

// ─── Cropper ────────────────────────────────────────────────────────────────
.mmr-cropper {
  @apply w-full overflow-hidden rounded-xl border;
  height: 360px;
  border-color: rgba(var(--ds-primary-rgb), 0.18);
  background: rgba(7, 8, 15, 0.6);
}

@media (hover: hover) and (pointer: fine) {
  .proof-tile--add:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.55);
    color: rgba(255, 255, 255, 0.85);

    .proof-tile__plus {
      color: var(--ds-background);
      background: var(--ds-primary);
    }
  }

  .proof-tile__remove:hover {
    color: #fff;
    background: rgba(239, 68, 68, 0.85);
  }
}

@media (prefers-reduced-motion: reduce) {
  .proof-tile--add,
  .proof-tile__plus,
  .proof-tile__remove,
  .mmr-readout__value {
    transition: none;
  }
}
</style>

<style lang="scss">
// Not scoped: `.el-dialog` renders outside this component's root. Same dark
// glass as the team dialog.
.el-dialog.mmr-dialog {
  margin: 0 auto;
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__body {
    max-height: none;
    overflow: visible;
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .mmr-dialog__close:focus-visible,
  .proof-tile__remove:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.mmr-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.mmr-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

.mmr-dialog__close {
  @apply inline-flex size-28 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.mmr-dialog__foot {
  @apply flex flex-wrap items-center justify-between gap-10;

  .el-button > span {
    @apply inline-flex items-center;
  }
}

// Tells the user why submit is disabled; turns cyan once the form is ready.
.mmr-dialog__foot-hint {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;

  &.is-ready {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

@media (hover: hover) and (pointer: fine) {
  .mmr-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
