<template>
  <el-dialog
    align-center
    class="team-create-dialog"
    :model-value="modelValue"
    destroy-on-close
    width="480"
    :title="isEditMode ? 'Редагування команди' : 'Створення команди'"
    @close="onClose"
  >
    <el-form
      v-loading="loading"
      :model="form"
      label-position="top"
      class="team-create-form flex flex-col gap-8"
    >
      <el-form-item label="Назва команди" required>
        <el-input
          v-model="form.name"
          placeholder="Введіть назву команди"
          class="w-full"
        />
      </el-form-item>

      <el-form-item
        class="mt-10"
        label="ID команди Dota 2"
        :required="!isEditMode"
      >
        <el-input
          v-model="form.dotaTeamId"
          inputmode="numeric"
          placeholder="Введіть ID команди з Dota 2"
          class="w-full"
        />
      </el-form-item>

      <el-form-item
        class="mt-10"
        label="Логотип команди"
        :required="!isEditMode"
      >
        <div class="flex w-full flex-col gap-6">
          <el-upload
            class="team-logo-upload block w-full"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleLogoChange"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
          >
            <div class="w-full">
              <div
                v-if="!displayLogo"
                class="relative flex min-h-88 w-full cursor-pointer flex-col items-center justify-center
                  gap-10 rounded-xl border border-solid border-white/25 bg-white/[0.04]
                  px-16 py-20 transition hover:border-white/35 hover:bg-white/[0.06]"
              >
                <el-icon class="text-2xl text-white/70"><Plus /></el-icon>
                <span class="text-center text-sm text-white/50">
                  Обрати зображення
                </span>
              </div>
              <div
                v-else
                class="flex w-full cursor-pointer justify-center py-14"
              >
                <div
                  class="relative aspect-square w-[min(104px,100%)] overflow-hidden rounded-full border
                    border-solid border-white/20 bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                >
                  <img
                    :src="displayLogo"
                    alt=""
                    class="pointer-events-none absolute inset-0 h-full w-full rounded-full object-cover"
                  >
                  <div
                    class="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 opacity-0
                      transition-opacity hover:opacity-100"
                  >
                    <el-icon class="text-lg text-white"><Edit /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </el-upload>

          <div class="flex flex-col items-center gap-3 text-center leading-snug">
            <p
              v-if="logoPickError"
              class="w-full text-[11px] text-red-400"
            >
              {{ logoPickError }}
            </p>
            <p
              v-if="isEditMode && !logoFile && team?.logoUrl"
              class="w-full text-[11px] text-gray-500"
            >
              Для заміни — новий файл
            </p>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-8 pt-6">
        <el-button @click="onClose">
          Скасувати
        </el-button>

        <el-button
          type="primary"
          :disabled="!isValid"
          :loading="loading"
          @click="submitForm"
        >
          {{ isEditMode ? 'Зберегти' : 'Створити команду' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Edit, Plus } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import type {
  TCreateTeamDto
} from '@/api/types/api.types'
import type { TCreateTeamPayload, TUpdateTeamPayload } from '@/views/teams/teams.service'

import { validateImageFileForUpload } from '@/services/image-upload.service'
import { resolvePublicOrApiUrl } from '@/core/helpers'

const props = defineProps<{
  team?: TTeam
  /** Якщо передано з `useAppModals` — викликається замість/разом з emit */
  onSubmit?: (payload: TCreateTeamPayload | TUpdateTeamPayload) => void | Promise<void>
}>()

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'submit', payload: TCreateTeamPayload | TUpdateTeamPayload): void
}>()

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

function resetForm () {
  if (localLogoPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(localLogoPreview.value)
  }
  localLogoPreview.value = null
  logoFile.value = null
  logoPickError.value = null
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
      if (localLogoPreview.value?.startsWith('blob:')) {
        URL.revokeObjectURL(localLogoPreview.value)
      }
      localLogoPreview.value = null
      logoFile.value = null
      logoPickError.value = null
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
  if (localLogoPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(localLogoPreview.value)
  }
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
.team-create-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    margin-bottom: 4px;
    line-height: 1.25;
    font-size: 12px;
  }
}

.team-logo-upload {
  :deep(.el-upload) {
    display: block;
    width: 100%;
    border: none;
  }
}

</style>

<style lang="scss">
.team-create-dialog.el-dialog {
  margin: 0 auto;

  .el-dialog__body {
    max-height: none;
    overflow: visible;
  }
}
</style>
