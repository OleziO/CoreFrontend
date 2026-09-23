<template>
  <el-drawer
    v-model="showUpdateTournamentDrawer"
    title="Оновити турнір"
    size="500"
    class="custom-drawer"
    destroy-on-close
  >
    <div class="h-full overflow-y-auto px-1 custom-scroll pb-6">
      <el-form :model="tournamentData" label-position="top" @submit.prevent="handleSubmit">
        <el-form-item
          v-for="field in fields"
          :key="field.model"
          :label="field.label"
        >
          <el-date-picker
            v-if="isDateField(field.model)"
            v-model="(tournamentData[field.model as keyof typeof tournamentData] as string)"
            :placeholder="field.placeholder"
            size="large"
            class="w-full"
            popper-class="core-date-picker-popper"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            type="datetime"
          />
          <el-input
            v-else
            v-model="(tournamentData[field.model as keyof typeof tournamentData] as string)"
            :placeholder="field.placeholder"
            size="large"
          />
        </el-form-item>

        <el-form-item label="Статус">
          <el-select
            v-model="tournamentData.status"
            size="large"
            class="w-full"
          >
            <el-option
              v-for="status in tournamentStatuses"
              :key="status.key"
              :value="status.key"
              :label="status.label"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Ліміт учасників (опціонально)">
          <el-input
            v-model.number="tournamentData.limit"
            type="number"
            placeholder="Ліміт учасників"
            size="large"
          />
        </el-form-item>

        <el-form-item label="Зображення турніру">
          <div class="flex items-center gap-4 w-full">
            <el-upload
              class="avatar-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleImageChange"
              accept="image/*"
            >
              <div
                v-if="preview"
                class="w-96 h-48 rounded-lg border border-white/10 overflow-hidden relative group"
              >
                <img :src="preview" class="w-full h-full object-cover">
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
                <el-button
                  class="w-full mt-2"
                  type="primary"
                >
                  Upload
                </el-button>
              </div>
            </el-upload>
          </div>
        </el-form-item>

        <el-button
          :loading="loading"
          native-type="submit"
          class="w-full mt-2"
          type="primary"
          @click="handleSubmit"
        >
          Оновити турнір
        </el-button>
      </el-form>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { tournamentFields } from '@/views/tournaments/tournaments.enums'
import { tournamentStatuses } from '@/core/utils/formatters'
import { Plus, Edit } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { TUpdateTournamentDto as UpdateTournamentDto } from '@/api/types/api.types'
import { getImageUrl } from '@/core/helpers'
import { getApiErrorMessage } from '@/core/utils/api-errors'

interface ITournamentUpdateFormData extends Partial<UpdateTournamentDto> {
  status?: string
  limit?: number | null
}

const props = defineProps<{newTournamentData: TTournament | undefined | null}>()
const { file, preview, reset } = useGetFile()

const defaultTournamentData = (): ITournamentUpdateFormData => ({
  name: '',
  tournamentStartsAt: '',
  tournamentEndsAt: '',
  registrationStartsAt: '',
  registrationEndsAt: '',
  status: '',
  limit: null
})

const tournamentData = ref<ITournamentUpdateFormData>(defaultTournamentData())

const showUpdateTournamentDrawer = defineModel<boolean>()
const loading = ref<boolean>(false)
const tournamentStore = useTournamentStore()

watch(() => showUpdateTournamentDrawer.value, (isOpen) => {
  if (isOpen && props.newTournamentData) {
    reset()
    tournamentData.value = {
      name: props.newTournamentData.name || '',
      tournamentStartsAt: props.newTournamentData.tournamentStartsAt || '',
      tournamentEndsAt: props.newTournamentData.tournamentEndsAt || '',
      registrationStartsAt: props.newTournamentData.registrationStartsAt || '',
      registrationEndsAt: props.newTournamentData.registrationEndsAt || ''
    }
    if (props.newTournamentData.headerBannerUrl) {
      preview.value = getImageUrl(props.newTournamentData.headerBannerUrl)
    }
  }
})

function handleImageChange (uploadFile: UploadFile) {
  if (uploadFile.raw) {
    file.value = uploadFile.raw
    if (preview.value) URL.revokeObjectURL(preview.value)
    preview.value = URL.createObjectURL(uploadFile.raw)
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    await tournamentStore.updateTournament(
      props.newTournamentData?.id ?? '',
      tournamentData.value as UpdateTournamentDto
    )
    ElMessage({ message: 'Турнір успішно оновлено', type: 'success' })
    showUpdateTournamentDrawer.value = false
  } catch (e: unknown) {
    ElMessage.error(getApiErrorMessage(e, 'Помилка при оновленні турніру'))
  } finally {
    loading.value = false
  }
}

const fields = tournamentFields

const dateFields = ['start_time', 'end_time', 'start_registration', 'end_registration']

function isDateField (model: string): boolean {
  return dateFields.includes(model)
}
</script>

<style scoped>
/* Стилізація Drawer */
:deep(.custom-drawer) {
  background-color: theme('colors.gray.900') !important;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-drawer__header) {
  margin-bottom: 20px;
  padding: 20px 24px 0;
  color: white;
}

:deep(.el-drawer__title) {
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
}

:deep(.el-drawer__body) {
  padding: 0 24px 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Кастомний скролбар */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

:deep(.el-form-item__label) {
  color: theme('colors.gray.400');
}

:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

:deep(.el-input__inner) {
  color: white;
}

:deep(.el-select__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

:deep(.el-select__placeholder) {
  color: theme('colors.gray.500');
}

:deep(.el-select__selected-item) {
  color: white;
}
</style>
