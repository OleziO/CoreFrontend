<template>
  <el-dialog
    v-model="modelValue"
    title="Перейменувати операцію"
    width="420"
    class="rounded-[12px]"
  >
    <el-input
      v-model="label"
      placeholder="Назва"
      size="large"
    />

    <template #footer>
      <el-button @click="modelValue = false">
        Скасувати
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!label.trim()"
        @click="submit"
      >
        Зберегти
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  operationId: string
  initialLabel?: string
  onSubmit: (label: string) => Promise<void> | void
}>()

const modelValue = defineModel<boolean>({ default: false })
const label = ref(props.initialLabel || '')
const loading = ref(false)

watch(() => props.initialLabel, (value) => {
  label.value = value || ''
})

async function submit () {
  if (!label.value.trim()) return
  loading.value = true
  try {
    await props.onSubmit(label.value.trim())
    modelValue.value = false
  } finally {
    loading.value = false
  }
}
</script>
