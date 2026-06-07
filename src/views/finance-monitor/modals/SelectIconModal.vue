<template>
  <el-dialog
    v-model="modelValue"
    title="Обрати іконку"
    width="520"
    class="rounded-[12px]"
  >
    <div v-if="isPending" class="py-20">
      <el-skeleton :rows="3" animated />
    </div>

    <div
      v-else
      class="grid grid-cols-4 gap-12 max-h-[300px] overflow-y-auto"
    >
      <button
        v-for="asset in assets"
        :key="asset.id"
        type="button"
        class="flex flex-col items-center gap-8 p-12 rounded-xl border transition-colors"
        :class="selectedId === asset.id
          ? 'border-primary bg-primary/10'
          : 'border-white/10 hover:border-white/25'"
        @click="selectedId = asset.id"
      >
        <el-image
          :src="asset.url"
          fit="cover"
          class="w-48 h-48 rounded-lg"
        />
        <span class="text-xs text-gray-400 truncate w-full text-center">
          {{ asset.name }}
        </span>
      </button>
    </div>

    <template #footer>
      <el-button @click="modelValue = false">
        Скасувати
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!selectedId"
        @click="submit"
      >
        Зберегти
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { TAssetView } from '../finance.types'

const props = defineProps<{
  assets: TAssetView[]
  isPending?: boolean
  onSubmit: (iconAssetId: string) => Promise<void> | void
}>()

const modelValue = defineModel<boolean>({ default: false })
const selectedId = ref<string | null>(null)
const loading = ref(false)

async function submit () {
  if (!selectedId.value) return
  loading.value = true
  try {
    await props.onSubmit(selectedId.value)
    modelValue.value = false
  } finally {
    loading.value = false
  }
}
</script>
