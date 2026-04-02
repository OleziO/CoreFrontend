<template>
  <el-dialog
    v-model="modelValue"
    title="Результат матчу"

    width="520px"
    class="custom-dialog"
    destroy-on-close
    @open="resetForm"
  >
    <div v-if="match" class="flex flex-col gap-6">
      <!-- Teams & score -->
      <div class="grid grid-cols-2 gap-10">
        <!-- Team 1 -->
        <div
          class="p-20 rounded-xl border transition"
          :class="winner === 1
            ? 'border-green-500/50 bg-green-500/10'
            : 'border-white/10 bg-white/5'"
        >
          <div class="text-center mb-6 font-semibold truncate">
            {{ match.team1?.team_name || `Team ${match.team1_id}` }}
          </div>

          <el-input
            v-model="form.team_1_score"
            type="text"
            inputmode="numeric"
            placeholder="Перемог"
            input-style="text-align: center;"
            class="!flex-1"
            @input="onNumericInput('team_1_score')"
          />
        </div>

        <!-- Team 2 -->
        <div
          class="p-20 rounded-xl border transition"
          :class="winner === 2
            ? 'border-green-500/50 bg-green-500/10'
            : 'border-white/10 bg-white/5'"
        >
          <div class="text-center mb-6 font-semibold truncate">
            {{ match.team2?.team_name || `Team ${match.team2_id}` }}
          </div>

          <el-input
            v-model="form.team_2_score"
            type="text"
            inputmode="numeric"
            placeholder="Перемог"
            class="!flex-1"
            input-style="text-align: center;"
            @input="onNumericInput('team_2_score')"
          />
        </div>
      </div>

      <div class="text-center text-sm text-gray-400">
        Введіть рахунок (0–2). Нічия неможлива.
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button
          class="!bg-transparent !border-white/10 !text-gray-300 hover:!text-white"
          @click="modelValue = false"
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
import { ElMessage } from 'element-plus'

const props = defineProps<{
  tournamentId: number
  match: TMixOpenMatch
}>()

const modelValue = defineModel<boolean>({ default: false })

const mixStore = useMixTournamentStore()

const isLoading = ref(false)

const form = ref({
  team_1_score: 0,
  team_2_score: 0
})

const winner = computed<0 | 1 | 2>(() => {
  if (form.value.team_1_score > form.value.team_2_score) return 1
  if (form.value.team_2_score > form.value.team_1_score) return 2
  return 0
})

function resetForm () {
  form.value.team_1_score = 0
  form.value.team_2_score = 0
}

function onNumericInput (key: keyof typeof form.value) {
  const value = String(form.value[key] ?? '')

  const numeric = value.replace(/\D+/g, '')

  form.value[key] = numeric === '' ? 0 : Math.min(Number(numeric), 2)
}

async function submit () {
  if (form.value.team_1_score === form.value.team_2_score) {
    ElMessage.warning('Нічия неможлива')
    return
  }

  isLoading.value = true
  try {
    await mixStore.updateOpenMath(
      props.tournamentId,
      props.match.id,
      {
        team_1_score: form.value.team_1_score,
        team_2_score: form.value.team_2_score
      }
    )

    modelValue.value = false
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
:deep(.custom-dialog) {
  background-color: #1e2330;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
}

:deep(.custom-dialog .el-dialog__title) {
  color: #fff;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number__wrap) {
  background-color: rgba(255, 255, 255, 0.05);
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-input-number__increase),
:deep(.el-input-number__decrease) {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
