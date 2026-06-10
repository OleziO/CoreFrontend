<template>
  <el-dialog
    v-model="modelValue"
    title="Редагувати групу"
    width="480"
    class="rounded-[12px]"
  >
    <div class="flex flex-col gap-16">
      <div class="flex flex-col gap-6">
        <span class="text-xs text-gray-400">Назва групи</span>
        <el-input
          v-model="title"
          placeholder="Назва групи"
          size="large"
        />
      </div>

      <p class="text-sm text-gray-400">
        Операцій у групі: {{ item.operationIds.length }}
      </p>

      <div v-if="assets.length" class="flex flex-col gap-6">
        <span class="text-xs text-gray-400">Іконка (опційно)</span>
        <div class="flex gap-8 flex-wrap">
          <button
            type="button"
            class="w-40 h-40 rounded-lg border flex items-center justify-center"
            :class="iconAssetId === null ? 'border-primary bg-primary/10' : 'border-white/10'"
            @click="iconAssetId = null"
          >
            <PhProhibit size="18" class="text-gray-500" />
          </button>
          <button
            v-for="asset in assets"
            :key="asset.id"
            type="button"
            class="w-40 h-40 rounded-lg overflow-hidden border"
            :class="iconAssetId === asset.id ? 'border-primary' : 'border-white/10'"
            @click="iconAssetId = asset.id"
          >
            <el-image :src="resolveFinanceAssetUrl(asset.url)" fit="cover" class="w-full h-full" />
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
        :disabled="!title.trim()"
        @click="submit"
      >
        Зберегти
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhProhibit } from '@phosphor-icons/vue'
import type { TAssetView, TFeedItem, TUpdateOperationGroupPayload } from '../finance.types'
import { resolveFinanceAssetUrl } from '../utils/resolve-finance-asset-url'

const props = defineProps<{
  item: TFeedItem
  assets?: TAssetView[]
  onSubmit: (payload: TUpdateOperationGroupPayload) => Promise<void> | void
}>()

const modelValue = defineModel<boolean>({ default: false })

const assets = computed(() => props.assets || [])

const title = ref('')
const iconAssetId = ref<string | null>(null)
const loading = ref(false)

function resolveCurrentIconAssetId (item: TFeedItem): string | null {
  if (!item.iconUrl) return null
  const target = resolveFinanceAssetUrl(item.iconUrl)
  const match = assets.value.find(asset => resolveFinanceAssetUrl(asset.url) === target)
  return match?.id ?? null
}

watch(
  () => props.item,
  (item) => {
    if (!item) return
    title.value = item.title
    iconAssetId.value = resolveCurrentIconAssetId(item)
  },
  { immediate: true }
)

async function submit () {
  if (!title.value.trim()) return
  loading.value = true
  try {
    await props.onSubmit({
      title: title.value.trim(),
      iconAssetId: iconAssetId.value,
      operationIds: props.item.operationIds
    })
    modelValue.value = false
  } finally {
    loading.value = false
  }
}
</script>
