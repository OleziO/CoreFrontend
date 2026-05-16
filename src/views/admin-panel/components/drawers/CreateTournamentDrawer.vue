<template>
  <el-drawer
    v-model="showCreateTournamentDrawer"
    direction="rtl"
    :size="580"
    class="create-tournament-drawer"
    destroy-on-close
    :close-on-click-modal="true"
  >
    <template #header>
      <div class="flex flex-col gap-12 pb-4 pr-8">
        <div
          class="h-[3px] w-48 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500
                 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
        />
        <div>
          <h2 id="drawer-title" class="text-xl font-bold tracking-tight text-white">
            Додати турнір
          </h2>
          <p class="mt-6 max-w-[22rem] text-[13px] leading-snug text-gray-500">
            Обовʼязкові поля маркуються зірочкою. Зображення можна додати зараз або пізніше в картці турніру.
          </p>
        </div>
      </div>
    </template>

    <el-config-provider :locale="elementPlusUk">
      <div class="custom-scroll drawer-body-scroll h-full overflow-y-auto pb-28">
        <el-form :model="form" label-position="top" require-asterisk-position="right" @submit.prevent="handleSubmit">
          <!-- Основне -->
          <section class="drawer-section">
            <div class="drawer-section__head">
              <PhSlidersHorizontal :size="18" weight="duotone" class="text-cyan-400/90" />
              <span class="drawer-section__title">Основне</span>
            </div>
            <div class="drawer-section__body drawer-section__grid">
              <el-form-item label="Назва" required class="drawer-field span-full">
                <el-input
                  v-model="form.name"
                  placeholder="Напр., Core League Cup #12"
                  size="large"
                  clearable
                />
              </el-form-item>

              <el-form-item label="Дивізіон" required class="drawer-field span-full">
                <el-select v-model="form.division" placeholder="Оберіть дивізіон" size="large" class="w-full">
                  <el-option
                    v-for="d in TOURNAMENT_DIVISION_VALUES"
                    :key="d"
                    :value="d"
                    :label="tournamentDivisionLabelMap[d]"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Статус турніру" required class="drawer-field span-full">
                <el-select v-model="form.tournamentStatus" size="large" class="w-full">
                  <el-option
                    v-for="s in tournamentCreateStatusOptions"
                    :key="s.key"
                    :value="s.key"
                    :label="tournamentStatusLabelMap[s.key]"
                  >
                    <div class="flex items-center gap-8 py-1">
                      <span
                        class="inline-flex h-8 min-w-[8px] rounded-full shadow-sm"
                        :class="statusStripeClass[s.key]"
                      />
                      <span>{{ tournamentStatusLabelMap[s.key] }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </div>
          </section>

          <!-- Параметри -->
          <section class="drawer-section">
            <div class="drawer-section__head">
              <PhTrophy :size="18" weight="duotone" class="text-amber-400/90" />
              <span class="drawer-section__title">Параметри</span>
            </div>
            <div class="drawer-section__body drawer-fields-pair">
              <el-form-item label="Призовий фонд" class="drawer-field">
                <template #label>
                  <span>Призовий фонд <span class="label-optional">(опціонально)</span></span>
                </template>
                <el-input
                  v-model="prizePoolText"
                  inputmode="numeric"
                  placeholder="5000"
                  size="large"
                  @input="prizePoolText = String($event).replace(/\D+/g, '')"
                >
                  <template #prefix>
                    <span class="input-prefix-muted">₴</span>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item class="drawer-field">
                <template #label>
                  <span>Слоти команд <span class="label-optional">(опціонально)</span></span>
                </template>
                <el-input
                  v-model="slotsText"
                  inputmode="numeric"
                  placeholder="16"
                  size="large"
                  @input="slotsText = String($event).replace(/\D+/g, '')"
                />
              </el-form-item>
            </div>
          </section>

          <!-- Графік -->
          <section class="drawer-section">
            <div class="drawer-section__head">
              <PhCalendar :size="18" weight="duotone" class="text-sky-400/90" />
              <span class="drawer-section__title">Графік</span>
            </div>
            <div class="drawer-section__body drawer-section__body--stack">
              <p class="drawer-section__hint">
                Від кваліфікації до плей-оф: перевірте дати й послідовність етапів перед публікацією.
              </p>
              <div class="drawer-date-grid">
                <el-form-item label="Початок кваліфікації" required class="drawer-field">
                  <el-date-picker
                    v-model="form.registrationStartsAt"
                    type="datetime"
                    size="large"
                    class="drawer-date-picker w-full"
                    popper-class="core-date-picker-popper"
                    format="DD.MM.YYYY HH:mm"
                    value-format="YYYY-MM-DD HH:mm"
                    placeholder="Оберіть дату й час"
                  />
                </el-form-item>
                <el-form-item label="Кінець кваліфікації" required class="drawer-field">
                  <el-date-picker
                    v-model="form.registrationEndsAt"
                    type="datetime"
                    size="large"
                    class="drawer-date-picker w-full"
                    popper-class="core-date-picker-popper"
                    format="DD.MM.YYYY HH:mm"
                    value-format="YYYY-MM-DD HH:mm"
                    placeholder="Оберіть дату й час"
                  />
                </el-form-item>
                <el-form-item label="Початок плей-оф" required class="drawer-field">
                  <el-date-picker
                    v-model="form.tournamentStartsAt"
                    type="datetime"
                    size="large"
                    class="drawer-date-picker w-full"
                    popper-class="core-date-picker-popper"
                    format="DD.MM.YYYY HH:mm"
                    value-format="YYYY-MM-DD HH:mm"
                    placeholder="Оберіть дату й час"
                  />
                </el-form-item>
                <el-form-item label="Кінець турніру" required class="drawer-field">
                  <el-date-picker
                    v-model="form.tournamentEndsAt"
                    type="datetime"
                    size="large"
                    class="drawer-date-picker w-full"
                    popper-class="core-date-picker-popper"
                    format="DD.MM.YYYY HH:mm"
                    value-format="YYYY-MM-DD HH:mm"
                    placeholder="Оберіть дату й час"
                  />
                </el-form-item>
              </div>
            </div>
          </section>

          <!-- Зображення -->
          <section class="drawer-section drawer-section--media">
            <div class="drawer-section__head">
              <PhImageSquare :size="18" weight="duotone" class="text-violet-400/90" />
              <span class="drawer-section__title">Зображення</span>
            </div>
            <div class="drawer-section__body drawer-section__body--stack">
              <p class="drawer-section__hint">
                Завантажуються окремими запитами одразу після створення. JPEG або PNG, до 10&nbsp;МБ.
              </p>
              <div class="flex flex-col gap-16">
                <el-form-item v-for="u in uploads" :key="u.key" class="upload-form-item drawer-field mb-0">
                  <template #label>
                    <span class="text-[13px] font-medium text-gray-300">{{ u.label }}</span>
                  </template>
                  <div class="flex w-full flex-col gap-6">
                    <!-- Як у TeamCreateModal: el-upload без нативної кнопки; превʼю — прямокутник на всю ширину -->
                    <el-upload
                      class="tournament-banner-upload block w-full"
                      action="#"
                      :auto-upload="false"
                      :show-file-list="false"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      :on-change="(file) => handleBannerPick(u.key, file)"
                    >
                      <div class="w-full">
                        <div
                          v-if="!previews[u.key]"
                          class="relative flex min-h-[88px] w-full cursor-pointer flex-col items-center justify-center
                        gap-10 rounded-xl border border-solid border-white/25 bg-white/[0.04]
                        px-16 py-20 transition hover:border-white/35 hover:bg-white/[0.06]"
                        >
                          <el-icon class="text-2xl text-white/70"><Plus /></el-icon>
                          <span class="text-center text-sm text-white/50">
                            Обрати зображення
                          </span>
                        </div>
                        <div v-else class="w-full cursor-pointer py-14">
                          <div
                            class="relative aspect-video w-full overflow-hidden rounded-xl border border-solid
                          border-white/20 bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                          >
                            <img
                              :src="previews[u.key]"
                              alt=""
                              class="pointer-events-none absolute inset-0 h-full w-full object-cover"
                            >
                            <div
                              class="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0
                            transition-opacity hover:opacity-100"
                            >
                              <el-icon class="text-lg text-white"><Edit /></el-icon>
                            </div>
                          </div>
                        </div>
                      </div>
                    </el-upload>
                  </div>
                </el-form-item>
              </div>
            </div>
          </section>

          <div class="drawer-submit-wrap">
            <el-button
              :disabled="!isFormValid"
              :loading="loading"
              native-type="submit"
              type="primary"
              size="large"
              class="drawer-submit-btn w-full !h-[52px] !rounded-xl !border-0 !text-[15px] !font-semibold"
              @click="handleSubmit"
            >
              Створити турнір
            </el-button>
          </div>
        </el-form>
      </div>
    </el-config-provider>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import uk from 'element-plus/es/locale/lang/uk'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { Edit, Plus } from '@element-plus/icons-vue'
import { PhCalendar, PhImageSquare, PhSlidersHorizontal, PhTrophy } from '@phosphor-icons/vue'
import { queryCache } from '@/core/query-cache-client'
import { getApiErrorMessage } from '@/utils/api-errors'
import { UPLOAD_ERROR, validateImageFileForUpload } from '@/services/image-upload.service'
import {
  TOURNAMENT_DIVISION_VALUES,
  tournamentCreateStatusOptions,
  tournamentDivisionLabelMap,
  tournamentStatusLabelMap,
  type TTournamentStatusValue
} from '@/components/tournaments-tags/tournament.constants'
import type { TCreateTournamentDto as CreateTournamentDto } from '@/api/types/api.types'

type UploadKey = 'header' | 'list'

const showCreateTournamentDrawer = defineModel<boolean>()
const loading = ref(false)
const tournamentStore = useTournamentStore()

const elementPlusUk = uk

const prizePoolText = ref('')
const slotsText = ref('')

const files = reactive<Record<UploadKey, File | null>>({
  header: null,
  list: null
})

const previews = reactive<Record<UploadKey, string>>({
  header: '',
  list: ''
})

const uploads: { key: UploadKey; label: string }[] = [
  { key: 'header', label: 'Банер у шапці' },
  { key: 'list', label: 'Банер у списку' }
]

const statusStripeClass: Record<TTournamentStatusValue, string> = {
  QUALIFICATIONS: 'bg-green-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
  PLAYOFF: 'bg-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.45)]'
}

const form = reactive({
  name: '',
  division: '' as CreateTournamentDto['division'] | '',
  tournamentStatus: 'QUALIFICATIONS' as CreateTournamentDto['tournamentStatus'],
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

function syncDayjsUk () {
  dayjs.locale('uk')
}

function translateUploadErr (msg: string) {
  if (msg === UPLOAD_ERROR.notImage) return 'Дозволені лише файли зображень'
  if (msg === UPLOAD_ERROR.tooLarge) return 'Файл завеликий (максимум 10 МБ)'
  if (msg === UPLOAD_ERROR.network) return 'Не вдалося завантажити зображення, спробуйте ще раз'
  return msg
}

function ingestImageFile (key: UploadKey, raw: File) {
  const v = validateImageFileForUpload(raw)
  if (v !== null) {
    ElMessage.error(translateUploadErr(v))
    return
  }
  if (previews[key]) URL.revokeObjectURL(previews[key])
  files[key] = raw
  previews[key] = URL.createObjectURL(raw)
}

function handleBannerPick (key: UploadKey, uploadFile: UploadFile) {
  const raw = uploadFile.raw
  if (!raw) return
  ingestImageFile(key, raw)
}

function clearData () {
  form.name = ''
  form.division = ''
  form.tournamentStatus = 'QUALIFICATIONS'
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

watch(showCreateTournamentDrawer, (isOpen) => {
  if (isOpen) syncDayjsUk()
  else clearData()
})

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
    } catch (up: unknown) {
      const um = up instanceof Error ? up.message : String(up)
      ElMessage.warning(`Турнір створено, але зображення не завантажились: ${translateUploadErr(um)}`)
      tournamentStore.patchTournamentInList(created)
      showCreateTournamentDrawer.value = false
      queryCache.invalidateQueries({ key: ['tournaments'] })
      clearData()
      return
    }

    tournamentStore.patchTournamentInList(created)
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
.drawer-section {
  margin-bottom: 20px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.045) 0%, rgba(0, 0, 0, 0.22) 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.drawer-section--media {
  background: linear-gradient(
    165deg,
    rgba(139, 92, 246, 0.06) 0%,
    rgba(0, 0, 0, 0.2) 45%,
    rgba(0, 0, 0, 0.28) 100%
  );
}

.drawer-section__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.drawer-section__title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(209 213 219);
}

.drawer-section__body {
  padding: 16px;
}

.drawer-section__body--stack {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.drawer-section__hint {
  margin: 0 0 14px;
  padding: 0;
  max-width: 44rem;
  font-size: 12px;
  line-height: 1.65;
  color: rgb(107 114 128);
}

.drawer-section__grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer-fields-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

@media (max-width: 520px) {
  .drawer-fields-pair {
    grid-template-columns: 1fr;
  }
}

.drawer-date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 14px;
}

@media (max-width: 520px) {
  .drawer-date-grid {
    grid-template-columns: 1fr;
  }
}

.span-full {
  grid-column: 1 / -1;
}

.label-optional {
  font-weight: 400;
  color: rgb(107 114 128);
}

.input-prefix-muted {
  font-size: 13px;
  color: rgb(156 163 175);
}

.drawer-submit-wrap {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.drawer-submit-btn {
  box-shadow:
    0 4px 24px rgba(6, 182, 212, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 55%, #6366f1 100%) !important;
}

.drawer-submit-btn:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow:
    0 6px 28px rgba(6, 182, 212, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.drawer-submit-btn:disabled {
  opacity: 0.45;
  filter: grayscale(0.2);
}

.upload-form-item :deep(.el-form-item__content) {
  line-height: normal;
}

.tournament-banner-upload {
  width: 100%;
}

.tournament-banner-upload :deep(.el-upload) {
  display: block;
  width: 100%;
  border: none;
}

.tournament-banner-upload :deep(.el-upload__input) {
  display: none !important;
}

.drawer-body-scroll::-webkit-scrollbar {
  width: 6px;
}
.drawer-body-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.drawer-body-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}
.drawer-body-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.22);
}

:deep(.create-tournament-drawer.el-drawer) {
  --el-drawer-bg-color: #0c111d;
  background: linear-gradient(180deg, #0f172a 0%, #0b1121 40%, #080c16 100%) !important;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: -16px 0 48px rgba(0, 0, 0, 0.45);
}

:deep(.create-tournament-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 20px 8px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

:deep(.create-tournament-drawer .el-drawer__body) {
  padding: 16px 20px 24px 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

:deep(.create-tournament-drawer .el-drawer__close-btn) {
  color: rgb(156 163 175);
  font-size: 18px;
}

:deep(.create-tournament-drawer .el-drawer__close-btn:hover) {
  color: #fff;
}

:deep(.drawer-field .el-form-item__label) {
  color: rgb(203 213 225);
  font-weight: 500;
  font-size: 13px;
}

:deep(.el-form-item) {
  margin-bottom: 14px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none !important;
  border-radius: 10px;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(34, 211, 238, 0.25);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: rgba(34, 211, 238, 0.55) !important;
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.2) !important;
}

:deep(.el-input__inner) {
  color: #f8fafc;
}

:deep(.el-input__inner::placeholder) {
  color: rgb(100 116 139);
}

:deep(.el-select__wrapper) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none !important;
  border-radius: 10px;
  min-height: 40px;
}

:deep(.el-select__wrapper:hover) {
  border-color: rgba(34, 211, 238, 0.25);
}

:deep(.el-select__wrapper.is-focused) {
  border-color: rgba(34, 211, 238, 0.55) !important;
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.2) !important;
}

:deep(.el-select__placeholder) {
  color: rgb(100 116 139);
}

:deep(.el-select__selected-item) {
  color: #f1f5f9;
}

/* Дата й час у полі: відступ для іконки, вища зона натиску */
:deep(.drawer-date-picker.el-date-editor) {
  width: 100%;
  max-width: 100%;
}

:deep(.drawer-date-picker.el-date-editor .el-input__wrapper) {
  min-height: 44px;
  padding-left: 14px !important;
  padding-right: 14px !important;
}

:deep(.drawer-date-picker .el-input__prefix) {
  margin-inline-end: 8px;
}

:deep(.drawer-date-picker .el-input__prefix-inner > :first-child) {
  margin-right: 0;
  margin-left: 2px;
  font-size: 17px;
  color: rgb(148 163 184 / 0.95);
}
</style>
