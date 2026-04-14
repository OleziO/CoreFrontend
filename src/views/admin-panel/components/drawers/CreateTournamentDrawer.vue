<template>
  <el-drawer
    v-model="showCreateTournamentDrawer"
    title="Додати турнір"
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
            type="datetime"
            size="large"
            class="w-full"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
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

        <el-form-item
          label="Дивізіон (опціонально)"
        >
          <el-select
            v-model="tournamentData.division_id"
            placeholder="Оберіть дивізіон"
            size="large"
            class="w-full"
            clearable
          >
            <el-option
              v-for="division in divisions"
              :key="division.id"
              :value="String(division.id)"
              :label="division.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Ліміт учасників (опціонально)">
          <el-input
            v-model="tournamentData.limit"
            type="text"
            inputmode="numeric"
            placeholder="Ліміт учасників"
            size="large"
            @input="onNumericInput($event)"
          />
        </el-form-item>

        <el-form-item label="Зображення турніру" required>
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
                  class="w-full !h-30 !bg-cyan-600 !border-cyan-600 hover:!bg-cyan-500
           text-white font-medium !rounded-lg mt-2 shadow-lg shadow-cyan-900/20"
                  type="primary"
                >
                  Upload
                </el-button>
              </div>
            </el-upload>
          </div>
        </el-form-item>

        <el-button
          :disabled="!isFormValid"
          :loading="loading"
          native-type="submit"
          class="w-full !h-30 !bg-cyan-600 !border-cyan-600 hover:!bg-cyan-500
           text-white font-medium !rounded-lg mt-2 shadow-lg shadow-cyan-900/20"
          type="primary"
          @click="handleSubmit"
        >
          Створити турнір
        </el-button>
      </el-form>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { tournamentFields } from '@/constants/tournaments'
import { queryCache } from '@/core/query-cache-client'
import { tournamentStatuses } from '@/utils/formatters'
import { Plus, Edit } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { TCreateTournamentDto as CreateTournamentDto } from '@/api/types/api.types'

interface ITournamentFormData extends Partial<CreateTournamentDto> {
  status?: string
  division_id?: string | null
  limit?: number | null
}

const showCreateTournamentDrawer = defineModel<boolean>()
const loading = ref<boolean>(false)

// TODO: endpoint not in API yet (divisions)
const divisions = ref<any[]>([])

const isFormValid = computed(() =>
  tournamentData.value.name !== '' &&
    tournamentData.value.tournamentStartsAt !== '' &&
    file.value !== null
)

const { file, preview, reset } = useGetFile()

const defaultTournamentData = (): ITournamentFormData => ({
  name: '',
  tournamentStartsAt: '',
  tournamentEndsAt: '',
  registrationStartsAt: '',
  registrationEndsAt: '',
  status: '',
  division_id: null,
  limit: null
})

const tournamentData = ref<ITournamentFormData>(defaultTournamentData())

function clearData () {
  reset()
  tournamentData.value = defaultTournamentData()
}

watch(() => showCreateTournamentDrawer.value, (isOpen) => {
  if (!isOpen) clearData()
})

function handleImageChange (uploadFile: UploadFile) {
  if (uploadFile.raw) {
    file.value = uploadFile.raw
    if (preview.value) URL.revokeObjectURL(preview.value)
    preview.value = URL.createObjectURL(uploadFile.raw)
  }
}

const handleSubmit = async () => {
  if (!file.value) {
    ElMessage({ message: 'Будь ласка, оберіть зображення турніру', type: 'error' })
    return
  }

  loading.value = true
  try {
    await tournamentsService.createTournament(tournamentData.value as unknown as CreateTournamentDto)
    ElMessage({ message: 'Турнір успішно створено', type: 'success' })
    showCreateTournamentDrawer.value = false
    queryCache.invalidateQueries({ key: ['tournaments'] })
  } catch (e: any) {
    console.log(e)
    const errorMessage = e?.response?.data?.detail || e?.response?.data?.message || 'Помилка при створенні турніру'
    ElMessage({ message: errorMessage, type: 'error' })
  } finally {
    loading.value = false
  }
}

const fields = tournamentFields.filter(field => field.model !== 'division_id')

const dateFields = ['start_time', 'end_time', 'start_registration', 'end_registration']

function isDateField (model: string): boolean {
  return dateFields.includes(model)
}

function onNumericInput (newValue: number | string) {
  const value = String(newValue ?? '')

  const numeric = value.replace(/\D+/g, '')

  tournamentData.value.limit = numeric === '' ? null : Number(numeric)
}

</script>

<style scoped>
/* Стилізація Drawer */
:deep(.custom-drawer) {
  background-color: #111827 !important; /* Темний фон */
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-drawer__header) {
  margin-bottom: 20px;
  padding: 20px 24px 0;
  color: #fff;
}

:deep(.el-drawer__title) {
  color: #fff;
  font-weight: 600;
  font-size: 1.25rem;
}

:deep(.el-drawer__body) {
  padding: 0 24px 20px;
  overflow: hidden; /* Важливо для внутрішнього скролу */
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

:deep(.el-select__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

:deep(.el-select__placeholder) {
  color: #6b7280;
}

:deep(.el-select__selected-item) {
  color: #fff;
}
</style>
