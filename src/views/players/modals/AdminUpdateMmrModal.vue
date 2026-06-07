<template>
  <el-dialog
    v-model="modelValue"
    width="500"
    class="rounded-[12px]"
    title="Оновлення MMP та ролей гравця"
  >
    <div class="flex flex-col gap-20">
      <!-- MMP Section -->
      <div class="flex flex-col gap-10">
        <label class="text-sm font-medium text-gray-400">
          MMP
        </label>

        <el-input
          v-model="mmr"
          type="text"
          inputmode="numeric"
          placeholder="Введіть новий MMP"
          class="w-full"
          size="large"
          @input="onNumericInput"
        />
      </div>

      <!-- Roles Section -->
      <div class="flex flex-col gap-10">
        <label class="text-sm font-medium text-gray-400">
          Ролі
        </label>

        <!-- TODO: endpoint not in API yet (getAllPlayerRoles) -->
        <div class="text-center py-10 text-gray-500">
          Управління ролями недоступне
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button @click="modelValue = false">
          Скасувати
        </el-button>

        <el-button
          type="primary"
          :disabled="isValid"
          :loading="playersStore.loading"
          @click="onSubmit"
        >
          Оновити
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { MAX_RATING } from '@/components/player-tags/player.enums'

const props = defineProps<{playerId: string}>()

const modelValue = defineModel<boolean>({ default: false })

const playersStore = usePlayersStore()

const mmr = ref<number | null>(null)

// const selectedRoleIds = ref<number[]>([])
const player = ref<TPlayer | null>(null)

const isValid = computed(() => {
  return mmr.value === null
})

function onNumericInput (newValue: number | string) {
  const value = String(newValue ?? '')

  const numeric = value.replace(/\D+/g, '')

  mmr.value = numeric === '' ? null : Math.min(Number(numeric), MAX_RATING)
}

// TODO: endpoint not in API yet (updatePlayerMMP, updatePlayerRoles, getAllPlayerRoles)
async function onSubmit () {
  ElMessage.info('Функціонал оновлення MMR ще не реалізований в API')
  modelValue.value = false
}

onMounted(async () => {
  player.value = await playersStore.findPlayer(props.playerId)
})

</script>
