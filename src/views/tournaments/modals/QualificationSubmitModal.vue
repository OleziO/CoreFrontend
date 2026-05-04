<template>
  <el-dialog
    :model-value="modelValue"
    title="Подати результат матчу"
    width="480px"
    class="custom-dialog"
    destroy-on-close
    @update:model-value="closeModal"
    @open="resetForm"
  >
    <template v-if="match">
      <div class="flex justify-between gap-18 items-start bg-white/5 p-12 rounded-xl mb-12">
        <div class="min-w-0 flex-1">
          <div class="text-xs text-gray-500 uppercase font-semibold mb-4">Команда A</div>
          <div class="font-bold truncate text-white">{{ match.teamA.name }}</div>
        </div>
        <div class="text-gray-600 shrink-0 pt-16 font-bold text-sm">VS</div>
        <div class="min-w-0 flex-1 text-right">
          <div class="text-xs text-gray-500 uppercase font-semibold mb-4">Команда B</div>
          <div class="font-bold truncate text-white">{{ match.teamB.name }}</div>
        </div>
      </div>

      <el-alert
        v-if="pastRegistrationEnd"
        title="Строк закінчився — подача результату через API буде відхилена."
        type="warning"
        :closable="false"
        show-icon
        class="mb-12"
      />

      <el-form label-position="top">
        <el-form-item label="Dota Match ID" required>
          <el-input
            v-model="dotaMatchId"
            placeholder="Наприклад 7891234567"
            inputmode="numeric"
            maxlength="20"
            @input="dotaMatchId = String($event).replace(/\D/g, '')"
          />
        </el-form-item>
      </el-form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button class="!bg-transparent !border-white/10 !text-gray-300" @click="closeModal">
          Скасувати
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="pastRegistrationEnd || !dotaMatchId.trim()"
          class="!bg-cyan-600 !border-cyan-600"
          @click="submit"
        >
          Надіслати
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/api-errors'
import type { TQualificationMatch as QualificationMatch } from '@/api/types/api.types'

const props = defineProps<{
  modelValue: boolean
  tournamentId: string
  match: QualificationMatch | null
  pastRegistrationEnd: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submitted', updated: QualificationMatch): void
}>()

const dotaMatchId = ref('')
const loading = ref(false)

function resetForm () {
  dotaMatchId.value = ''
}

function closeModal () {
  emit('update:modelValue', false)
}

function hintForKnownMessage (msg: string): string | null {
  const hints: Record<string, string> = {
    'Тільки капітан однієї з команд може подати матч': 'Лише капітани цих команд можуть надсилати ID матчу.',
    'Результат цього матчу вже подано': 'Результат для цього матчу вже збережено.',
    'У лобі матчі було не 10 гравців': 'У лобі повинні бути 10 гравців.',
    'Матч тривав менше 15 хвилин': 'Матч тривав занадто коротко (менше 15 хв).',
    'Матч завершився після закінчення кваліфікаційного етапу': 'Матч був зіграний пізніше дозволеного вікна кваліфікації.',
    'ID команд у матчі не збігаються з очікуваними': 'Склад у лобі не відповідає затвердженому матчу.',
    'Не вдалося отримати дані матчу з OpenDota': 'Не вдалося отримати матч із OpenDota. Спробуйте ще раз.'
  }
  const direct = hints[msg.trim()]
  if (direct) return direct
  if (msg.includes('Гравець зі Steam ID') && msg.includes('не знайдений'))
    return 'Розходження між матчем і заявленим складом.'
  return null
}

async function submit () {
  const m = props.match
  if (!m || props.pastRegistrationEnd) return
  const idTrim = dotaMatchId.value.trim()
  if (!idTrim) {
    ElMessage.warning('Вкажіть Dota Match ID')
    return
  }
  loading.value = true
  try {
    const updated = await tournamentsService.submitQualificationMatch(props.tournamentId, m.id, idTrim)
    ElMessage.success('Результат збережено')
    emit('submitted', updated)
    closeModal()
  } catch (e: unknown) {
    const raw = getApiErrorMessage(e, 'Не вдалося зберегти результат')
    const friendly = hintForKnownMessage(raw) ?? raw
    ElMessage.error(friendly)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.custom-dialog) {
  background-color: #1e2330;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
:deep(.custom-dialog .el-dialog__title) {
  color: #fff;
}
:deep(.el-form-item__label) {
  color: #9ca3af;
}
:deep(.el-input .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
}
:deep(.el-input .el-input__inner) {
  color: #fff;
}
</style>
