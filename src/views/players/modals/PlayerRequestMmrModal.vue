<template>
  <el-dialog
    :model-value="modelValue"
    destroy-on-close
    width="540"
    title="Змінити MMR"
    @close="onClose"
  >
    <el-form
      :model="form"
      label-position="top"
      class="flex flex-col gap-16"
      @submit.prevent
    >
      <!-- MMR input -->
      <el-form-item label="Новий MMR" :error="mmrError">
        <el-input
          v-model="form.mmr"
          type="text"
          inputmode="numeric"
          placeholder="0 – 22000"
          @input="onMmrInput"
        />
      </el-form-item>

      <!-- Proof upload -->
      <div class="flex flex-col gap-8">
        <span class="text-sm font-medium text-gray-300">
          Завантажте до 3 скріншотів
        </span>
        <span class="text-xs text-gray-500">
          Скріншот рейтингу з Dota 2
        </span>

        <!-- Thumbnails -->
        <div class="flex flex-wrap gap-10">
          <div
            v-for="(thumb, idx) in thumbnails"
            :key="idx"
            class="relative w-[120px] h-[68px] rounded-lg overflow-hidden border border-white/10 group"
          >
            <img
              :src="thumb"
              alt=""
              class="w-full h-full object-cover"
            >
            <button
              type="button"
              class="absolute inset-0 flex items-center justify-center
                     bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              @click="removeImage(idx)"
            >
              <PhX size="20" weight="bold" class="text-white" />
            </button>
          </div>

          <!-- Add button (shown when < 3 images) -->
          <button
            v-if="proofFiles.length < 3"
            type="button"
            class="flex w-[120px] h-[68px] items-center justify-center rounded-lg
                   border border-dashed border-white/20 text-gray-500 transition
                   hover:border-primary/40 hover:text-primary cursor-pointer"
            @click="triggerFileInput"
          >
            <PhPlus size="22" />
          </button>
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
      <div class="flex justify-end gap-10">
        <el-button @click="onClose">
          Скасувати
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!isValid"
          @click="onSubmit"
        >
          Надіслати запит
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- Cropper overlay -->
  <el-dialog
    v-model="cropperVisible"
    width="640"
    title="Вибір зображення"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div class="w-full" style="height: 360px">
      <Cropper
        v-if="pendingImageSrc"
        ref="cropperRef"
        class="w-full h-full"
        :src="pendingImageSrc"
        :stencil-props="{ aspectRatio: 16 / 9 }"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button @click="cancelCrop">
          Скасувати
        </el-button>
        <el-button type="primary" @click="confirmCrop">
          Підтвердити
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { PhX, PhPlus } from '@phosphor-icons/vue'
import { ElMessage } from 'element-plus'
import type { CropperResult } from 'vue-advanced-cropper'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { close } = useAppModals()

const form = reactive({ mmr: '' })
const mmrError = ref('')
const submitting = ref(false)

const proofFiles = ref<File[]>([])
const thumbnails = ref<string[]>([])

const fileInputRef = ref<HTMLInputElement | null>(null)
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)
const cropperVisible = ref(false)
const pendingImageSrc = ref<string | null>(null)

const isValid = computed(() => {
  const mmr = Number(form.mmr)
  return !isNaN(mmr) && mmr >= 0 && mmr <= 22000 && form.mmr !== '' && proofFiles.value.length > 0
})

function onMmrInput () {
  const raw = form.mmr.replace(/\D/g, '')
  form.mmr = raw
  const num = Number(raw)
  if (raw === '') {
    mmrError.value = ''
  } else if (num < 0 || num > 22000) {
    mmrError.value = 'MMR має бути від 0 до 22000'
  } else {
    mmrError.value = ''
  }
}

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

async function onSubmit () {
  if (!isValid.value || submitting.value) return
  submitting.value = true
  try {
    await mmrRequestsService.createRequest(Number(form.mmr), proofFiles.value)
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
