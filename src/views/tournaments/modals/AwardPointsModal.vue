<template>
  <el-dialog
    :model-value="modelValue"
    title="Нарахувати поінти команді"
    width="500px"
    class="custom-dialog"
    destroy-on-close
    @update:model-value="closeModal"
    @open="resetForm"
  >
    <div v-if="teams && teams.length > 0" class="flex flex-col gap-16">
      <el-form :model="form" label-position="top">
        <el-form-item label="Команда" required>
          <el-select
            v-model="form.teamId"
            placeholder="Оберіть команду"
            class="w-full flex flex-col gap-20"
            filterable
          >
            <el-option
              v-for="team in teams"
              :key="team.id"
              :label="team.name || `Team #${team.id}`"
              :value="team.id"
              class="h-50"
            >
              <div class="flex items-center gap-10 py-2">
                <!-- Team.avatarUrl not in API schema -->
                <span class="text-base font-medium">{{ team.name || `Team #${team.id}` }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Кількість поінтів" required>
          <el-input
            v-model="form.points"
            type="text"
            inputmode="numeric"
            placeholder="Введіть кількість поінтів на гравця"
            class="w-full"
            @input="onNumericInput"
          />
        </el-form-item>
      </el-form>
    </div>

    <div v-else class="text-center text-gray-400 py-4">
      Немає доступних команд
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
          :disabled="!form.teamId || !form.points"
          class="!bg-cyan-600 !border-cyan-600 hover:!bg-cyan-500"
          @click="submit"
        >
          Нарахувати поінти
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  tournamentId: string
  teams: TTeam[] | undefined
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success', data: { teamId: string; points: number }): void
}>()

const isLoading = ref(false)

const form = reactive({
  teamId: undefined as string | undefined,
  points: undefined as number | undefined
})

function resetForm () {
  form.teamId = undefined
  form.points = undefined
}

function closeModal () {
  emit('update:modelValue', false)
}

function onNumericInput () {
  const value = String(form.points ?? '')

  const numeric = value.replace(/\D+/g, '')

  if (numeric === '') {
    form.points = undefined
    return
  }

  const numValue = parseInt(numeric, 10)

  if (numValue > 0) {
    form.points = numValue
  } else {
    form.points = undefined
  }
}

async function submit () {
  if (!form.teamId) {
    ElMessage.warning('Оберіть команду')
    return
  }
  if (!form.points || form.points <= 0) {
    ElMessage.warning('Вкажіть кількість поінтів (більше 0)')
    return
  }

  isLoading.value = true
  try {
    // TODO: endpoint not in API yet (endTournament)
    ElMessage.info('Функціонал нарахування поінтів ще не реалізований в API')
    emit('success', {
      teamId: form.teamId,
      points: form.points
    })
    closeModal()
  } catch (error: any) {
    console.error(error)
    // Ошибка уже обработана в store
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
:deep(.el-select) {
  width: 100%;
}
:deep(.el-select .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}
:deep(.el-select .el-input__inner) {
  color: #fff;
}
:deep(.el-select-dropdown__item) {
  padding: 16px 20px;
  height: auto;
  min-height: 72px;
  line-height: 1.5;
}
:deep(.el-select-dropdown__item:hover) {
  background-color: rgba(255, 255, 255, 0.1);
}
:deep(.el-select-dropdown__item.is-selected) {
  background-color: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
}
</style>
