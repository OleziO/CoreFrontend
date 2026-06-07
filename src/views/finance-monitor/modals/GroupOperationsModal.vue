<template>
  <el-dialog
    v-model="modelValue"
    title="Групувати операції"
    width="480"
    class="rounded-[12px]"
  >
    <div class="flex flex-col gap-16">
      <el-input
        v-model="title"
        placeholder="Назва групи"
        size="large"
      />

      <p class="text-sm text-gray-400">
        Обрано операцій: {{ operationIds.length }}
      </p>

      <div v-if="assets.length" class="flex flex-col gap-8">
        <p class="text-sm text-gray-400">
          Іконка (опційно)
        </p>
        <div class="flex gap-8 flex-wrap">
          <button
            v-for="asset in assets.slice(0, 8)"
            :key="asset.id"
            type="button"
            class="w-40 h-40 rounded-lg overflow-hidden border"
            :class="iconAssetId === asset.id ? 'border-primary' : 'border-white/10'"
            @click="iconAssetId = asset.id"
          >
            <el-image :src="asset.url" fit="cover" class="w-full h-full" />
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="modelValue = false">
        Скасувати
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!title.trim() || !operationIds.length"
        @click="submit"
      >
        Створити групу
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { TAssetView } from '../finance.types'

const props = defineProps<{
  operationIds: string[]
  assets?: TAssetView[]
  onSubmit: (payload: { title: string; iconAssetId?: string }) => Promise<void> | void
}>()

const modelValue = defineModel<boolean>({ default: false })
const title = ref('')
const iconAssetId = ref<string | undefined>()
const loading = ref(false)

const assets = computed(() => props.assets || [])

async function submit () {
  if (!title.value.trim() || !props.operationIds.length) return
  loading.value = true
  try {
    await props.onSubmit({
      title: title.value.trim(),
      iconAssetId: iconAssetId.value
    })
    modelValue.value = false
    title.value = ''
    iconAssetId.value = undefined
  } finally {
    loading.value = false
  }
}
</script>
