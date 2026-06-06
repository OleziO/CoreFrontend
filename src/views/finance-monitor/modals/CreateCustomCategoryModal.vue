<template>
  <el-dialog
    v-model="modelValue"
    title="Нова категорія"
    width="480"
    class="rounded-[12px]"
  >
    <div class="flex flex-col gap-16">
      <el-input
        v-model="label"
        placeholder="Назва категорії"
        size="large"
      />

      <div v-if="assets.length" class="flex flex-col gap-8">
        <p class="text-sm text-gray-400">
          Іконка (опційно)
        </p>
        <div class="flex gap-8 flex-wrap">
          <button
            v-for="asset in assets"
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
        :disabled="!label.trim()"
        @click="submit"
      >
        Створити
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { AssetView } from '../finance.types'

const props = defineProps<{
  assets?: AssetView[]
  onSubmit: (payload: { label: string; iconAssetId?: string | null }) => Promise<void> | void
}>()

const modelValue = defineModel<boolean>({ default: false })
const label = ref('')
const iconAssetId = ref<string | null>(null)
const loading = ref(false)

const assets = computed(() => props.assets || [])

async function submit () {
  if (!label.value.trim()) return
  loading.value = true
  try {
    await props.onSubmit({
      label: label.value.trim(),
      iconAssetId: iconAssetId.value
    })
    modelValue.value = false
    label.value = ''
    iconAssetId.value = null
  } finally {
    loading.value = false
  }
}
</script>
