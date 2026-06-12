<template>
  <el-dialog
    v-model="modelValue"
    title="Редагувати операцію"
    width="520"
    class="rounded-[12px]"
  >
    <div class="flex flex-col gap-16">
      <div class="flex flex-col gap-6">
        <span class="text-xs text-gray-400">Назва</span>
        <el-input
          v-model="title"
          placeholder="Назва операції"
          size="large"
        />
      </div>

      <div class="flex flex-col gap-6">
        <span class="text-xs text-gray-400">Категорія</span>
        <el-select
          v-model="categoryId"
          clearable
          placeholder="Без категорії"
          class="w-full"
          :value-on-clear="null"
        >
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :value="cat.id"
            :label="cat.label"
          />
        </el-select>
      </div>

      <div class="flex flex-col gap-6">
        <span class="text-xs text-gray-400">Коментар (опційно)</span>
        <el-input
          v-model="comment"
          type="textarea"
          :rows="2"
          placeholder="Внутрішня примітка"
        />
      </div>

      <div v-if="assets.length" class="flex flex-col gap-6">
        <span class="text-xs text-gray-400">Іконка (опційно)</span>
        <div class="grid grid-cols-6 gap-8 max-h-[200px] overflow-y-auto">
          <button
            type="button"
            class="w-40 h-40 rounded-lg border flex items-center justify-center"
            :class="iconAssetId === null ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/25'"
            @click="iconAssetId = null"
          >
            <PhProhibit size="18" class="text-gray-500" />
          </button>
          <button
            v-for="asset in assets"
            :key="asset.id"
            type="button"
            class="w-40 h-40 rounded-lg overflow-hidden border"
            :class="iconAssetId === asset.id ? 'border-primary' : 'border-white/10 hover:border-white/25'"
            @click="iconAssetId = asset.id"
          >
            <el-image :src="resolveFinanceAssetUrl(asset.url)" fit="cover" class="w-full h-full" />
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-300">Прихована операція</span>
        <el-switch v-model="isHidden" />
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
import type { TAssetView, TCustomCategoryView, TFeedItem, TUpdateOperationPayload } from '../finance.types'
import { resolveFinanceAssetUrl } from '../utils/resolve-finance-asset-url'

const props = defineProps<{
  item: TFeedItem
  categories?: TCustomCategoryView[]
  assets?: TAssetView[]
  onSubmit: (payload: TUpdateOperationPayload) => Promise<void> | void
}>()

const modelValue = defineModel<boolean>({ default: false })

const categories = computed(() => props.categories || [])
const assets = computed(() => props.assets || [])

const title = ref('')
const categoryId = ref<string | null>(null)
const comment = ref('')
const iconAssetId = ref<string | null>(null)
const isHidden = ref(false)
const loading = ref(false)

/**
 * The feed exposes a resolved `iconUrl`, not the source asset id — recover the id by
 * matching the resolved URLs so the current icon is pre-selected in the picker.
 */
function resolveCurrentIconAssetId (item: TFeedItem): string | null {
  if (!item.iconUrl) return null
  const target = resolveFinanceAssetUrl(item.iconUrl)
  const match = assets.value.find(asset => resolveFinanceAssetUrl(asset.url) === target)
  return match?.id ?? null
}

function hydrate (item: TFeedItem) {
  title.value = item.title
  categoryId.value = item.category?.id ?? null
  // The feed does not return the operation comment — it starts empty on each edit.
  comment.value = ''
  iconAssetId.value = resolveCurrentIconAssetId(item)
  isHidden.value = item.isHidden
}

watch(
  () => props.item,
  (item) => item && hydrate(item),
  { immediate: true }
)

async function submit () {
  if (!title.value.trim()) return
  loading.value = true
  try {
    await props.onSubmit({
      title: title.value.trim(),
      categoryId: categoryId.value,
      comment: comment.value.trim() ? comment.value.trim() : null,
      iconAssetId: iconAssetId.value,
      isHidden: isHidden.value
    })
    modelValue.value = false
  } finally {
    loading.value = false
  }
}
</script>
