<template>
  <el-dialog
    align-center
    class="team-dialog"
    :model-value="modelValue"
    destroy-on-close
    :width="dialogWidth"
    :show-close="false"
    @close="onClose"
  >
    <!-- Header: register label, title, close -->
    <template #header>
      <div class="team-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Команда</span>
          <h2 class="team-dialog__title">{{ isEditMode ? 'Редагування команди' : 'Створення команди' }}</h2>
        </div>
        <button type="button" class="team-dialog__close" aria-label="Закрити" @click="onClose">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <el-form
      v-loading="loading"
      :model="form"
      label-position="top"
      class="team-form"
      @submit.prevent="submitForm"
    >
      <el-form-item label="Назва команди" required>
        <el-input v-model="form.name" placeholder="Введіть назву команди" maxlength="40" show-word-limit />
      </el-form-item>

      <el-form-item label="ID команди Dota 2" :required="!isEditMode">
        <el-input v-model="form.dotaTeamId" inputmode="numeric" placeholder="Наприклад, 9471706">
          <template #prefix>
            <img src="/dota_icon.png" alt="" class="size-14 rounded-[3px] object-contain" draggable="false">
          </template>
        </el-input>
        <p class="team-form__hint" :class="{ 'is-error': dotaIdTouchedInvalid }">
          <template v-if="dotaIdTouchedInvalid">Лише цифри, до 24 символів.</template>
          <template v-else>
            Числовий ID офіційної команди Dota 2.
            <el-popover placement="top-start" :width="340" trigger="click" popper-class="team-guide-popper">
              <template #reference>
                <button type="button" class="team-form__hint-link">
                  Де знайти? <PhQuestion :size="12" weight="bold" />
                </button>
              </template>
              <div class="team-guide">
                <span class="sys-label !text-[9px]">// Як отримати ID</span>
                <ol class="team-guide__steps">
                  <li>
                    У клієнті Dota 2 відкрийте
                    <b>Налаштування → Аккаунт → Управління офіційною інформацією та командами</b>.
                  </li>
                  <li>
                    Натисніть <b>Створити команду</b>, вкажіть назву, тег і логотип — команда стане офіційною.
                    Гравців капітан запрошує зі списку друзів.
                  </li>
                  <li>
                    Після створення на сторінці команди з’явиться її <b>Dota ID</b>. Він потрібен для участі
                    в турнірах, а також за ним команду можна переглянути на Dotabuff.
                  </li>
                </ol>
                <a
                  href="https://www.dotabuff.com/esports/teams"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="team-guide__link"
                >
                  Команди на Dotabuff <PhArrowUpRight :size="11" weight="bold" />
                </a>
              </div>
            </el-popover>
            <a
              v-if="dotaIdValid"
              :href="getDotabuffTeamUrl(form.dotaTeamId.trim())"
              target="_blank"
              rel="noopener noreferrer"
              class="team-form__hint-link"
            >
              Перевірити <PhArrowUpRight :size="11" weight="bold" />
            </a>
          </template>
        </p>
      </el-form-item>

      <el-form-item label="Логотип команди" :required="!isEditMode">
        <div class="flex w-full flex-col gap-8">
          <el-upload
            class="team-logo-upload"
            action="#"
            drag
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleLogoChange"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
          >
            <div class="logo-drop" :class="{ 'is-filled': !!displayLogo, 'is-error': !!logoPickError }">
              <span class="logo-drop__well">
                <img v-if="displayLogo" :src="displayLogo" alt="" class="logo-drop__img">
                <PhImage v-else :size="24" weight="duotone" class="text-white/45" />
              </span>

              <span class="flex min-w-0 flex-1 flex-col gap-3 text-left">
                <span class="logo-drop__title truncate">
                  {{ logoFile ? logoFile.name : (displayLogo ? 'Поточний логотип' : 'Перетягніть файл або натисніть') }}
                </span>
                <span class="logo-drop__meta">
                  <template v-if="logoFile">{{ formatSize(logoFile.size) }} · буде замінено при збереженні</template>
                  <template v-else-if="displayLogo">Для заміни — оберіть новий файл</template>
                  <template v-else>PNG, JPG, WEBP або SVG · квадратне зображення</template>
                </span>
              </span>

              <span class="logo-drop__action">
                <PhUploadSimple :size="14" weight="bold" />
                <span>{{ displayLogo ? 'Замінити' : 'Обрати' }}</span>
              </span>
            </div>
          </el-upload>

          <div v-if="logoPickError || logoFile" class="flex items-center justify-between gap-12">
            <p v-if="logoPickError" class="team-form__hint is-error m-0">{{ logoPickError }}</p>
            <span v-else />
            <button v-if="logoFile" type="button" class="team-form__clear" @click="clearPickedLogo">
              <PhX :size="11" weight="bold" /> Прибрати новий файл
            </button>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="team-dialog__foot">
        <el-button @click="onClose">Скасувати</el-button>
        <el-button type="primary" :disabled="!isValid" :loading="loading" @click="submitForm">
          <PhCheck :size="16" weight="bold" />
          <span>{{ isEditMode ? 'Зберегти' : 'Створити команду' }}</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhArrowUpRight, PhCheck, PhImage, PhQuestion, PhUploadSimple, PhX } from '@phosphor-icons/vue'
