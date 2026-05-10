<template>
  <el-dialog
    v-model="modelValue"

    title="Передати капітанство"
    width="400px"
    destroy-on-close
  >
    <div class="flex flex-col gap-4 my-10 w-full">
      <p class="text-sm text-gray-400">
        Оберіть гравця команди для передачі капітанства:
      </p>
      <el-select
        v-model="selectedPlayerId"
        class="w-full"
        placeholder="Оберіть нового капітана"
        clearable
        filterable
      >
        <el-option
          v-for="opt in teamPlayers"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>

    <template #footer>
      <div class="flex justify-end gap-10">
        <el-button @click="modelValue = false">
          Скасувати
        </el-button>
        <el-button
          :disabled="!selectedPlayerId"
          type="primary"
          @click="transferCaptaincy()"
        >
          Підтвердити
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { TTeamResponse } from '@/api/types/api.types'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  team: TTeamResponse | undefined
  teamId: string
}>()

const modelValue = defineModel<boolean>({ default: false })

const selectedPlayerId = ref<string | null>(null)

const teamPlayers = computed(() => {
  const players = [
    ...(props.team?.mainPlayers ?? []),
    ...(props.team?.reservedPlayers ?? [])
  ]
  return players.map((player) => ({
    value: player.id,
    label: player.discordName || player.discordUsername || `Гравець #${player.id}`
  }))
})

async function transferCaptaincy () {
  if (!selectedPlayerId.value || !props.teamId) return

  // TODO: endpoint not in API yet (updateTeamCapitan)
  ElMessage.info('Функціонал передачі капітанства ще не реалізований в API')
  modelValue.value = false
}
</script>
