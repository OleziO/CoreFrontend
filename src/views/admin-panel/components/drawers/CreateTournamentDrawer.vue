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
            {{ isEditMode ? 'Редагувати турнір' : 'Додати турнір' }}
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
              <PhSlidersHorizontal :size="18" weight="duotone" class="text-primary" />
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

              <el-form-item label="Статус турніру" required class="drawer-field span-full">
                <el-select v-model="form.tournamentStatus" size="large" class="w-full">
                  <el-option
                    v-for="s in statusOptions"
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

              <el-form-item class="drawer-field span-full mb-0">
                <!-- Обгортка потрібна: .el-form-item__content — flex-рядок, інакше підказка стане збоку. -->
                <div class="flex w-full flex-col">
                  <el-checkbox v-model="form.hasQualification" :disabled="isEditMode" size="large">
                    Кваліфікаційний етап
                  </el-checkbox>
                  <p class="drawer-field__note">
                    <template v-if="isEditMode">
                      Етап зафіксовано при створенні турніру й змінити його не можна.
                    </template>
                    <template v-else-if="form.hasQualification">
                      Турнір проходить через кваліфікацію перед плей-оф.
                    </template>
                    <template v-else>
                      Без кваліфікації: немає сторінки та дат етапу, команди з реєстрації
                      потрапляють одразу в сітку.
                    </template>
                  </p>
                </div>
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

              <el-form-item class="drawer-field" :error="slotsError ?? undefined">
                <template #label>
                  <span v-if="form.hasQualification">
                    Слоти команд <span class="label-optional">(опціонально)</span>
                  </span>
                  <span v-else>
                    Слоти команд <span class="label-optional">(до {{ PLAYOFF_TEAM_LIMIT }})</span>
                  </span>
                </template>
                <el-input
                  v-model="slotsText"
                  inputmode="numeric"
                  :placeholder="form.hasQualification ? '16' : String(PLAYOFF_TEAM_LIMIT)"
                  size="large"
                  @input="slotsText = String($event).replace(/\D+/g, '')"
                />
              </el-form-item>

              <el-form-item class="drawer-field span-full">
                <template #label>
                  <span>Вступний внесок <span class="label-optional">(0 або порожньо — безкоштовно)</span></span>
                </template>
                <el-input
                  v-model="entryFeeText"
                  inputmode="numeric"
                  placeholder="200"
                  size="large"
                  @input="entryFeeText = String($event).replace(/\D+/g, '')"
                >
                  <template #prefix>
                    <span class="input-prefix-muted">₴</span>
                  </template>
                </el-input>
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
                <template v-if="form.hasQualification">
                  Три етапи турніру. Реєстрація може перетинатися з кваліфікацією, але кваліфікація
                  має завершитися до старту плей-оф.
                </template>
                <template v-else>
                  Два етапи турніру: реєстрація, потім плей-оф.
                </template>
              </p>

              <div
                v-for="(group, index) in visibleScheduleGroups"
                :key="group.title"
                class="drawer-phase"
              >
                <div class="drawer-phase__head">
                  <span class="drawer-phase__index">{{ index + 1 }}</span>
                  <span class="drawer-phase__title">{{ group.title }}</span>
                </div>
                <p class="drawer-phase__hint">{{ group.hint }}</p>
                <div class="drawer-date-grid">
                  <el-form-item
                    v-for="field in group.fields"
                    :key="field.key"
                    :label="field.label"
                    required
                    class="drawer-field"
                  >
                    <el-date-picker
                      v-model="form[field.key]"
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

              <p v-if="scheduleError" class="drawer-schedule-error">
                <PhWarningCircle :size="16" weight="fill" />
                <span>{{ scheduleError }}</span>
              </p>
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
                      :on-change="(file: UploadFile) => handleBannerPick(u.key, file)"
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
              {{ isEditMode ? 'Зберегти зміни' : 'Створити турнір' }}
            </el-button>
          </div>
        </el-form>
      </div>
    </el-config-provider>
  </el-drawer>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import uk from 'element-plus/es/locale/lang/uk'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { Edit, Plus } from '@element-plus/icons-vue'
import { PhCalendar, PhImageSquare, PhSlidersHorizontal, PhTrophy, PhWarningCircle } from '@phosphor-icons/vue'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import { UPLOAD_ERROR, validateImageFileForUpload } from '@/services/image-upload.service'
import {
  PLAYOFF_TEAM_LIMIT,
  tournamentCreateStatusOptions,
  tournamentStatusLabelMap,
  type TTournamentStatusValue
} from '@/components/tournaments-tags/tournament.constants'
import { getImageUrl } from '@/core/helpers'
import { getScheduleViolation, type TTournamentScheduleForm } from '@/core/utils/tournament-schedule'
import type { TCreateTournamentDto as CreateTournamentDto, TUpdateTournamentDto as UpdateTournamentDto } from '@/api/types/api.types'

