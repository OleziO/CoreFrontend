<template>
  <el-dialog
    v-model="showMmrUnverifiedModal"
    width="500"
    class="update-mmr-unverified-dialog bg-gray-800 rounded-[12px]"
    :close-on-click-modal="false"
  >
    <div class="flex flex-col gap-20">
      <div class="flex flex-col gap-10 border-b border-gray-800 pb-20">
        <h1 class="text-2xl font-semibold text-white">
          Оновлення MMR
        </h1>
        <p class="text-gray-500 text-sm">
          Вкажіть ваш новий MMR
        </p>
      </div>

      <div class="flex flex-col gap-20">
        <div class="flex flex-col gap-10">
          <label class="text-sm font-medium text-gray-400">
            Новий MMR
          </label>
          <div class="mmr-input-container">
            <el-input
              v-model.number="newMmr"
              type="number"
              :min="1"
              placeholder="Введіть новий MMR"
              class="w-full custom-input"
              size="large"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-10 pt-10 border-t border-gray-800">
        <el-button
          class="px-20 cancel-button"
          @click="showMmrUnverifiedModal = false"
        >
          Скасувати
        </el-button>
        <el-button
          type="primary"
          class="bg-primary hover:bg-primary/90 transition-all duration-300 px-20"
          :disabled="!newMmr || newMmr <= 0"
          :loading="loading"
          @click="updateMmr"
        >
          Оновити MMR
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from '@/core/utils/api-errors'

const showMmrUnverifiedModal = defineModel<boolean>('showMmrUnverifiedModal')

const newMmr = ref<number | null>(null)
const loading = ref(false)

const updateMmr = async () => {
  if (!newMmr.value || newMmr.value <= 0) {
    ElMessage.error('Введіть коректний MMR')
    return
  }

  loading.value = true

  try {
    // TODO: endpoint not in API yet (updatePlayerData)
    ElMessage.warning('Функціонал оновлення MMR ще не реалізований в API')
    showMmrUnverifiedModal.value = false
    newMmr.value = null
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, 'Помилка при оновленні MMR. Спробуйте ще раз.'))
  } finally {
    loading.value = false
  }
}

watch(showMmrUnverifiedModal, (newVal) => {
  if (newVal) {
    // Устанавливаем текущий MMR при открытии модалки
    newMmr.value = null
  } else {
    // Очищаем форму при закрытии модалки
    newMmr.value = null
  }
})
</script>

<style scoped lang="scss">
:deep(.el-overlay) {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(12px);
  background-color: rgba(0, 0, 0, 0.5);
}

:deep(.update-mmr-unverified-dialog) {
  .el-dialog {
    background: linear-gradient(135deg, rgb(17 24 39) 0%, rgb(31 41 55) 50%, rgb(17 24 39) 100%);
    border: 1px solid rgb(31 41 55);
    border-radius: 24px;
    box-shadow: 0 0 25px rgba(0, 0, 0, 0.4);
  }

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 30px;
    color: white;
  }

  .el-dialog__headerbtn {
    top: 20px;
    right: 20px;

    .el-dialog__close {
      color: rgb(107 114 128);
      font-size: 20px;

      &:hover {
        color: rgba(67, 191, 238, 1);
      }
    }
  }
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
