<template>
  <el-drawer
    v-model="visible"
    title="Категорії"
    size="420"
    @closed="resetEditor"
  >
    <div class="flex flex-col gap-16 h-full">
      <el-button
        v-if="!editing"
        type="primary"
        @click="startCreate"
      >
        <PhPlus size="16" class="mr-4" />
        Нова категорія
      </el-button>

      <!-- Editor -->
      <div
        v-if="editing"
        class="flex flex-col gap-12 p-16 rounded-xl border border-white/10 bg-white/[0.03]"
      >
        <p class="text-sm font-semibold text-white">
          {{ editingId ? 'Редагувати категорію' : 'Нова категорія' }}
        </p>

        <el-input v-model="form.label" placeholder="Назва категорії" />

        <el-radio-group v-model="form.sign">
          <el-radio-button value="EXPENSE">
            Витрата
          </el-radio-button>
          <el-radio-button value="INCOME">
            Дохід
          </el-radio-button>
        </el-radio-group>

        <div class="flex flex-col gap-6">
          <span class="text-xs text-gray-400">Правила автокатегоризації (співпадіння в описі)</span>
          <el-select
            v-model="form.matchers"
            multiple
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            placeholder="Додайте ключові слова та натисніть Enter"
            class="w-full"
          >
            <el-option
              v-for="m in form.matchers"
              :key="m"
              :value="m"
              :label="m"
            />
          </el-select>
        </div>

        <div v-if="assets.length" class="flex flex-col gap-6">
          <span class="text-xs text-gray-400">Іконка (опційно)</span>
          <div class="flex gap-8 flex-wrap">
            <button
              type="button"
              class="w-36 h-36 rounded-lg overflow-hidden border flex items-center justify-center"
              :class="form.iconAssetId === null ? 'border-primary' : 'border-white/10'"
              @click="form.iconAssetId = null"
            >
              <PhProhibit size="18" class="text-gray-500" />
            </button>
            <button
              v-for="asset in assets"
              :key="asset.id"
              type="button"
              class="w-36 h-36 rounded-lg overflow-hidden border"
              :class="form.iconAssetId === asset.id ? 'border-primary' : 'border-white/10'"
              @click="form.iconAssetId = asset.id"
            >
              <el-image :src="resolveFinanceAssetUrl(asset.url)" fit="cover" class="w-full h-full" />
            </button>
          </div>
        </div>

        <div class="flex items-center gap-8 justify-end">
          <el-button size="small" @click="resetEditor">
            Скасувати
          </el-button>
          <el-button
            size="small"
            type="primary"
            :loading="saving"
            :disabled="!form.label.trim()"
            @click="submit"
          >
            Зберегти
          </el-button>
        </div>
      </div>

      <!-- List -->
      <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-8">
        <p v-if="!categories.length" class="text-sm text-gray-500 text-center py-20">
          Категорій ще немає
        </p>

        <div
          v-for="cat in categories"
          :key="cat.id"
          class="flex items-center gap-12 p-12 rounded-xl border border-white/8 bg-white/[0.02]"
        >
          <div class="shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
            <el-image v-if="cat.icon" :src="resolveFinanceAssetUrl(cat.icon.url)" fit="cover" class="w-full h-full" />
            <PhTag v-else size="16" class="text-gray-400" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-8">
              <span class="text-white font-medium truncate">{{ cat.label }}</span>
              <span
                class="shrink-0 text-[10px] uppercase tracking-wider px-6 py-2 rounded"
                :class="cat.sign === 'INCOME' ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'"
              >
                {{ cat.sign === 'INCOME' ? 'Дохід' : 'Витрата' }}
              </span>
            </div>
            <p v-if="cat.matchers.length" class="text-xs text-gray-500 mt-2 truncate">
              {{ cat.matchers.join(', ') }}
            </p>
          </div>

          <div class="flex items-center gap-4 shrink-0">
            <el-button text size="small" @click="startEdit(cat)">
              <PhPencilSimple size="16" />
            </el-button>
            <el-button text size="small" @click="confirmDelete(cat)">
              <PhTrash size="16" class="text-red-400" />
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { PhPlus, PhTag, PhPencilSimple, PhTrash, PhProhibit } from '@phosphor-icons/vue'
import type {
  TAssetView,
  TCategorySign,
  TCustomCategoryView,
  TCreateCustomCategoryPayload,
  TUpdateCustomCategoryPayload
} from '../finance.types'
import { resolveFinanceAssetUrl } from '../utils/resolve-finance-asset-url'

const props = defineProps<{
  categories: TCustomCategoryView[]
  assets?: TAssetView[]
  onCreate: (payload: TCreateCustomCategoryPayload) => Promise<void>
  onUpdate: (id: string, payload: TUpdateCustomCategoryPayload) => Promise<void>
  onDelete: (id: string) => Promise<void>
}>()

const visible = defineModel<boolean>({ default: false })

const assets = computed(() => props.assets || [])

const editing = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const form = reactive<{
  label: string
  sign: TCategorySign
  matchers: string[]
  iconAssetId: string | null
}>({
  label: '',
  sign: 'EXPENSE',
  matchers: [],
  iconAssetId: null
})

function resetEditor () {
  editing.value = false
  editingId.value = null
  saving.value = false
  form.label = ''
  form.sign = 'EXPENSE'
  form.matchers = []
  form.iconAssetId = null
}

function startCreate () {
  resetEditor()
  editing.value = true
}

function startEdit (cat: TCustomCategoryView) {
  editingId.value = cat.id
  form.label = cat.label
  form.sign = cat.sign
  form.matchers = [...cat.matchers]
  form.iconAssetId = cat.icon?.id ?? null
  editing.value = true
}

async function submit () {
  if (!form.label.trim()) return
  saving.value = true
  try {
    const payload = {
      label: form.label.trim(),
      sign: form.sign,
      matchers: form.matchers,
      iconAssetId: form.iconAssetId
    }
    if (editingId.value) {
      await props.onUpdate(editingId.value, payload)
    } else {
      await props.onCreate(payload)
    }
    resetEditor()
  } finally {
    saving.value = false
  }
}

async function confirmDelete (cat: TCustomCategoryView) {
  try {
    await ElMessageBox.confirm(
      `Видалити категорію «${cat.label}»? Операції залишаться без категорії.`,
      'Підтвердження',
      { confirmButtonText: 'Видалити', cancelButtonText: 'Скасувати', type: 'warning' }
    )
  } catch {
    return
  }
  await props.onDelete(cat.id)
  if (editingId.value === cat.id) resetEditor()
}
</script>
