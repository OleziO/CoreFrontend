<template>
  <el-dialog
    v-model="modelValue"
    title="Пошук MIX гравців"
    width="450px"
    class="custom-dialog"
    destroy-on-close
    @open="resetForm"
  >
    <div class="flex flex-col gap-6">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="!bg-gray-800/50 !border-gray-700"
      >
        <template #default>
          <span class="text-gray-400 text-xs">
            Це відправить сповіщення всім гравцям, які підходять під критерії MMR та ще не зареєстровані в турнірі.
          </span>
        </template>
      </el-alert>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-xs text-gray-400 font-medium ml-1">MMR від</label>
          <el-input-number
            v-model="form.min_mmr"
            :min="0"
            :max="21000"
            :step="100"
            placeholder="0"
            class="w-full"
            controls-position="right"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs text-gray-400 font-medium ml-1">MMR до</label>
          <el-input-number
            v-model="form.max_mmr"
            :min="1"
            :max="22000"
            :step="100"
            placeholder="15000"
            class="w-full"
            controls-position="right"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 pt-4">
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
          Сповістити
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { mixTournamentsService } from '../mix-tournaments.service'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  tournamentId: number
}>()

const modelValue = defineModel<boolean>({ default: false })

const isLoading = ref(false)
const form = reactive({
  min_mmr: 0,
  max_mmr: 10000
})

function resetForm () {
  form.min_mmr = 0
  form.max_mmr = 10000
}

async function submit () {
  if (form.min_mmr > form.max_mmr) {
    ElMessage.warning('Мінімальний MMR не може бути більшим за максимальний')
    return
  }

  isLoading.value = true

  try {
    await mixTournamentsService.sendMixNotification({
      tournament_id: props.tournamentId,
      mmr_start: form.min_mmr,
      mmr_end: form.max_mmr,
      message: 'Шукаємо гравців для MIX турніру'
    })

    modelValue.value = false
  } catch (e) {
    console.error(e)
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
:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
:deep(.el-input__inner) {
  color: white;
}
</style>
