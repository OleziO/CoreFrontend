<template>
  <el-dialog
    v-model="modelValue"
    width="500"
    class="rounded-[12px]"
    title="Нарахування Points"
  >
    <div class="flex flex-col gap-20">
      <div class="flex flex-col gap-10">
        <label class="text-sm font-medium text-gray-400">
          Кількість
        </label>

        <el-input
          v-model="points"
          placeholder="Введіть кількість (напр. 100)"
          class="w-full"
          size="large"
          @input="onInput"
        >
          <template #prepend>
            <PhCoins class="text-white" size="18" />
          </template>
        </el-input>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button @click="modelValue = false">
          Скасувати
        </el-button>

        <el-button
          type="primary"
          :disabled="!isValid"
          :loading="loading"
          @click="submitForm"
        >
          Нарахувати
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhCoins } from '@phosphor-icons/vue'

const props = defineProps<{
  onSubmit: (points: number) => Promise<void> | void
}>()

const modelValue = defineModel<boolean>({ default: false })

// 1. Используем строку по умолчанию, чтобы можно было хранить просто знак "-"
const points = ref<string>('')
const loading = ref(false)

const isValid = computed(() => {
  const num = Number(points.value)
  // Проверяем: не пустая строка, не просто минус, это число, и оно не равно 0
  return points.value !== '' && points.value !== '-' && !Number.isNaN(num) && num !== 0
})

function onInput (value: string) {
  // Оставляем только цифры и минус
  let sanitized = value.replace(/[^0-9-]/g, '')

  // Запрещаем минус, если он не первый
  if (sanitized.indexOf('-') > 0) {
    sanitized = sanitized.replace(/-/g, '')
  }

  // Запрещаем больше одного минуса
  if ((sanitized.match(/-/g) || []).length > 1) {
    sanitized = '-' + sanitized.replace(/-/g, '')
  }

  // Обновляем значение (теперь это строка, поэтому "-" сохранится)
  points.value = sanitized
}

async function submitForm () {
  if (!isValid.value) return

  // 2. Превращаем в число здесь
  await props.onSubmit(Number(points.value))
}
</script>
