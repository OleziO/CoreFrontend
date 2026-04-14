<template>
  <el-dialog
    :model-value="modelValue"
    width="500"
    class="rounded-[12px]"
    :close-on-click-modal="true"
    @update:model-value="updateModelValue"
  >
    <template #header>
      <div class="flex flex-col gap-10">
        <h1 class="text-2xl font-semibold text-white">
          Повідомити про баг
        </h1>

        <p class="text-gray-500 text-sm">
          Завантажте скріншот та опишіть проблему
        </p>
      </div>
    </template>

    <div class="flex flex-col gap-10">
      <label class="text-sm font-medium text-gray-400">
        Зображення
      </label>
      <div class="upload-container">
        <input
          name="image"
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
        Завантажте скріншот багу
      </p>
    </div>

    <div class="flex flex-col gap-10">
      <label class="text-sm font-medium text-gray-400">
        Опис проблеми
      </label>
      <div class="detail-input-container">
        <el-input
          v-model="detail"
          type="textarea"
          :rows="4"
          placeholder="Опишіть проблему детально..."
          class="w-full custom-textarea"
          size="large"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button
          class="px-20 cancel-button"
          @click="updateModelValue(false)"
        >
          Скасувати
        </el-button>
        <el-button
          type="primary"
          class="bg-primary hover:bg-primary/90 transition-all duration-300 px-20"
          :disabled="!selectedFile || !detail || detail.trim() === ''"
          :loading="loading"
          @click="submitBug"
        >
          Надіслати
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// import { bugService } from '@/services/bug.service'

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const modelValue = computed(() => {
  return props.modelValue ?? false
})

const updateModelValue = (value: boolean) => {
  emit('update:modelValue', value)
}

const selectedFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const detail = ref<string>('')
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

const submitBug = async () => {
  if (!selectedFile.value || !detail.value || detail.value.trim() === '') {
    ElMessage.error('Заповніть всі поля')
    return
  }

  loading.value = true

  try {
    const formData = new FormData()
    formData.append('status', 'new')
    formData.append('detail', detail.value.trim())
    formData.append('image', selectedFile.value)

    // TODO: endpoint not in API yet
    // await bugService.createBugRequest(formData)
    // eslint-disable-next-line no-void
    void formData

    ElMessage.success('Баг успішно надіслано')
    updateModelValue(false)

    // Очищаем форму
    selectedFile.value = null
    imagePreview.value = null
    detail.value = ''
  } catch (error: any) {
    console.error('Помилка при відправці багу:', error)

    // Извлекаем текст ошибки из ответа сервера
    const errorMessage = error?.response?.data?.detail ||
                        error?.response?.data?.message ||
                        'Помилка при відправці багу. Спробуйте ще раз.'

    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

watch(modelValue, (newVal) => {
  if (!newVal) {
    // Очищаем форму при закрытии модалки
    selectedFile.value = null
    imagePreview.value = null
    detail.value = ''
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

.detail-input-container {
  :deep(.custom-textarea) {
    .el-textarea__inner {
      background: rgb(17 24 39 / 0.8);
      border: 1px solid rgba(67, 191, 238, 0.3);
      border-radius: 8px;
      box-shadow: none;
      padding: 12px 15px;
      transition: all 0.3s ease;
      color: rgb(229 231 235);
      font-size: 14px;
      resize: vertical;

      &:hover {
        border-color: rgba(67, 191, 238, 0.5);
        background: rgb(17 24 39);
      }

      &:focus {
        border-color: rgba(67, 191, 238, 0.8);
        box-shadow: 0 0 0 2px rgba(67, 191, 238, 0.2);
        background: rgb(17 24 39);
      }

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
