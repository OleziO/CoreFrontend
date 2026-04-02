<template>
  <el-dialog
    :model-value="modelValue"

    destroy-on-close
    width="520"
    :title="isEditMode ? 'Редагування команди' : 'Створення команди'"
    @close="onReset"
  >
    <el-form
      v-loading.fullscreen="loading"
      :model="form"
      label-position="top"
      class="flex flex-col gap-16"
    >
      <!-- Назва команди -->
      <el-form-item label="Назва команди" required>
        <el-input
          v-model="form.name"
          type="textarea"
          maxlength="20"
          show-word-limit
          resize="none"
          placeholder="Введіть назву (до 20 символів)"
          class="w-full"
          :rows="1"
        />
      </el-form-item>

      <!-- Dota Team ID -->
      <el-form-item label="Dota Team ID" required>
        <template #label>
          <div class="flex relative w-full items-center gap-6">
            <span>Dota Team ID</span>
            <el-tooltip
              content="ID команди Dota 2. Використовується для синхронізації статистики"
              placement="top"
            >
              <PhInfo size="14" class="cursor-pointer text-gray-400" />
            </el-tooltip>
          </div>
        </template>

        <el-input
          v-model="form.dotaTeamId"
          type="text"
          inputmode="numeric"
          placeholder="Наприклад: 1234567"
          @input="onNumericInput('dotaTeamId')"
        />
      </el-form-item>

      <!-- Upload avatar -->
      <el-form-item required label="Логотип команди">
        <!-- Preview with remove button -->
        <div
          class="relative pt-10 p-20 w-full flex justify-center"
        >
          <el-avatar
            :src="preview || ''"
            size="large"
            class="size-100 ring-2 ring-gray-800"
          >
            <template #default>
              <PhUser size="28" weight="bold" class="text-white/70" />
            </template>
          </el-avatar>
        </div>

        <!-- Upload button -->
        <el-upload
          class="w-full"
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept="image/png,image/jpeg,image/webp"
          @change="onFileChange"
        >
          <div class="flex flex-col items-center gap-8 text-gray-400">
            <PhUploadSimple size="28" />

            <span class="text-sm">
              Перетягніть файл або <span class="text-primary">натисніть</span>
            </span>

            <span class="text-xs text-gray-500">
              PNG / JPG / WEBP • до 2MB
            </span>
          </div>
        </el-upload>
      </el-form-item>
    </el-form>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex justify-end gap-12 pt-12">
        <el-button @click="onReset">
          Скасувати
        </el-button>

        <el-button
          type="primary"
          :disabled="!isValid"
          @click="onSubmit"
        >
          {{ isEditMode ? 'Зберегти' : 'Створити команду' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getImageUrl } from '@/core/helpers'
import { PhInfo, PhUploadSimple, PhUser } from '@phosphor-icons/vue'

const props = defineProps<{
  team?: TTeam
}>()

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'submit', payload: ICreateTeamForm): void
}>()

const loading = ref(false)
const form = ref<ICreateTeamForm>({
  name: '',
  dotaTeamId: null,
  avatar: null
})

const preview = ref<string | null>(null)

const isValid = computed(() => !!form.value.name && !!form.value.dotaTeamId)

const isEditMode = computed(() => !!props.team)

function onFileChange (file: any, fileList: any) {
  // беремо останній файл
  const rawFile = file.raw ?? (fileList[fileList.length - 1]?.raw)
  if (!rawFile) return

  // видаляємо старий URL
  if (preview.value) {
    URL.revokeObjectURL(preview.value)
  }

  form.value.avatar = rawFile
  preview.value = URL.createObjectURL(rawFile)
}

function onReset () {
  if (preview.value) {
    URL.revokeObjectURL(preview.value)
  }
  form.value = { name: '', dotaTeamId: null, avatar: null }
  preview.value = null

  modelValue.value = false
}

function onNumericInput (key: 'dotaTeamId') {
  const value = String(form.value[key] ?? '')

  const numeric = value.replace(/\D+/g, '')

  form.value[key] = numeric === '' ? null : Math.min(Number(numeric), 9999999)
}

async function onSubmit () {
  if (!isValid.value) return

  emit('submit', form.value)

  modelValue.value = false
}

watch(() => [modelValue.value, props.team], ([newModelValue, newTeam]) => {
  const newTeamData = newTeam as TTeam
  if (newModelValue && newTeamData) {
    form.value = {
      name: newTeamData.team_name,
      dotaTeamId: newTeamData.dota_team_id ?? null,
      avatar: null
    }

    preview.value = getImageUrl(newTeamData.avatar_url) ?? null
  }
}, { immediate: true })
</script>

<style scoped>
.group:hover button {
  display: block;
}
</style>
