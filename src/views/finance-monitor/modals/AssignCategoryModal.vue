<template>
  <el-dialog
    v-model="modelValue"
    title="Категорія операції"
    width="420"
    class="rounded-[12px]"
  >
    <div class="flex flex-col gap-8 max-h-[360px] overflow-y-auto">
      <button
        type="button"
        class="flex items-center gap-12 p-12 rounded-xl border transition-colors text-left"
        :class="selectedId === null ? 'border-primary bg-white/[0.04]' : 'border-white/8 hover:bg-white/[0.03]'"
        @click="selectedId = null"
      >
        <span class="shrink-0 w-32 h-32 rounded-lg bg-white/10 flex items-center justify-center">
          <PhProhibit size="16" class="text-gray-400" />
        </span>
        <span class="text-gray-300">Без категорії</span>
      </button>

      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="flex items-center gap-12 p-12 rounded-xl border transition-colors text-left"
        :class="selectedId === cat.id ? 'border-primary bg-white/[0.04]' : 'border-white/8 hover:bg-white/[0.03]'"
        @click="selectedId = cat.id"
      >
        <span class="shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
          <el-image v-if="cat.icon" :src="resolveFinanceAssetUrl(cat.icon.url)" fit="cover" class="w-full h-full" />
          <PhTag v-else size="16" class="text-gray-400" />
        </span>
        <span class="text-white truncate">{{ cat.label }}</span>
      </button>

      <p v-if="!categories.length" class="text-sm text-gray-500 text-center py-16">
        Категорій ще немає — створіть їх через кнопку «Категорія».
      </p>
    </div>

    <template #footer>
      <el-button @click="modelValue = false">
        Скасувати
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="submit"
      >
        Застосувати
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhTag, PhProhibit } from '@phosphor-icons/vue'
import type { TCustomCategoryView } from '../finance.types'
import { resolveFinanceAssetUrl } from '../utils/resolve-finance-asset-url'

const props = defineProps<{
  categories?: TCustomCategoryView[]
  currentCategoryId?: string | null
  onSubmit: (categoryId: string | null) => Promise<void> | void
}>()

const modelValue = defineModel<boolean>({ default: false })
const categories = computed(() => props.categories || [])
const selectedId = ref<string | null>(props.currentCategoryId ?? null)
const loading = ref(false)

async function submit () {
  loading.value = true
  try {
    await props.onSubmit(selectedId.value)
    modelValue.value = false
  } finally {
    loading.value = false
  }
}
</script>
