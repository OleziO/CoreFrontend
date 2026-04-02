<template>
  <el-dialog
    :model-value="modelValue"
    title="Створити команду"
    width="500px"
    class="custom-dialog"
    destroy-on-close
    @update:model-value="closeModal"
    @open="initForm"
  >
    <el-form :model="form" label-position="top" @submit.prevent="submit">
      <el-form-item label="Назва команди" required>
        <el-input
          v-model="form.name"
          placeholder="Введіть назву команди"
          size="large"
        />
      </el-form-item>

      <el-form-item label="Dota 2 Team ID" required>
        <el-input
          v-model.number="form.dotaId"
          placeholder="ID команди в Dota 2"
          type="number"
          size="large"
        />
      </el-form-item>

      <el-form-item label="Аватар команди" required>
        <div class="flex items-center gap-4 w-full">
          <el-upload
            class="avatar-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleAvatarChange"
            accept="image/*"
          >
            <div
              v-if="avatarPreview"
              class="w-24 h-24 rounded-lg border border-white/10 overflow-hidden relative group"
            >
              <img :src="avatarPreview" class="w-full h-full object-cover">
              <div
                class="absolute inset-0 bg-black/50 flex items-center
              justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <el-icon class="text-white text-xl"><Edit /></el-icon>
              </div>
            </div>
            <div
              v-else
              class="w-24 h-24 rounded-lg border border-dashed border-white/20
              flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500
              hover:text-cyan-500 transition-colors bg-white/5"
            >
              <el-icon class="text-2xl mb-1"><Plus /></el-icon>
              <span class="text-xs">Upload</span>
            </div>
          </el-upload>
          <div class="text-xs text-gray-500 flex-1 leading-relaxed">
            Рекомендується зображення 500x500px.<br>
            Максимальний розмір: 2MB.
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button
          class="!bg-transparent !border-white/10 !text-gray-300 hover:!text-white"
          @click="closeModal"
        >
          Скасувати
        </el-button>
        <el-button
          type="primary"
          :loading="isLoading"
          class="!bg-cyan-600 !border-cyan-600 hover:!bg-cyan-500"
          @click="submit"
        >
          Створити
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Plus, Edit } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'

const modelValue = defineModel<boolean>({ default: false })

const route = useRoute()
const authStore = useAuthStore()
const mixStore = useMixTournamentStore()

const isLoading = ref(false)
const avatarPreview = ref<string | null>(null)

const form = reactive({
  name: '',
  dotaId: null as number | null,
  avatar: null as File | null
})

function initForm () {
  const steamName = authStore.user?.steam_name || ''
  form.name = `Team ${steamName}`
  form.dotaId = null
  form.avatar = null
  avatarPreview.value = null
}

function handleAvatarChange (uploadFile: UploadFile) {
  if (uploadFile.raw) {
    form.avatar = uploadFile.raw
    avatarPreview.value = URL.createObjectURL(uploadFile.raw)
  }
}

function closeModal () {
  modelValue.value = false
}

async function submit () {
  // Валидация полей
  if (!form.name.trim()) {
    ElMessage.warning('Введіть назву команди')
    return
  }
  if (!form.dotaId) {
    ElMessage.warning('Введіть Dota 2 Team ID')
    return
  }
  if (!form.avatar) {
    ElMessage.warning('Завантажте аватар команди')
    return
  }

  const tournamentId = Number(route.params.id)
  const userId = authStore.user?.id

  if (!tournamentId || !userId) return

  isLoading.value = true
  try {
    // Передаем данные без undefined, так как проверки пройдены
    await mixTournamentsService.createMixTeam(tournamentId, userId, {
      name: form.name,
      dotaId: form.dotaId,
      avatar: form.avatar
    })

    closeModal()
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
:deep(.custom-dialog) {
  background-color: #111827;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
:deep(.custom-dialog .el-dialog__title) {
  color: #fff;
}
:deep(.el-form-item__label) {
  color: #9ca3af;
}
:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}
:deep(.el-input__inner) {
  color: #fff;
}
</style>
