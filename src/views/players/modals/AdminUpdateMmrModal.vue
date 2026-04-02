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

        <div v-if="!playersStore.allPlayerRoles" class="text-center py-10 text-gray-500">
          Немає доступних ролей
        </div>

        <div v-else class="flex flex-col gap-8">
          <el-select
            v-model="selectedRoleIds"
            multiple
            placeholder="Оберіть ролі"
            collapse-tags
            :max-collapse-tags="2"
          >
            <el-option
              v-for="role in playersStore.allPlayerRoles"
              :key="role.id"

              :value="role.id"
              :label="getRoleLabel(role.type_name)"
            />
          </el-select>
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
import { MAX_RATING } from '@/components/player-tags/player.constants'

const props = defineProps<{playerId: number}>()

const modelValue = defineModel<boolean>({ default: false })

const roleLabels: Record<string, string> = {
  admin: 'Адміністратор',
  moderator: 'Модератор',
  media: 'Медіа',
  cap: 'Капітан',
  player: 'Гравець',
  unverified: 'Не верифікований',
  blocked: 'Заблокований'
}

const playersStore = usePlayersStore()

const mmr = ref<number | null>(null)

const selectedRoleIds = ref<number[]>([])

const player = ref<TPlayer | null>(null)

const isValid = computed(() => {
  return mmr.value === null
})

function getRoleLabel (roleName: string): string {
  return roleLabels[roleName] || roleName
}

function onNumericInput (newValue: number | string) {
  const value = String(newValue ?? '')

  const numeric = value.replace(/\D+/g, '')

  mmr.value = numeric === '' ? null : Math.min(Number(numeric), MAX_RATING)
}

async function onSubmit () {
  if (mmr.value === null) {
    ElMessage.error('Введіть MMP гравця')
    return
  }

  playersStore.loading = true

  try {
    await playersStore.updatePlayerMMP(props.playerId, mmr.value)
    await playersStore.updatePlayerRoles(props.playerId, selectedRoleIds.value)

    ElMessage.success('MMR та ролі успішно оновлено')
  } finally {
    playersStore.loading = false
    modelValue.value = false
  }
}

onMounted(async () => {
  await playersStore.getAllPlayerRoles()

  player.value = await playersStore.findPlayer(props.playerId)
  mmr.value = player.value?.mmr ?? null
  selectedRoleIds.value = player.value?.roles?.map(role => role.id)
    .filter(id => playersStore.allPlayerRoles.some(role => role.id === id)) || []
})

</script>
