<template>
  <el-button
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

const emit = defineEmits<{
  synced: []
}>()

const dialogVisible = ref(false)
const loading = ref(false)
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
</script>
