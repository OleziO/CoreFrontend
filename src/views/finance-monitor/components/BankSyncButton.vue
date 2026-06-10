<template>
  <el-button
    v-if="!hideTrigger"
    size="small"
    :loading="loading"
    @click="dialogVisible = true"
  >
    Синхронізація
  </el-button>

  <el-dialog
    v-model="dialogVisible"
    title="Синхронізація Monobank"
    width="420"
    class="rounded-[12px]"
  >
    <el-form label-position="top">
      <el-form-item label="Початок періоду">
        <el-date-picker
          v-model="fromDate"
          type="datetime"
          placeholder="Оберіть дату"
          class="!w-full"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="Кінець періоду (опційно)">
        <el-date-picker
          v-model="toDate"
          type="datetime"
          placeholder="До поточного моменту"
          class="!w-full"
          value-format="YYYY-MM-DD HH:mm:ss"
          clearable
        />
      </el-form-item>
    </el-form>

    <div class="mt-8 pt-12 border-t border-white/10">
      <p class="text-xs text-gray-500 mb-8">
        Перекласифікувати — повторно застосувати правила категорій та спонсорів до вже збережених транзакцій.
      </p>
      <el-button
        :loading="reclassifying"
        @click="handleReclassify"
      >
        Перекласифікувати
      </el-button>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">
        Скасувати
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!fromDate"
        @click="handleSync"
      >
        Синхронізувати
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { queryCache } from '@/core/query-cache-client'
import { financeService } from '../finance.service'

const PICKER_FORMAT = 'YYYY-MM-DD HH:mm:ss'

function toIsoUtc (pickerValue: string): string {
  return dayjs(pickerValue, PICKER_FORMAT).toISOString()
}

defineProps<{
  // Render only the dialog and let a parent open it via the exposed `open()` —
  // used when the trigger lives in a dropdown menu instead of an inline button.
  hideTrigger?: boolean
}>()

const emit = defineEmits<{
  synced: []
}>()

const dialogVisible = ref(false)

defineExpose({
  open: () => { dialogVisible.value = true }
})
const loading = ref(false)
const reclassifying = ref(false)
const fromDate = ref<string>('')
const toDate = ref<string | null>(null)

async function handleSync () {
  if (!fromDate.value) return

  loading.value = true
  try {
    const result = await financeService.syncBank({
      from: toIsoUtc(fromDate.value),
      to: toDate.value ? toIsoUtc(toDate.value) : undefined
    })
    ElMessage.success(`Синхронізовано ${result.synced} транзакцій`)
    queryCache.invalidateQueries({ key: ['finance'] })
    emit('synced')
    dialogVisible.value = false
  } catch {
    ElMessage.error('Помилка синхронізації')
  } finally {
    loading.value = false
  }
}

async function handleReclassify () {
  reclassifying.value = true
  try {
    const result = await financeService.reclassifyBank()
    ElMessage.success(`Перекласифіковано ${result.reclassified} транзакцій`)
    queryCache.invalidateQueries({ key: ['finance'] })
    emit('synced')
    dialogVisible.value = false
  } catch {
    ElMessage.error('Помилка перекласифікації')
  } finally {
    reclassifying.value = false
  }
}
</script>
