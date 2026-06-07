<template>
  <el-dialog
    v-model="modelValue"
    title="Подати результат матчу плей-оф"
    width="420px"
    class="playoff-submit-dialog custom-dialog"
    destroy-on-close
    @open="resetForm"
  >
    <p class="text-xs text-gray-500 leading-snug mb-12 m-0">
      Введіть ID матчу Dota 2 — система визначить команди, переможця
      й автоматично просуне сітку плей-оф.
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
import { friendlyPlayoffError } from '../utils/playoff-errors.utils'
import type { TPlayoffMatch } from '@/api/types/api.types'

const props = defineProps<{
  tournamentId: string
  onSubmitted?: (match: TPlayoffMatch) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

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
  modelValue.value = false
}

function validate (): boolean {
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
    const match = await tournamentsService.submitPlayoffMatch(props.tournamentId, dotaMatchId)
    ElMessage.success('Результат матчу плей-оф збережено')
    props.onSubmitted?.(match)
    close()
  } catch (e: unknown) {
    ElMessage.error(friendlyPlayoffError(e, 'Не вдалося зберегти результат'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.playoff-submit-dialog.custom-dialog) {
  background-color: theme('colors.dark.card');
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
:deep(.playoff-submit-dialog .el-dialog__title) {
  color: white;
}
:deep(.match-id-input .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
}
:deep(.match-id-input .el-input__inner) {
  color: white;
}
</style>
