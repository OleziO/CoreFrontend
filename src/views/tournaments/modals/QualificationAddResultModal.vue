<template>
  <el-dialog
    :model-value="modelValue"
    title="Подати результат матчу"
    width="420px"
    class="qual-submit-dialog custom-dialog"
    destroy-on-close
    @update:model-value="onDialogVisible"
    @open="resetForm"
  >
    <p class="text-xs text-gray-500 leading-snug mb-12 m-0">
      Введіть ID матчу Dota 2, щоб зафіксувати результат вашої гри.
    </p>
    <el-input
      v-model="matchIdInput"
      placeholder="Наприклад 7890123456"
      inputmode="numeric"
      maxlength="20"
      :disabled="loading"
      class="match-id-input"
      @input="onMatchIdInput"
    />

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button :disabled="loading" class="!bg-transparent !border-white/10 !text-gray-300" @click="close">
          Скасувати
        </el-button>
        <el-button type="primary" class="!bg-cyan-600 !border-cyan-600" :loading="loading" @click="submit">
          Подати
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from '@/core/utils/api-errors'
import { friendlyQualificationSubmitError } from '../utils/qualification-errors.utils'
import type { TQualificationMatch as QualificationMatch } from '@/api/types/api.types'

const props = defineProps<{
  modelValue: boolean
  tournamentId: string
  /**
   * Причина, чому подача зараз заблокована, або null. Рядок замість булевого
   * прапорця, бо вікно кваліфікації закрите з двох боків: етап ще не почався
   * або вже завершився — бекенд для цих випадків повертає різні повідомлення.
   */
  submissionBlockedReason: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submitted', updated: QualificationMatch): void
}>()

const matchIdInput = ref('')
const loading = ref(false)

function onMatchIdInput (raw: string) {
  matchIdInput.value = String(raw ?? '').replace(/\D/g, '')
}

function resetForm () {
  matchIdInput.value = ''
  loading.value = false
}

function close () {
  emit('update:modelValue', false)
}

function onDialogVisible (v: boolean) {
  emit('update:modelValue', v)
}

function validate (): boolean {
  if (props.submissionBlockedReason) {
    ElMessage.warning(props.submissionBlockedReason)
    return false
  }
  const trimmed = matchIdInput.value.trim()
  if (!trimmed) {
    ElMessage.warning('Введіть ID матчу.')
    return false
  }
  if (!/^\d{6,16}$/.test(trimmed)) {
    ElMessage.warning('Некоректний формат ID матчу: потрібні лише цифри (6–16 символів).')
    return false
  }
  return true
}

async function submit () {
  if (!validate()) return

  loading.value = true
  try {
    const dotaMatchId = matchIdInput.value.trim()
    const updated = await tournamentsService.submitQualificationMatch(
      props.tournamentId,
      dotaMatchId
    )
    ElMessage.success('Результат успішно збережено')
    emit('submitted', updated)
    close()
  } catch (e: unknown) {
    const raw = getApiErrorMessage(e, 'Не вдалося зберегти результат')
    ElMessage.error(friendlyQualificationSubmitError(raw))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.qual-submit-dialog.custom-dialog) {
  background-color: theme('colors.dark.card');
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
:deep(.qual-submit-dialog .el-dialog__title) {
  color: white;
}
:deep(.match-id-input .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
}
:deep(.match-id-input .el-input__inner) {
  color: white;
}
</style>
