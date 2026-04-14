<template>
  <el-dialog
    :model-value="modelValue"
    title="Вказати результат матчу"
    width="500px"
    class="custom-dialog"
    destroy-on-close
    @update:model-value="closeModal"
    @open="resetForm"
  >
    <div v-if="match" class="flex flex-col gap-6">
      <div class="flex justify-between items-center bg-white/5 p-4 rounded-lg">
        <div class="text-center w-1/3">
          <div class="font-bold text-lg truncate px-5">{{ match.team1?.team_name || `Team #${match.team1?.id}` }}</div>
        </div>
        <div class="text-gray-500 font-bold">VS</div>
        <div class="text-center w-1/3">
          <div class="font-bold text-lg truncate px-5">{{ match.team2?.team_name || `Team #${match.team2?.id}` }}</div>
        </div>
      </div>

      <el-form :model="form" label-position="top">
        <el-form-item label="Рахунок команди 1" required>
          <el-input
            v-model="form.team_1_score"
            type="text"
            inputmode="numeric"
            placeholder="Введіть рахунок"
            class="w-full"
            @input="onNumericInput('team_1_score')"
          />
        </el-form-item>

        <el-form-item label="Рахунок команди 2" required>
          <el-input
            v-model="form.team_2_score"
            type="text"
            inputmode="numeric"
            placeholder="Введіть рахунок"
            class="w-full"
            @input="onNumericInput('team_2_score')"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <el-button
          class="!bg-transparent !border-white/10 !text-gray-300 hover:!text-white"
          @click="closeModal"
        >
          Скасувати
        </el-button>
        <el-button
          type="primary"
          :loading="isLoading"
          class="!bg-cyan-600 !border-cyan-600 hover:!bg-cyan-500"
          @click="submit"
        >
          Зберегти результат
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  tournamentId: string
  match: any | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success', matches: any[]): void
}>()

const isLoading = ref(false)

const form = reactive({
  team_1_score: undefined as number | undefined,
  team_2_score: undefined as number | undefined
})

function resetForm () {
  form.team_1_score = undefined
  form.team_2_score = undefined
}

function closeModal () {
  emit('update:modelValue', false)
}

function onNumericInput (key: 'team_1_score' | 'team_2_score') {
  const value = String(form[key] ?? '')

  const numeric = value.replace(/\D+/g, '')

  if (numeric === '') {
    form[key] = undefined
    return
  }

  const numValue = parseInt(numeric, 10)

  if (numValue > 0) {
    form[key] = numValue
  } else {
    form[key] = undefined
  }
}

async function submit () {
  if (form.team_1_score === undefined || form.team_1_score === null) {
    ElMessage.warning('Вкажіть рахунок команди 1')
    return
  }
  if (form.team_2_score === undefined || form.team_2_score === null) {
    ElMessage.warning('Вкажіть рахунок команди 2')
    return
  }
  if (form.team_1_score === form.team_2_score) {
    ElMessage.warning('Рахунок команди 1 не може бути рівний рахунку команди 2')
    return
  }

  isLoading.value = true
  try {
    // TODO: endpoint not in API yet (updateMatchResult)
    ElMessage.info('Функціонал оновлення результату матчу ще не реалізований в API')
    closeModal()
  } catch (error: any) {
    console.error(error)
    const errorMessage = error?.response?.data?.detail ||
                        error?.response?.data?.message ||
                        'Помилка при оновленні результату матчу'
    ElMessage.error(errorMessage)
  } finally {
    isLoading.value = false
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
:deep(.el-input) {
  width: 100%;
}
:deep(.el-input .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}
:deep(.el-input .el-input__inner) {
  color: #fff;
}
</style>
