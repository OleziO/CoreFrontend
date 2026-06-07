<template>
  <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex flex-col h-full">
    <div class="px-20 py-16 border-b border-white/10 shrink-0">
      <h2 class="text-lg font-semibold text-white">
        Калькулятор прогнозу
      </h2>
    </div>

    <div v-if="isPending" class="flex-1 p-20">
      <el-skeleton :rows="10" animated />
    </div>

    <p
      v-else-if="isError"
      class="flex-1 flex items-center justify-center text-red-400 text-sm p-20"
    >
      Не вдалося завантажити прогноз
    </p>

    <div v-else class="flex-1 min-h-0 overflow-y-auto p-20 flex flex-col gap-20">
      <el-form label-position="top" class="finance-form">
        <p class="text-sm font-medium text-gray-300 mb-12">
          Кількість команд
        </p>
        <div class="grid grid-cols-3 gap-12 mb-20">
          <el-form-item
            v-for="(_, index) in form.divisions"
            :key="index"
            :label="`Дивізіон ${index + 1}`"
          >
            <el-input-number
              v-model="form.divisions[index].teamCount"
              :min="0"
              :max="99"
              class="!w-full"
              :controls="false"
            />
          </el-form-item>
        </div>

        <p class="text-sm font-medium text-gray-300 mb-12">
          Вступний внесок (грн / гравець)
        </p>
        <div class="grid grid-cols-3 gap-12 mb-20">
          <el-form-item label="Топ 1–4">
            <el-input-number
              v-model="form.fees.top1_4"
              :min="0"
              :step="10"
              class="!w-full"
              :controls="false"
            />
          </el-form-item>
          <el-form-item label="Топ 5–8">
            <el-input-number
              v-model="form.fees.top5_8"
              :min="0"
              :step="10"
              class="!w-full"
              :controls="false"
            />
          </el-form-item>
          <el-form-item label="Топ 9+">
            <el-input-number
              v-model="form.fees.top8plus"
              :min="0"
              :step="10"
              class="!w-full"
              :controls="false"
            />
          </el-form-item>
        </div>

        <el-form-item label="Відсоток у призовий фонд">
          <div class="flex items-center gap-16 w-full">
            <span class="w-24">{{ form.prizePoolPercent }}%</span>
            <el-slider
              v-model="form.prizePoolPercent"
              :min="0"
              :max="100"
              class="flex-1"
            />
          </div>
        </el-form-item>

        <p class="text-sm font-medium text-gray-300 mb-12">
          Внесок проєкту (грн)
        </p>
        <div class="grid grid-cols-3 gap-12 mb-20">
          <el-form-item
            v-for="(_, index) in form.divisions"
            :key="`contrib-${index}`"
            :label="`Дивізіон ${index + 1}`"
          >
            <el-input-number
              v-model="form.divisions[index].projectContribution"
              :min="0"
              :step="500"
              class="!w-full"
              :controls="false"
            />
          </el-form-item>
        </div>

        <el-button
          type="primary"
          class="w-full"
          :loading="isSaving"
          @click="handleSave"
        >
          Зберегти
        </el-button>
      </el-form>

      <div
        v-if="result"
        class="rounded-xl border border-white/10 bg-white/[0.03] p-16 flex flex-col gap-12"
      >
        <p class="text-sm font-medium text-gray-300">
          Результати
        </p>

        <div
          v-for="(div, index) in result.divisions"
          :key="`result-${index}`"
          class="flex justify-between text-sm"
        >
          <span class="text-gray-400">Призовий фонд Д{{ index + 1 }}</span>
          <span class="text-white font-medium">{{ formatCompactK(div.prizePool) }}</span>
        </div>

        <div class="border-t border-white/10 pt-12 flex flex-col gap-8">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Загальний призовий фонд</span>
            <span class="text-white font-semibold">{{ formatCompactK(result.totalPrizePool) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Прогнозовані витрати</span>
            <span class="text-red-400 font-semibold">-{{ formatCompactK(result.projectedExpenses) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Прогнозований прибуток</span>
            <span class="text-green-400 font-semibold">+{{ formatCompactK(result.projectedProfit) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { TForecastConfig, TForecastResult } from '../finance.types'
import { DEFAULT_FORECAST_CONFIG } from '../finance.types'
import { formatCompactK, kopecksToUah, uahToKopecks } from '../utils/format-money'

const props = defineProps<{
  config?: TForecastConfig | null
  result?: TForecastResult | null
  isPending?: boolean
  isError?: boolean
  isSaving?: boolean
}>()

const emit = defineEmits<{
  save: [config: TForecastConfig]
}>()

type TDivisionForm = { teamCount: number; projectContribution: number }

type TFormState = {
  divisions: [TDivisionForm, TDivisionForm, TDivisionForm]
  fees: { top1_4: number; top5_8: number; top8plus: number }
  prizePoolPercent: number
}

const configToForm = (config: TForecastConfig): TFormState => ({
  divisions: config.divisions.map(d => ({
    teamCount: d.teamCount,
    projectContribution: kopecksToUah(d.projectContribution)
  })) as TFormState['divisions'],
  fees: {
    top1_4: kopecksToUah(config.fees.top1_4),
    top5_8: kopecksToUah(config.fees.top5_8),
    top8plus: kopecksToUah(config.fees.top8plus)
  },
  prizePoolPercent: config.prizePoolPercent
})

const form = ref<TFormState>(configToForm(DEFAULT_FORECAST_CONFIG))

watch(
  () => props.config,
  (config) => {
    if (config) {
      form.value = configToForm(config)
    }
  },
  { immediate: true }
)

function formToConfig (): TForecastConfig {
  return {
    divisions: form.value.divisions.map(d => ({
      teamCount: d.teamCount,
      projectContribution: uahToKopecks(d.projectContribution)
    })) as TForecastConfig['divisions'],
    fees: {
      top1_4: uahToKopecks(form.value.fees.top1_4),
      top5_8: uahToKopecks(form.value.fees.top5_8),
      top8plus: uahToKopecks(form.value.fees.top8plus)
    },
    prizePoolPercent: form.value.prizePoolPercent
  }
}

function handleSave () {
  emit('save', formToConfig())
  ElMessage.success('Прогноз збережено')
}
</script>

<style scoped>
.finance-form :deep(.el-form-item__label) {
  color: #9ca3af;
}
</style>