import type { UploadFile } from 'element-plus'
import type { TCreateTeamDto } from '@/api/types/api.types'
import type { TCreateTeamPayload, TUpdateTeamPayload } from '@/views/teams/teams.service'

import { validateImageFileForUpload } from '@/services/image-upload.service'
import { getDotabuffTeamUrl, resolvePublicOrApiUrl } from '@/core/helpers'

const props = defineProps<{
  team?: TTeam
  /** Якщо передано з `useAppModals` — викликається замість/разом з emit */
  onSubmit?: (payload: TCreateTeamPayload | TUpdateTeamPayload) => void | Promise<void>
}>()

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'submit', payload: TCreateTeamPayload | TUpdateTeamPayload): void
}>()

const { width } = useWindowSize()
const dialogWidth = computed(() => (width.value < 640 ? 'calc(100vw - 24px)' : 520))

const loading = ref(false)
const form = ref({ name: '', dotaTeamId: '' })

function isDigitsOnly (value: string) {
  const t = value.trim()
  return t.length >= 1 && t.length <= 24 && /^\d+$/.test(t)
}
const logoFile = ref<File | null>(null)
/** Локальний превью (blob:) після вибору файлу */
const localLogoPreview = ref<string | null>(null)

const logoPickError = ref<string | null>(null)

const isEditMode = computed(() => !!props.team)

const dotaIdValid = computed(() => isDigitsOnly(form.value.dotaTeamId))
const dotaIdTouchedInvalid = computed(() => {
  const raw = form.value.dotaTeamId.trim()
  return raw !== '' && !isDigitsOnly(raw)
})

const displayLogo = computed(() => {
  if (localLogoPreview.value) return localLogoPreview.value
  const url = props.team?.logoUrl
  if (!url?.trim()) return null
  return resolvePublicOrApiUrl(url)
})

const isValid = computed(() => {
  const nameOk = form.value.name.trim().length > 0
  const rawId = form.value.dotaTeamId.trim()
  if (isEditMode.value) {
    const idOk = rawId === '' || isDigitsOnly(rawId)
    return nameOk && idOk
  }
  return nameOk && isDigitsOnly(rawId) && logoFile.value != null
})