type TUploadKey = 'header' | 'list'

const props = defineProps<{ tournament?: TTournament | null }>()
const showCreateTournamentDrawer = defineModel<boolean>()
const isEditMode = computed(() => !!props.tournament)
const loading = ref(false)

const tournamentStore = useTournamentStore()

const elementPlusUk = uk

const prizePoolText = ref('')
const slotsText = ref('')
// Вводиться в гривнях, зберігається у копійках (×100).
const entryFeeText = ref('')

const files = reactive<Record<TUploadKey, File | null>>({
  header: null,
  list: null
})

const previews = reactive<Record<TUploadKey, string>>({
  header: '',
  list: ''
})

const uploads: { key: TUploadKey; label: string }[] = [
  { key: 'header', label: 'Банер у шапці' },
  { key: 'list', label: 'Банер у списку' }
]

const statusStripeClass: Record<TTournamentStatusValue, string> = {
  REGISTRATION: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
  QUALIFICATIONS: 'bg-green-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
  PLAYOFF: 'bg-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.45)]'
}

const form = reactive({
  name: '',
  tournamentStatus: 'REGISTRATION' as CreateTournamentDto['tournamentStatus'],
  hasQualification: true,
  registrationStartsAt: '',
  registrationEndsAt: '',
  qualificationStartsAt: '',
  qualificationEndsAt: '',
  tournamentStartsAt: '',
  tournamentEndsAt: ''
})

type TScheduleKey = keyof TTournamentScheduleForm

type TScheduleGroup = {
  title: string
  hint: string
  /** Група кваліфікації зникає, коли етап вимкнено. */
  requiresQualification?: boolean
  fields: { key: TScheduleKey; label: string }[]
}

/**
 * Вікна розкладу. Плей-оф лишається під історичними ключами
 * `tournamentStartsAt`/`tournamentEndsAt` — так їх називає контракт API.
 */
const SCHEDULE_GROUPS: TScheduleGroup[] = [
  {
    title: 'Реєстрація',
    hint: 'Коли капітани можуть подати команду й сплатити внесок.',
    fields: [
      { key: 'registrationStartsAt', label: 'Початок реєстрації' },
      { key: 'registrationEndsAt', label: 'Кінець реєстрації' }
    ]
  },
  {
    title: 'Кваліфікація',
    hint: 'Вікно подачі кваліфікаційних матчів. Може перетинатися з реєстрацією.',
    requiresQualification: true,
    fields: [
      { key: 'qualificationStartsAt', label: 'Початок кваліфікації' },
      { key: 'qualificationEndsAt', label: 'Кінець кваліфікації' }
    ]
  },
  {
    title: 'Плей-оф',
    hint: 'Сітка стартує автоматично о «Початок плей-оф».',
    fields: [
      { key: 'tournamentStartsAt', label: 'Початок плей-оф' },
      { key: 'tournamentEndsAt', label: 'Кінець плей-оф' }
    ]
  }
]

/** Усі ключі розкладу — для заповнення й очищення форми, незалежно від видимості. */
const ALL_SCHEDULE_KEYS: TScheduleKey[] = SCHEDULE_GROUPS.flatMap(g => g.fields.map(f => f.key))

const visibleScheduleGroups = computed(() =>
  SCHEDULE_GROUPS.filter(g => form.hasQualification || !g.requiresQualification)
)

/** Обовʼязкові до заповнення дати — лише з видимих груп. */
const requiredScheduleKeys = computed<TScheduleKey[]>(() =>
  visibleScheduleGroups.value.flatMap(g => g.fields.map(f => f.key))
)

/** Без кваліфікації статус «Кваліфікація» недосяжний — турнір іде одразу в плей-оф. */
const statusOptions = computed(() =>
  tournamentCreateStatusOptions.filter(o => form.hasQualification || o.key !== 'QUALIFICATIONS')
)

/**
 * Без кваліфікації немає турнірної таблиці, за якою обрати учасників сітки,
 * тож поле команд має вміститися в неї цілком. Дзеркалить
 * `validateQualificationConfig` на бекенді.
 */
