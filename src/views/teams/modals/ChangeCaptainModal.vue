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
          :disabled="!selectedPlayerId || loading"
          :loading="loading"
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
import { teamsService } from '@/views/teams/teams.service'

const props = defineProps<{
  team: TTeamResponse | undefined
  teamId: string
  onUpdated?: (team: TTeamResponse) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const selectedPlayerId = ref<string | null>(null)
const loading = ref(false)

watch(modelValue, (open) => {
  if (open) selectedPlayerId.value = null
})

const teamPlayers = computed(() => {
  const captainId = props.team?.captain?.id
  const players = [
    ...(props.team?.mainPlayers ?? []),
    ...(props.team?.reservedPlayers ?? [])
  ].filter((p) => p.id !== captainId)
  return players.map((player) => ({
    value: player.id,
    label: player.discordName || player.discordUsername || `Гравець #${player.id}`
  }))
})

async function transferCaptaincy () {
  if (!selectedPlayerId.value || !props.teamId) return

  loading.value = true
  try {
    const updated = await teamsService.transferCaptaincy(props.teamId, selectedPlayerId.value)
    ElMessage.success('Капітанство успішно передано')
    props.onUpdated?.(updated)
    modelValue.value = false
  } catch {
    ElMessage.error('Помилка при передачі капітанства')
  } finally {
    loading.value = false
  }
}
</script>