function formatSize (bytes: number) {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function revokePreview () {
  if (localLogoPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(localLogoPreview.value)
  }
  localLogoPreview.value = null
}

function clearPickedLogo () {
  revokePreview()
  logoFile.value = null
  logoPickError.value = null
}

function resetForm () {
  clearPickedLogo()
  form.value = { name: '', dotaTeamId: '' }
}

watch(
  () => [modelValue.value, props.team] as const,
  ([open, team]) => {
    if (!open) return
    if (team) {
      form.value = {
        name: team.name ?? '',
        dotaTeamId:
          team.dotaTeamId != null && team.dotaTeamId !== ''
            ? String(team.dotaTeamId)
            : ''
      }
      clearPickedLogo()
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function handleLogoChange (uploadFile: UploadFile) {
  const raw = uploadFile.raw
  if (!raw) return
  const problem = validateImageFileForUpload(raw)
  if (problem) {
    logoPickError.value = problem
    ElMessage.error(problem)
    return
  }
  logoPickError.value = null
  logoFile.value = raw
  revokePreview()
  localLogoPreview.value = URL.createObjectURL(raw)
}

function onClose () {
  resetForm()
  modelValue.value = false
}

async function submitForm () {
  if (!isValid.value || loading.value) return

  loading.value = true
  try {
    const name = form.value.name.trim()
    const dotaTrim = form.value.dotaTeamId.trim()

    if (isEditMode.value && props.team) {
      const payload: TUpdateTeamPayload = { name }
      if (dotaTrim !== '') {
        payload.dotaTeamId = dotaTrim
      }
      if (logoFile.value) payload.logoFile = logoFile.value
      if (props.onSubmit) await props.onSubmit(payload)
      else emit('submit', payload)
    } else {
      if (!logoFile.value) {
        ElMessage.error('Додайте логотип команди')
        return
      }
      const dto: TCreateTeamDto = {
        name,
        dotaTeamId: dotaTrim,
        isVerified: false,
        isPlayingTournament: false
      }
      const payload: TCreateTeamPayload = {
        ...dto,
        logoFile: logoFile.value
      }
      if (props.onSubmit) await props.onSubmit(payload)
      else emit('submit', payload)
    }

    onClose()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.team-form {
  @apply flex flex-col gap-18;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    margin-bottom: 6px;
    line-height: 1.25;
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ds-text-faint);
  }

  :deep(.el-form-item__content) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
}

.team-form__hint {
  @apply m-0 flex flex-wrap items-center gap-6;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ds-text-faint);

  &.is-error {
    color: #f87171;
  }
}

.team-form__hint-link {
  @apply inline-flex items-center gap-3 border-0 bg-transparent p-0 no-underline;
  font-size: 12px;
  color: var(--ds-primary);
  cursor: pointer;
  transition: color var(--ds-duration-base) ease;
}

.team-form__clear {
  @apply inline-flex items-center gap-4 border-0 bg-transparent p-0;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  cursor: pointer;
  transition: color var(--ds-duration-base) ease;
}

// ─── Logo dropzone ──────────────────────────────────────────────────────────
.team-logo-upload {
  @apply block w-full;

  :deep(.el-upload),
  :deep(.el-upload-dragger) {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    border-radius: 14px;
    background: transparent;
  }

  :deep(.el-upload-dragger.is-dragover) .logo-drop {
    border-color: rgba(var(--ds-primary-rgb), 0.7);
    background: rgba(var(--ds-primary-rgb), 0.08);
  }
}

.logo-drop {
  @apply flex w-full items-center gap-14 rounded-[14px] border p-12;
  border-color: rgba(var(--ds-primary-rgb), 0.22);
  background:
    repeating-linear-gradient(-45deg, rgba(var(--ds-primary-rgb), 0.04) 0 1px, transparent 1px 10px),
    rgba(7, 8, 15, 0.45);
  cursor: pointer;
  transition: border-color var(--ds-duration-base) ease, background-color var(--ds-duration-base) ease;

  &.is-filled {
    background: rgba(7, 8, 15, 0.45);
  }

  &.is-error {
    border-color: rgba(248, 113, 113, 0.5);
  }
}

.logo-drop__well {
  @apply relative inline-flex size-64 shrink-0 items-center justify-center overflow-visible rounded-xl;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.logo-drop__img {
  @apply size-full rounded-xl object-cover;
}

.logo-drop__title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.logo-drop__meta {
  font-size: 12px;
  line-height: 1.4;
  color: var(--ds-text-faint);
}

.logo-drop__action {
  @apply inline-flex h-30 shrink-0 items-center gap-6 rounded-lg border px-10;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-primary);
  border-color: rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(var(--ds-primary-rgb), 0.08);
  transition: background-color var(--ds-duration-base) ease, color var(--ds-duration-base) ease;
}

@media (hover: hover) and (pointer: fine) {
  .logo-drop:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.5);

    .logo-drop__action {
      color: var(--ds-background);
      background: var(--ds-primary);
    }
  }

  .team-form__clear:hover,
  .team-form__hint-link:hover {
    color: #fff;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo-drop,
  .logo-drop__action,
  .team-form__clear {
    transition: none;
  }
}
</style>

<style lang="scss">
// Not scoped: `.el-dialog` renders outside this component's root. Same dark
// glass as the filter dialogs.
.el-dialog.team-dialog {
  margin: 0 auto;
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__body {
    max-height: none;
    overflow: visible;
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .team-dialog__close:focus-visible,
  .team-form__clear:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.team-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.team-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

.team-dialog__close {
  @apply inline-flex size-28 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.team-dialog__foot {
  @apply flex items-center justify-end gap-10;

  .el-button > span {
    @apply inline-flex items-center gap-8;
  }
}

// Guide popover (teleported, so not scoped).
.team-guide {
  @apply flex flex-col gap-10;
}

.team-guide__steps {
  @apply m-0 flex flex-col gap-8 pl-0;
  list-style: none;
  counter-reset: step;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.78);

  li {
    @apply relative pl-26;
    counter-increment: step;
  }

  li::before {
    content: counter(step, decimal-leading-zero);
    position: absolute;
    left: 0;
    top: 1px;
    font-family: var(--ds-font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--ds-primary);
  }

  b {
    color: #fff;
    font-weight: 600;
  }

  u {
    text-decoration: none;
    color: var(--ds-primary);
  }
}

.team-guide__link {
  @apply inline-flex items-center gap-4 self-start no-underline;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-primary);
}

@media (hover: hover) and (pointer: fine) {
  .team-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