const slotsError = computed(() => {
  if (form.hasQualification) return null
  if (slotsText.value === '') {
    return `Для турніру без кваліфікації вкажіть слоти команд (не більше ${PLAYOFF_TEAM_LIMIT})`
  }
  if (Number(slotsText.value) > PLAYOFF_TEAM_LIMIT) {
    return `Без кваліфікації слотів команд не може бути більше ${PLAYOFF_TEAM_LIMIT}`
  }
  return null
})

/** Порушення послідовності етапів; дзеркалить перевірку бекенду. */
const scheduleError = computed(() => getScheduleViolation(form))

const isFormValid = computed(() =>
  form.name.trim() !== '' &&
    requiredScheduleKeys.value.every(key => form[key] !== '') &&
    scheduleError.value === null &&
    slotsError.value === null
)

/**
 * Вимкнена кваліфікація не має лишати по собі ні дат, ні статусу: інакше
 * прихована дата поїхала б у payload, а статус суперечив би конфігурації.
 */
watch(() => form.hasQualification, (enabled) => {
  if (enabled) return
  form.qualificationStartsAt = ''
  form.qualificationEndsAt = ''
  if (form.tournamentStatus === 'QUALIFICATIONS') form.tournamentStatus = 'REGISTRATION'
})

function syncDayjsUk () {
  dayjs.locale('uk')
}

function translateUploadErr (msg: string) {
  if (msg === UPLOAD_ERROR.notImage) return 'Дозволені лише файли зображень'
  if (msg === UPLOAD_ERROR.tooLarge) return 'Файл завеликий (максимум 10 МБ)'
  if (msg === UPLOAD_ERROR.network) return 'Не вдалося завантажити зображення, спробуйте ще раз'
  return msg
}

function ingestImageFile (key: TUploadKey, raw: File) {
  const v = validateImageFileForUpload(raw)
  if (v !== null) {
    ElMessage.error(translateUploadErr(v))
    return
  }
  if (previews[key]) URL.revokeObjectURL(previews[key])
  files[key] = raw
  previews[key] = URL.createObjectURL(raw)
}

function handleBannerPick (key: TUploadKey, uploadFile: UploadFile) {
  const raw = uploadFile.raw
  if (!raw) return
  ingestImageFile(key, raw)
}

function populateFromTournament (t: TTournament) {
  form.name = t.name ?? ''
  form.hasQualification = t.hasQualification !== false
  const editableStatuses: TTournamentStatusValue[] = ['REGISTRATION', 'QUALIFICATIONS', 'PLAYOFF']
  form.tournamentStatus = editableStatuses.includes(t.tournamentStatus as TTournamentStatusValue)
    ? (t.tournamentStatus as TTournamentStatusValue)
    : 'REGISTRATION'
  for (const key of ALL_SCHEDULE_KEYS) {
    const iso = t[key]
    form[key] = iso ? dayjs(iso).format('YYYY-MM-DD HH:mm') : ''
  }
  prizePoolText.value = t.prizePool != null ? String(t.prizePool) : ''
  slotsText.value = t.tournamentSlots != null ? String(t.tournamentSlots) : ''
  entryFeeText.value = t.entryFee != null && t.entryFee > 0 ? String(Math.round(t.entryFee / 100)) : ''
  previews.header = t.headerBannerUrl ? getImageUrl(t.headerBannerUrl) : ''
  previews.list = t.listBannerUrl ? getImageUrl(t.listBannerUrl) : ''
}

function clearData () {
  form.name = ''
  form.tournamentStatus = 'REGISTRATION'
  form.hasQualification = true
  for (const key of ALL_SCHEDULE_KEYS) form[key] = ''
  prizePoolText.value = ''
  slotsText.value = ''
  entryFeeText.value = ''
  for (const k of Object.keys(files) as TUploadKey[]) {
    if (previews[k] && previews[k].startsWith('blob:')) URL.revokeObjectURL(previews[k])
    files[k] = null
    previews[k] = ''
  }
}

watch(showCreateTournamentDrawer, (isOpen) => {
  if (isOpen) {
    syncDayjsUk()
    if (props.tournament) populateFromTournament(props.tournament)
  } else {
    clearData()
  }
})

