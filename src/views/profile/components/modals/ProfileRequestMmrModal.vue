<template>
  <el-dialog
    :model-value="modelValue"
    width="500"
    class="rounded-[12px]"
    header-class="hidden"
    :close-on-click-modal="true"
    @update:model-value="updateModelValue"
  >
    <div class="flex flex-col gap-20 ">
      <div class="flex flex-col gap-10 border-b border-gray-800 pb-20 ">
        <h1 class="text-2xl font-semibold text-white">
          Запит на оновлення MMP
        </h1>
        <p class="text-gray-500 text-sm">
          Завантажте скріншот вашого MMP та вкажіть новий рейтинг
        </p>
      </div>

      <div class="flex flex-col gap-20">
        <div class="flex flex-col gap-10">
          <label class="text-sm font-medium text-gray-400">
            Зображення
          </label>
          <div class="upload-container">
            <input
              name="img"
              type="file"
              accept="image/*"
              class="file-input"
              @change="handleFileChange"
            >
            <img
              v-if="imagePreview"
              :src="imagePreview"
              alt="Preview"
              class="image-preview"
            >
          </div>
          <p class="text-xs text-gray-600">
            Завантажте скріншот вашого MMP як доказ
          </p>
        </div>

        <div class="flex flex-col gap-10">
          <label class="text-sm font-medium text-gray-400">
            Новий MMP
          </label>
          <div class="mmr-input-container">
            <el-input
              v-model.number="newMmr"
              type="number"
              :min="1"
              placeholder="Введіть новий MMP"
              class="w-full custom-input"
              size="large"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-10 pt-10 border-t border-gray-800">
        <el-button
          class="px-20 cancel-button"
          @click="updateModelValue(false)"
        >
          Скасувати
        </el-button>
        <el-button
          type="primary"
          class="bg-primary hover:bg-primary/90 transition-all duration-300 px-20"
          :disabled="!newMmr || !selectedFile || newMmr <= 0"
          :loading="loading"
          @click="submitRequest"
        >
          Надіслати запит
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from '@/core/utils/api-errors'

const props = defineProps<{
  modelValue?: boolean
  showRequestMmrModal?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const modelValue = computed(() => {
  return props.modelValue ?? props.showRequestMmrModal ?? false
})

const updateModelValue = (value: boolean) => {
  emit('update:modelValue', value)
}

const selectedFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const newMmr = ref<number | null>(null)
const loading = ref(false)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    if (!file.type.startsWith('image/')) {
      ElMessage.error('Будь ласка, виберіть файл зображення')
      target.value = ''
      return
    }

    selectedFile.value = file

    // Создаем preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    selectedFile.value = null
    imagePreview.value = null
  }
}

const submitRequest = async () => {
  if (!newMmr.value || newMmr.value <= 0 || !selectedFile.value) {
    ElMessage.error('Заповніть всі поля')
    return
  }

  loading.value = true

  try {
    // TODO: endpoint not in API yet (createMmrRequest)
    ElMessage.info('Функціонал запиту MMR ще не реалізований в API')
    updateModelValue(false)
    selectedFile.value = null
    imagePreview.value = null
    newMmr.value = null
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, 'Помилка при відправці запиту. Спробуйте ще раз.'))
  } finally {
    loading.value = false
  }
}

watch(modelValue, (newVal) => {
  if (!newVal) {
    // Очищаем форму при закрытии модалки
    selectedFile.value = null
    imagePreview.value = null
    newMmr.value = null
  }
})
</script>

<style scoped lang="scss">
.upload-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.file-input {
  padding: 0;
  font-size: 0.9rem;
  color: rgb(156 163 175);
  background: transparent;
  border: none;
  width: 100%;

  &::file-selector-button {
    margin-right: 15px;
    border: 1px solid rgba(67, 191, 238, 0.3);
    padding: 8px 15px;
    border-radius: 8px;
    background-color: rgb(17 24 39);
    color: rgb(229 231 235);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;

    &:hover {
      background-color: rgb(31 41 55);
      border-color: rgba(67, 191, 238, 0.5);
    }
  }
}

.image-preview {
  max-width: 100%;
  height: 200px;
  margin-top: 15px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(67, 191, 238, 0.3);
}

.mmr-input-container {
  :deep(.custom-input) {
    .el-input__wrapper {
      background: rgb(17 24 39 / 0.8);
      border: 1px solid rgba(67, 191, 238, 0.3);
      border-radius: 8px;
      box-shadow: none;
      padding: 8px 15px;
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(67, 191, 238, 0.5);
        background: rgb(17 24 39);
      }

      &.is-focus {
        border-color: rgba(67, 191, 238, 0.8);
        box-shadow: 0 0 0 2px rgba(67, 191, 238, 0.2);
        background: rgb(17 24 39);
      }
    }

    .el-input__inner {
      color: rgb(229 231 235);
      font-size: 16px;

      &::placeholder {
        color: rgb(107 114 128);
      }
    }
  }
}

.cancel-button {
  :deep(.el-button) {
    background: rgb(17 24 39);
    border-color: rgba(67, 191, 238, 0.3);
    color: rgb(156 163 175);

    &:hover {
      background: rgb(31 41 55);
      border-color: rgba(67, 191, 238, 0.5);
      color: rgb(209 213 219);
    }
  }
}
</style>
