<template>
  <el-drawer
    v-model="showCreateTournamentDrawer"
    title="Додати турнір"
    size="520"
    class="custom-drawer"
    destroy-on-close
  >
    <div class="h-full overflow-y-auto px-1 custom-scroll pb-6">
      <el-form :model="form" label-position="top" @submit.prevent="handleSubmit">
        <el-form-item label="Назва" required>
          <el-input v-model="form.name" placeholder="Назва турніру" size="large" />
        </el-form-item>

        <el-form-item label="Дивізіон" required>
          <el-select v-model="form.division" placeholder="Оберіть дивізіон" size="large" class="w-full">
            <el-option
              v-for="d in TOURNAMENT_DIVISION_VALUES"
              :key="d"
              :value="d"
              :label="tournamentDivisionLabelMap[d]"
            >
              <div class="flex flex-col">
                <span>{{ tournamentDivisionLabelMap[d] }}</span>
                <span class="text-xs text-gray-500">{{ tournamentDivisionMmrHintMap[d] }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Статус турніру" required>
          <el-select v-model="form.tournamentStatus" size="large" class="w-full">
            <el-option
              v-for="s in tournamentAdminStatusOptions"
              :key="s.key"
              :value="s.key"
              :label="tournamentStatusLabelMap[s.key]"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Призовий фонд (опціонально)">
          <el-input
            v-model="prizePoolText"
            inputmode="numeric"
            placeholder="Напр. 5000"
            size="large"
            @input="prizePoolText = String($event).replace(/\D+/g, '')"
          />
        </el-form-item>

        <el-form-item label="Слоти команд (опціонально)">
          <el-input
            v-model="slotsText"
            inputmode="numeric"
            placeholder="Напр. 16"
            size="large"
            @input="slotsText = String($event).replace(/\D+/g, '')"
          />
        </el-form-item>

        <el-form-item label="Початок реєстрації" required>
          <el-date-picker
            v-model="form.registrationStartsAt"
            type="datetime"
            size="large"
            class="w-full"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>

        <el-form-item label="Кінець реєстрації" required>
          <el-date-picker
            v-model="form.registrationEndsAt"
            type="datetime"
            size="large"
            class="w-full"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>

        <el-form-item label="Початок плей-оф" required>
          <el-date-picker
            v-model="form.tournamentStartsAt"
            type="datetime"
            size="large"
            class="w-full"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>

        <el-form-item label="Кінець турніру" required>
          <el-date-picker
            v-model="form.tournamentEndsAt"
            type="datetime"
            size="large"
            class="w-full"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>

        <el-divider content-position="left">
          Зображення (опціонально, окремі запити після створення)
        </el-divider>

        <el-form-item v-for="u in uploads" :key="u.key" :label="u.label">
          <el-upload
            class="avatar-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="(f: UploadFile) => handlePick(u.key, f)"
          >
            <div
              v-if="previews[u.key]"
              class="w-full max-w-[22rem] h-40 rounded-lg border border-white/10 overflow-hidden relative group"
            >
              <img :src="previews[u.key]" class="w-full h-full object-cover" alt="">
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <el-icon class="text-white text-xl"><Edit /></el-icon>
              </div>
            </div>
            <div
              v-else
              class="rounded-lg border border-dashed border-white/20 px-10 py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-cyan-500"
            >
              <el-icon class="text-2xl"><Plus /></el-icon>
              <span class="text-sm text-gray-400">JPEG/PNG тощо, до 10 МБ</span>
            </div>
          </el-upload>
        </el-form-item>

        <el-button
          :disabled="!isFormValid"
          :loading="loading"
          native-type="submit"
          class="w-full !h-30 !bg-cyan-600 !border-cyan-600 hover:!bg-cyan-500 text-white font-medium !rounded-lg mt-6"
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
import { computed, reactive, watch } from 'vue'
import dayjs from 'dayjs'
import type { UploadFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Edit, Plus } from '@element-plus/icons-vue'
import { queryCache } from '@/core/query-cache-client'
import { getApiErrorMessage } from '@/utils/api-errors'
import { UPLOAD_ERROR, validateImageFileForUpload } from '@/services/image-upload.service'
import {
  TOURNAMENT_DIVISION_VALUES,
  tournamentAdminStatusOptions,
  tournamentDivisionLabelMap,
  tournamentDivisionMmrHintMap,
  tournamentStatusLabelMap
} from '@/components/tournaments-tags/tournament.constants'
import type { TCreateTournamentDto as CreateTournamentDto } from '@/api/types/api.types'

const showCreateTournamentDrawer = defineModel<boolean>()
const loading = ref(false)

const prizePoolText = ref('')
const slotsText = ref('')

type UploadKey = 'header' | 'list' | 'grid'

const files = reactive<Record<UploadKey, File | null>>({
  header: null,
  list: null,
  grid: null
})

const previews = reactive<Record<UploadKey, string>>({
  header: '',
  list: '',
  grid: ''
})

const uploads: { key: UploadKey; label: string }[] = [
  { key: 'header', label: 'Банер у шапці' },
  { key: 'list', label: 'Банер у списку' },
  { key: 'grid', label: 'Сітка турніру' }
]

const form = reactive({
  name: '',
  division: '' as CreateTournamentDto['division'] | '',
  tournamentStatus: 'SCHEDULED' as CreateTournamentDto['tournamentStatus'],
  registrationStartsAt: '',
  registrationEndsAt: '',
  tournamentStartsAt: '',
  tournamentEndsAt: ''
})

const isFormValid = computed(() =>
  form.name.trim() !== '' &&
    form.division !== '' &&
    form.registrationStartsAt !== '' &&
    form.registrationEndsAt !== '' &&
    form.tournamentStartsAt !== '' &&
    form.tournamentEndsAt !== ''
)

function clearData () {
  form.name = ''
  form.division = ''
  form.tournamentStatus = 'SCHEDULED'
  form.registrationStartsAt = ''
  form.registrationEndsAt = ''
  form.tournamentStartsAt = ''
  form.tournamentEndsAt = ''
  prizePoolText.value = ''
  slotsText.value = ''
  for (const k of Object.keys(files) as UploadKey[]) {
    if (previews[k]) URL.revokeObjectURL(previews[k])
    files[k] = null
    previews[k] = ''
  }
}

watch(() => showCreateTournamentDrawer.value, (isOpen) => {
  if (!isOpen) clearData()
})

function translateUploadErr (msg: string) {
  if (msg === UPLOAD_ERROR.notImage) return 'Дозволені лише файли зображень'
  if (msg === UPLOAD_ERROR.tooLarge) return 'Файл завеликий (максимум 10 МБ)'
  if (msg === UPLOAD_ERROR.network) return 'Не вдалося завантажити зображення, спробуйте ще раз'
  return msg
}

function handlePick (key: UploadKey, uploadFile: UploadFile) {
  if (!uploadFile.raw) return
  const raw = uploadFile.raw
  const v = validateImageFileForUpload(raw)
  if (v !== null) {
    ElMessage.error(translateUploadErr(v))
    return
  }
  if (previews[key]) URL.revokeObjectURL(previews[key])
  files[key] = raw
  previews[key] = URL.createObjectURL(raw)
}

function toIsoUtc (pickerValue: string): string {
  return dayjs(pickerValue, 'YYYY-MM-DD HH:mm').toISOString()
}

const handleSubmit = async () => {
  if (!isFormValid.value || !form.division) return

  const payload: CreateTournamentDto = {
    name: form.name.trim(),
    division: form.division as CreateTournamentDto['division'],
    tournamentStatus: form.tournamentStatus,
    registrationStartsAt: toIsoUtc(form.registrationStartsAt),
    registrationEndsAt: toIsoUtc(form.registrationEndsAt),
    tournamentStartsAt: toIsoUtc(form.tournamentStartsAt),
    tournamentEndsAt: toIsoUtc(form.tournamentEndsAt)
  }

  if (prizePoolText.value !== '') payload.prizePool = Number(prizePoolText.value)
  if (slotsText.value !== '') payload.tournamentSlots = Number(slotsText.value)

  loading.value = true
  try {
    const created = await tournamentsService.createTournament(payload)
    const id = created.id

    try {
      if (files.header) await tournamentsService.uploadHeaderBanner(id, files.header)
      if (files.list) await tournamentsService.uploadListBanner(id, files.list)
      if (files.grid) await tournamentsService.uploadGrid(id, files.grid)
    } catch (up: unknown) {
      const um = up instanceof Error ? up.message : String(up)
      ElMessage.warning(`Турнір створено, але зображення не завантажились: ${translateUploadErr(um)}`)
      showCreateTournamentDrawer.value = false
      queryCache.invalidateQueries({ key: ['tournaments'] })
      clearData()
      return
    }

    ElMessage.success('Турнір успішно створено')
    showCreateTournamentDrawer.value = false
    queryCache.invalidateQueries({ key: ['tournaments'] })
  } catch (e: unknown) {
    ElMessage.error(getApiErrorMessage(e, 'Помилка при створенні турніру'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Стилізація Drawer */
:deep(.custom-drawer) {
  background-color: #111827 !important;
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

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