function toIsoUtc (pickerValue: string): string {
  return dayjs(pickerValue, 'YYYY-MM-DD HH:mm').toISOString()
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  const basePayload = {
    name: form.name.trim(),
    tournamentStatus: form.tournamentStatus,
    registrationStartsAt: toIsoUtc(form.registrationStartsAt),
    registrationEndsAt: toIsoUtc(form.registrationEndsAt),
    // Без кваліфікації дати етапу не передаються — бекенд тримає їх null.
    ...(form.hasQualification && {
      qualificationStartsAt: toIsoUtc(form.qualificationStartsAt),
      qualificationEndsAt: toIsoUtc(form.qualificationEndsAt)
    }),
    tournamentStartsAt: toIsoUtc(form.tournamentStartsAt),
    tournamentEndsAt: toIsoUtc(form.tournamentEndsAt),
    ...(prizePoolText.value !== '' && { prizePool: Number(prizePoolText.value) }),
    ...(slotsText.value !== '' && { tournamentSlots: Number(slotsText.value) }),
    // Гривні → копійки. Порожнє поле означає безкоштовний турнір (0).
    entryFee: entryFeeText.value !== '' ? Number(entryFeeText.value) * 100 : 0
  }

  loading.value = true
  try {
    /**
     * `hasQualification` існує лише в контракті створення: етап фіксується при
     * створенні, а PATCH із цим полем бекенд відхилить (forbidNonWhitelisted).
     */
    const saved = isEditMode.value && props.tournament
      ? await tournamentStore.updateTournament(props.tournament.id, basePayload as UpdateTournamentDto)
      /**
       * `as unknown` — тимчасовий місток: бекенд уже приймає створення без
       * `division`, але згенерований `schema.d.ts` ще вважає поле обовʼязковим.
       * Прибрати разом з `npm run api` після викочування Фази 3.
       */
      : await tournamentStore.createTournament(
        { ...basePayload, hasQualification: form.hasQualification } as unknown as CreateTournamentDto
      )
    const id = saved.id

    try {
      if (files.header) await tournamentsService.uploadHeaderBanner(id, files.header)
      if (files.list) await tournamentsService.uploadListBanner(id, files.list)
    } catch (up: unknown) {
      const um = up instanceof Error ? up.message : String(up)
      const action = isEditMode.value ? 'оновлено' : 'створено'
      ElMessage.warning(`Турнір ${action}, але зображення не завантажились: ${translateUploadErr(um)}`)
      showCreateTournamentDrawer.value = false
      clearData()
      return
    }

    ElMessage.success(isEditMode.value ? 'Турнір успішно оновлено' : 'Турнір успішно створено')
    showCreateTournamentDrawer.value = false
  } catch (e: unknown) {
    const action = isEditMode.value ? 'оновленні' : 'створенні'
    ElMessage.error(getApiErrorMessage(e, `Помилка при ${action} турніру`))
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

/* Один етап розкладу: реєстрація / кваліфікація / плей-оф */
.drawer-phase {
  padding: 12px 14px 2px;
  border: 1px solid rgb(55 65 81 / 0.55);
  border-radius: 12px;
  background: rgb(17 24 39 / 0.35);
}

.drawer-phase + .drawer-phase {
  margin-top: 12px;
}

.drawer-phase__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-phase__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgb(56 189 248 / 0.14);
  color: rgb(125 211 252);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.drawer-phase__title {
  font-size: 12px;
  font-weight: 600;
  color: rgb(229 231 235);
}

.drawer-phase__hint {
  margin: 4px 0 10px 26px;
  padding: 0;
  font-size: 11px;
  line-height: 1.55;
  color: rgb(107 114 128);
}

.drawer-schedule-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
  padding: 9px 12px;
  border: 1px solid rgb(248 113 113 / 0.35);
  border-radius: 10px;
  background: rgb(127 29 29 / 0.18);
  font-size: 12px;
  line-height: 1.5;
  color: rgb(252 165 165);
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

/* Пояснення під чекбоксом: тон як у .drawer-section__hint, але без відступу секції. */
.drawer-field__note {
  margin: 6px 0 0;
  padding: 0;
  max-width: 44rem;
  font-size: 12px;
  line-height: 1.6;
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
  --el-drawer-bg-color: theme('colors.dark.navy');
  background: linear-gradient(180deg, #0f172a 0%, theme('colors.dark.navy') 40%, #080c16 100%) !important;
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
  color: theme('colors.gray.400');
  font-size: 18px;
}

:deep(.create-tournament-drawer .el-drawer__close-btn:hover) {
  color: white;
}

:deep(.drawer-field .el-form-item__label) {
  color: theme('colors.gray.300');
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
  color: white;
}

:deep(.el-input__inner::placeholder) {
  color: theme('colors.gray.500');
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
  color: theme('colors.gray.500');
}

:deep(.el-select__selected-item) {
  color: white;
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
